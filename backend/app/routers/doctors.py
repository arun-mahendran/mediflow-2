from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_doctor
from app.models.models import (
    Consultation,
    Department,
    Doctor,
    DoctorAvailability,
    Patient,
    QueueEntry,
    QueueStatus,
    User,
)
from app.schemas.schemas import (
    ConsultationOut,
    DoctorAvailabilityUpdate,
    DoctorDashboardOut,
    DoctorProfileOut,
    DoctorProfileUpdate,
    EnrichedQueueEntryOut,
    PatientProfileOut,
    ProfileOut,
    QueueEntryOut,
)
from app.services.queue_service import call_next, sorted_waiting

router = APIRouter(prefix="/doctors", tags=["doctors"])


def _get_doctor_or_404(db: Session, user: User) -> Doctor:
    doctor = db.query(Doctor).filter(Doctor.user_id == user.id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    return doctor


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


def _enriched_out(db: Session, entry: QueueEntry) -> EnrichedQueueEntryOut:
    base = _queue_out(db, entry)
    patient = db.query(Patient).filter(Patient.id == entry.patient_id).first()
    consult = (
        db.query(Consultation)
        .filter(Consultation.queue_id == entry.id)
        .order_by(Consultation.started_at.desc())
        .first()
    )
    consult_out = None
    if consult:
        patient_name = None
        if patient:
            u = db.query(User).filter(User.id == patient.user_id).first()
            patient_name = u.name if u else None
        consult_out = ConsultationOut(
            id=consult.id,
            queue_id=consult.queue_id,
            doctor_id=consult.doctor_id,
            patient_id=consult.patient_id,
            patient_name=patient_name,
            notes=consult.notes,
            diagnosis=consult.diagnosis,
            prescription=consult.prescription,
            started_at=consult.started_at,
            completed_at=consult.completed_at,
        )
    return EnrichedQueueEntryOut(
        **base.model_dump(),
        department=base.department_name,
        patientName=base.patient_name,
        patientAge=patient.age if patient else None,
        patientGender=patient.gender if patient else None,
        consult=consult_out,
    )


def _profile_out(db: Session, doctor: Doctor, user: User) -> DoctorProfileOut:
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
        name=user.name,
        email=user.email,
    )


@router.get("/dashboard", response_model=DoctorDashboardOut)
def dashboard(db: Session = Depends(get_db), current_user: User = Depends(require_doctor)):
    doctor = _get_doctor_or_404(db, current_user)

    departments = db.query(Department).order_by(Department.name).all()
    patients = db.query(Patient).all()
    users = db.query(User).all()
    profiles = [ProfileOut(id=u.id, name=u.name, email=u.email) for u in users]

    entries = db.query(QueueEntry).filter(
        QueueEntry.status.in_(
            [QueueStatus.WAITING, QueueStatus.CALLED, QueueStatus.IN_CONSULTATION, QueueStatus.COMPLETED]
        )
    ).all()
    db.commit()

    return DoctorDashboardOut(
        doctor=_profile_out(db, doctor, current_user),
        departments=departments,
        patients=[
            PatientProfileOut(
                id=p.id,
                user_id=p.user_id,
                age=p.age,
                gender=p.gender,
                phone=p.phone,
            )
            for p in patients
        ],
        profiles=profiles,
        queue=[_queue_out(db, e) for e in entries],
    )


@router.get("/queue", response_model=List[EnrichedQueueEntryOut])
def doctor_queue(db: Session = Depends(get_db), current_user: User = Depends(require_doctor)):
    entries = db.query(QueueEntry).filter(
        QueueEntry.status.in_(
            [QueueStatus.WAITING, QueueStatus.CALLED, QueueStatus.IN_CONSULTATION, QueueStatus.COMPLETED]
        )
    ).all()
    waiting = [e for e in entries if e.status in (QueueStatus.WAITING, QueueStatus.CALLED)]
    ordered = sorted_waiting(waiting) + [e for e in entries if e.status not in (QueueStatus.WAITING, QueueStatus.CALLED)]
    db.commit()
    return [_enriched_out(db, e) for e in ordered]


@router.put("/availability", response_model=DoctorProfileOut)
def update_availability(
    payload: DoctorAvailabilityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor),
):
    doctor = _get_doctor_or_404(db, current_user)
    doctor.availability = payload.availability
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    return _profile_out(db, doctor, current_user)


@router.post("/call-next", response_model=Optional[QueueEntryOut])
def call_next_patient(db: Session = Depends(get_db), current_user: User = Depends(require_doctor)):
    doctor = _get_doctor_or_404(db, current_user)
    entry = call_next(db, doctor)
    if not entry:
        return None
    return _queue_out(db, entry)


@router.get("/profile", response_model=DoctorProfileOut)
def get_profile(db: Session = Depends(get_db), current_user: User = Depends(require_doctor)):
    doctor = _get_doctor_or_404(db, current_user)
    return _profile_out(db, doctor, current_user)


@router.put("/profile", response_model=DoctorProfileOut)
def update_profile(
    payload: DoctorProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor),
):
    doctor = _get_doctor_or_404(db, current_user)
    if payload.specialization is not None:
        doctor.specialization = payload.specialization
    if payload.license_number is not None:
        doctor.license_number = payload.license_number
    if payload.department_id is not None:
        doctor.department_id = payload.department_id or None
    if payload.name is not None:
        current_user.name = payload.name
    if payload.phone is not None:
        current_user.phone = payload.phone

    db.add(doctor)
    db.add(current_user)
    db.commit()
    db.refresh(doctor)
    db.refresh(current_user)
    return _profile_out(db, doctor, current_user)
