from datetime import datetime
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.models import (
    Doctor,
    DoctorAvailability,
    QueueEntry,
    QueueStatus,
    UrgencyLevel,
)

URGENCY_SCORE = {
    UrgencyLevel.EMERGENCY: 100,
    UrgencyLevel.HIGH: 70,
    UrgencyLevel.MEDIUM: 40,
    UrgencyLevel.LOW: 20,
}

AVG_CONSULT_MINUTES = 6


def waiting_minutes(entry: QueueEntry) -> float:
    created_at = entry.created_at or datetime.utcnow()
    delta = datetime.utcnow() - created_at
    return max(delta.total_seconds() / 60.0, 0.0)


def live_priority(entry: QueueEntry) -> float:
    base = URGENCY_SCORE.get(entry.urgency, 0)
    score = base + waiting_minutes(entry) * 0.5
    return round(score, 1)


def sorted_waiting(entries: List[QueueEntry]) -> List[QueueEntry]:
    active = [e for e in entries if e.status in (QueueStatus.WAITING, QueueStatus.CALLED)]
    for e in active:
        e.priority_score = live_priority(e)
    return sorted(active, key=lambda e: (-e.priority_score, e.created_at))


def next_queue_number(db: Session) -> str:
    count = db.query(QueueEntry).count()
    return f"P-{101 + count}"


def estimated_wait_minutes(position: int, available_doctors: int) -> int:
    return round(position / max(1, available_doctors) * AVG_CONSULT_MINUTES)


def call_next(db: Session, doctor: Doctor) -> Optional[QueueEntry]:
    waiting = (
        db.query(QueueEntry)
        .filter(QueueEntry.status == QueueStatus.WAITING)
        .all()
    )
    ordered = sorted_waiting(waiting)
    if not ordered:
        return None

    if not doctor.department_id:
        return None

    same_department = [
        e for e in ordered
        if e.department_id == doctor.department_id
    ]

    if not same_department:
        return None

    chosen = same_department[0]

    chosen.status = QueueStatus.CALLED
    chosen.doctor_id = doctor.id
    chosen.called_at = datetime.utcnow()
    doctor.availability = DoctorAvailability.BUSY

    db.add(chosen)
    db.add(doctor)
    db.commit()
    db.refresh(chosen)
    return chosen
