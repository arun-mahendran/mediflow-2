from collections import defaultdict
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_admin
from app.models.models import (
    ApprovalStatus,
    Consultation,
    Department,
    Doctor,
    DoctorApplication,
    Patient,
    QueueEntry,
    QueueStatus,
    User,
)
from app.schemas.schemas import (
    AdminDashboardOut,
    AdminDoctorOut,
    ConsultationBriefOut,
    DoctorApplicationOut,
    DoctorApplicationReview,
    DoctorDepartmentUpdate,
    DoctorProfileOut,
    EnrichedQueueEntryOut,
    PatientProfileOut,
    ProfileOut,
    QueueEntryOut,
)
from app.routers.doctors import _enriched_out

router = APIRouter(prefix="/admin", tags=["admin"])


def _doctor_out(db: Session, doctor: Doctor) -> DoctorProfileOut:
    user = db.query(User).filter(User.id == doctor.user_id).first()
    department_name = None
    if doctor.department_id:
        dep = db.query(Department).filter(Department.id == doctor.department_id).first()
        department_name = dep.name if dep else None
    return DoctorProfileOut(
        id=doctor.id,
        user_id=doctor.user_id,
        specialization=doctor.specialization,
        license_number=doctor.license_number,
        department_id=doctor.department_id,
        department_name=department_name,
        availability=doctor.availability,
        name=user.name if user else None,
        email=user.email if user else None,
    )


def _admin_doctor_out(db: Session, doctor: Doctor) -> AdminDoctorOut:
    user = db.query(User).filter(User.id == doctor.user_id).first()
    department_name = None
    if doctor.department_id:
        dep = db.query(Department).filter(Department.id == doctor.department_id).first()
        department_name = dep.name if dep else None
    consultations = db.query(Consultation).filter(Consultation.doctor_id == doctor.id).count()
    return AdminDoctorOut(
        id=doctor.id,
        user_id=doctor.user_id,
        specialization=doctor.specialization,
        department_id=doctor.department_id,
        availability=doctor.availability,
        name=user.name if user else None,
        email=user.email if user else None,
        department=department_name,
        consultations=consultations,
    )


def _queue_out(db: Session, entry: QueueEntry) -> QueueEntryOut:
    patient = db.query(Patient).filter(Patient.id == entry.patient_id).first()
    patient_name = None
    if patient:
        u = db.query(User).filter(User.id == patient.user_id).first()
        patient_name = u.name if u else None
    department_name = None
    if entry.department_id:
        dep = db.query(Department).filter(Department.id == entry.department_id).first()
        department_name = dep.name if dep else None
    return QueueEntryOut(
        id=entry.id,
        queue_number=entry.queue_number,
        patient_id=entry.patient_id,
        patient_name=patient_name,
        doctor_id=entry.doctor_id,
        department_id=entry.department_id,
        department_name=department_name,
        symptoms=entry.symptoms,
        urgency=entry.urgency,
        ai_reason=entry.ai_reason,
        priority_score=entry.priority_score,
        status=entry.status,
        created_at=entry.created_at,
        called_at=entry.called_at,
        completed_at=entry.completed_at,
    )


