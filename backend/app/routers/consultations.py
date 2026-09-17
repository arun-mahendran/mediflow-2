from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_doctor, require_patient
from app.models.models import (
    Consultation,
    Doctor,
    DoctorAvailability,
    Patient,
    QueueEntry,
    QueueStatus,
    User,
)
from app.schemas.schemas import (
    ConsultationCompleteRequest,
    ConsultationHistoryOut,
    ConsultationOut,
    ConsultationStartRequest,
    QueueEntryOut,
)

router = APIRouter(prefix="/consultations", tags=["consultations"])


def _to_out(db: Session, consultation: Consultation) -> ConsultationOut:
    patient = db.query(Patient).filter(Patient.id == consultation.patient_id).first()
    patient_name = None
    if patient:
        u = db.query(User).filter(User.id == patient.user_id).first()
        patient_name = u.name if u else None
    return ConsultationOut(
        id=consultation.id,
        queue_id=consultation.queue_id,
        doctor_id=consultation.doctor_id,
        patient_id=consultation.patient_id,
        patient_name=patient_name,
        notes=consultation.notes,
        diagnosis=consultation.diagnosis,
        prescription=consultation.prescription,
        started_at=consultation.started_at,
        completed_at=consultation.completed_at,
    )


def _queue_to_out(db: Session, entry: QueueEntry) -> QueueEntryOut:
    from app.models.models import Department

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


@router.post("", response_model=ConsultationOut)
def start_consultation(
    payload: ConsultationStartRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor),
):
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found")

    entry = db.query(QueueEntry).filter(QueueEntry.id == payload.queue_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Queue entry not found")
    if entry.status not in (QueueStatus.CALLED, QueueStatus.WAITING):
        raise HTTPException(status_code=400, detail="Queue entry is not available to start")

    entry.status = QueueStatus.IN_CONSULTATION
    entry.doctor_id = doctor.id
    if not entry.called_at:
        entry.called_at = datetime.utcnow()
    db.add(entry)

    consultation = Consultation(
        queue_id=entry.id,
        doctor_id=doctor.id,
        patient_id=entry.patient_id,
        started_at=datetime.utcnow(),
    )
    db.add(consultation)

    doctor.availability = DoctorAvailability.BUSY
    db.add(doctor)

    db.commit()
    db.refresh(consultation)
    return _to_out(db, consultation)


@router.put("/{consultation_id}/complete", response_model=ConsultationOut)
def complete_consultation(
    consultation_id: str,
    payload: ConsultationCompleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor),
):
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found")

    consultation = (
        db.query(Consultation)
        .filter(Consultation.id == consultation_id, Consultation.doctor_id == doctor.id)
        .first()
    )
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")

    consultation.notes = payload.notes
    consultation.diagnosis = payload.diagnosis
    consultation.prescription = payload.prescription
    consultation.completed_at = datetime.utcnow()
    db.add(consultation)

    entry = db.query(QueueEntry).filter(QueueEntry.id == consultation.queue_id).first()
    if entry:
        entry.status = QueueStatus.COMPLETED
        entry.completed_at = datetime.utcnow()
        db.add(entry)

    doctor.availability = DoctorAvailability.AVAILABLE
    db.add(doctor)

    db.commit()
    db.refresh(consultation)
    return _to_out(db, consultation)


@router.get("", response_model=List[ConsultationOut])
def my_doctor_consultations(
    db: Session = Depends(get_db), current_user: User = Depends(require_doctor)
):
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    consultations = (
        db.query(Consultation)
        .filter(Consultation.doctor_id == doctor.id)
        .order_by(Consultation.started_at.desc())
        .all()
    )
    return [_to_out(db, c) for c in consultations]


@router.get("/mine", response_model=ConsultationHistoryOut)
def my_patient_history(
    db: Session = Depends(get_db), current_user: User = Depends(require_patient)
):
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    entries = (
        db.query(QueueEntry)
        .filter(QueueEntry.patient_id == patient.id)
        .order_by(QueueEntry.created_at.desc())
        .all()
    )
    consultations = (
        db.query(Consultation)
        .filter(Consultation.patient_id == patient.id)
        .order_by(Consultation.started_at.desc())
        .all()
    )
    return ConsultationHistoryOut(
        entries=[_queue_to_out(db, e) for e in entries],
        consults=[_to_out(db, c) for c in consultations],
    )
