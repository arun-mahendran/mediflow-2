from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_patient
from app.models.models import (
    Department,
    Doctor,
    DoctorAvailability,
    Patient,
    QueueEntry,
    QueueStatus,
    User,
)
from app.schemas.schemas import (
    QueueDoctorBrief,
    QueueEntryOut,
    QueueJoinRequest,
    QueueStatusOut,
    QueueWaitingRow,
)
from app.services.queue_service import (
    estimated_wait_minutes,
    live_priority,
    next_queue_number,
    sorted_waiting,
)

router = APIRouter(prefix="/queue", tags=["queue"])


def _to_out(db: Session, entry: QueueEntry) -> QueueEntryOut:
    patient = db.query(Patient).filter(Patient.id == entry.patient_id).first()
    patient_name = None
    if patient:
        user = db.query(User).filter(User.id == patient.user_id).first()
        patient_name = user.name if user else None

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


@router.post("/join", response_model=QueueEntryOut)
def join_queue(
    payload: QueueJoinRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_patient),
):
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    existing_active = (
        db.query(QueueEntry)
        .filter(
            QueueEntry.patient_id == patient.id,
            QueueEntry.status.in_(
                [QueueStatus.WAITING, QueueStatus.CALLED, QueueStatus.IN_CONSULTATION]
            ),
        )
        .first()
    )
    if existing_active:
        raise HTTPException(status_code=400, detail="You already have an active queue entry")

    department_id = None
    if payload.department_id:
        dep = db.query(Department).filter(Department.id == payload.department_id).first()
        department_id = dep.id if dep else None

    from app.models.models import UrgencyLevel

    entry = QueueEntry(
        queue_number=next_queue_number(db),
        patient_id=patient.id,
        department_id=department_id,
        symptoms=payload.symptoms,
        urgency=payload.urgency or UrgencyLevel.MEDIUM,
        ai_reason=payload.reason,
        status=QueueStatus.WAITING,
    )
    entry.priority_score = live_priority(entry)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return _to_out(db, entry)


@router.get("/my-status", response_model=QueueStatusOut)
def my_status(db: Session = Depends(get_db), current_user: User = Depends(require_patient)):
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    entry = (
        db.query(QueueEntry)
        .filter(
            QueueEntry.patient_id == patient.id,
            QueueEntry.status.in_(
                [QueueStatus.WAITING, QueueStatus.CALLED, QueueStatus.IN_CONSULTATION]
            ),
        )
        .order_by(QueueEntry.created_at.desc())
        .first()
    )

    waiting_entries = db.query(QueueEntry).filter(QueueEntry.status == QueueStatus.WAITING).all()
    ordered = sorted_waiting(waiting_entries)
    db.commit()

    departments = db.query(Department).order_by(Department.name).all()
    doctors = db.query(Doctor).all()

    waiting_rows = [
        QueueWaitingRow(
            id=e.id,
            urgency=e.urgency,
            created_at=e.created_at,
            department_id=e.department_id,
        )
        for e in ordered
    ]
    doctor_rows = [
        QueueDoctorBrief(
            id=d.id,
            specialization=d.specialization,
            availability=d.availability,
            user_id=d.user_id,
        )
        for d in doctors
    ]

    current_out = _to_out(db, entry) if entry else None

    return QueueStatusOut(
        current=current_out,
        waiting=waiting_rows,
        departments=departments,
        doctors=doctor_rows,
    )


@router.get("", response_model=List[QueueEntryOut])
def list_queue(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    entries = db.query(QueueEntry).filter(
        QueueEntry.status.in_([QueueStatus.WAITING, QueueStatus.CALLED, QueueStatus.IN_CONSULTATION])
    ).all()
    ordered = sorted_waiting(entries) + [
        e for e in entries if e.status == QueueStatus.IN_CONSULTATION
    ]
    db.commit()
    return [_to_out(db, e) for e in ordered]