@router.get("/dashboard", response_model=AdminDashboardOut)
def dashboard(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    entries = db.query(QueueEntry).order_by(QueueEntry.created_at.desc()).all()
    doctors = db.query(Doctor).all()
    departments = db.query(Department).order_by(Department.name).all()
    users = db.query(User).all()
    consultations = db.query(Consultation).all()
    patients = db.query(Patient).all()

    return AdminDashboardOut(
        queue=[_queue_out(db, e) for e in entries],
        doctors=[_doctor_out(db, d) for d in doctors],
        departments=departments,
        profiles=[ProfileOut(id=u.id, name=u.name, email=u.email) for u in users],
        consultations=[
            ConsultationBriefOut(
                id=c.id, doctor_id=c.doctor_id, started_at=c.started_at, completed_at=c.completed_at
            )
            for c in consultations
        ],
        patients=[
            PatientProfileOut(id=p.id, user_id=p.user_id, age=p.age, gender=p.gender, phone=p.phone)
            for p in patients
        ],
    )


@router.get("/patients", response_model=List[PatientProfileOut])
def list_patients(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    patients = db.query(Patient).all()
    result = []
    for p in patients:
        u = db.query(User).filter(User.id == p.user_id).first()
        result.append(
            PatientProfileOut(
                id=p.id,
                user_id=p.user_id,
                age=p.age,
                gender=p.gender,
                phone=p.phone,
                name=u.name if u else None,
                email=u.email if u else None,
            )
        )
    return result


@router.get("/doctors", response_model=List[AdminDoctorOut])
def list_doctors(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    doctors = db.query(Doctor).all()
    return [_admin_doctor_out(db, d) for d in doctors]


@router.put("/doctors/{doctor_id}/department", response_model=DoctorProfileOut)
def update_doctor_department(
    doctor_id: str,
    payload: DoctorDepartmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    if payload.department_id:
        department = db.query(Department).filter(Department.id == payload.department_id).first()
        if not department:
            raise HTTPException(status_code=404, detail="Department not found")
        doctor.department_id = department.id
    else:
        doctor.department_id = None
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    return _doctor_out(db, doctor)


@router.get("/pending-doctors", response_model=List[DoctorApplicationOut])
def pending_doctors(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    apps = (
        db.query(DoctorApplication)
        .filter(DoctorApplication.status == ApprovalStatus.PENDING)
        .all()
    )
    return apps


@router.put("/doctors/{application_id}/approve")
def approve_doctor(
    application_id: str,
    payload: DoctorApplicationReview,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    application = db.query(DoctorApplication).filter(DoctorApplication.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Doctor application not found")

    user = db.query(User).filter(User.id == application.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    application.status = ApprovalStatus.APPROVED
    application.review_note = payload.note
    application.reviewed_by = current_user.id
    application.reviewed_at = datetime.utcnow()
    db.add(application)

    user.approval_status = ApprovalStatus.APPROVED
    db.add(user)

    db.commit()
    return {"ok": True, "status": "APPROVED"}


@router.put("/doctors/{application_id}/reject")
def reject_doctor(
    application_id: str,
    payload: DoctorApplicationReview,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    application = db.query(DoctorApplication).filter(DoctorApplication.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Doctor application not found")

    user = db.query(User).filter(User.id == application.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    application.status = ApprovalStatus.REJECTED
    application.review_note = payload.note
    application.reviewed_by = current_user.id
    application.reviewed_at = datetime.utcnow()
    db.add(application)

    user.approval_status = ApprovalStatus.REJECTED
    db.add(user)

    db.commit()
    return {"ok": True, "status": "REJECTED"}


@router.get("/queue", response_model=List[EnrichedQueueEntryOut])
def admin_queue(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    entries = db.query(QueueEntry).order_by(QueueEntry.created_at.desc()).all()
    return [_enriched_out(db, e) for e in entries]


@router.get("/analytics")
def analytics(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    entries = db.query(QueueEntry).all()
    departments = db.query(Department).order_by(Department.name).all()

    by_urgency = []
    for urgency in ["EMERGENCY", "HIGH", "MEDIUM", "LOW"]:
        by_urgency.append(
            {
                "name": urgency.capitalize(),
                "value": sum(1 for e in entries if e.urgency.value == urgency),
            }
        )

    by_department = []
    for dep in departments:
        by_department.append(
            {
                "name": dep.name,
                "patients": sum(1 for e in entries if e.department_id == dep.id),
            }
        )

    hourly = defaultdict(int)
    now = datetime.utcnow()
    for e in entries:
        hourly[e.created_at.strftime("%H:00")] += 1
    hours = [{"name": h, "patients": c} for h, c in sorted(hourly.items())]

    return {
        "byUrgency": by_urgency,
        "byDepartment": by_department,
        "hours": hours,
    }
