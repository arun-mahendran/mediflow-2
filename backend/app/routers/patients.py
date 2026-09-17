from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_patient
from app.models.models import Patient, User
from app.schemas.schemas import PatientProfileOut, PatientProfileUpdate

router = APIRouter(prefix="/patients", tags=["patients"])


def _get_patient_or_404(db: Session, user: User) -> Patient:
    patient = db.query(Patient).filter(Patient.user_id == user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    return patient


@router.get("/me", response_model=PatientProfileOut)
def get_my_profile(db: Session = Depends(get_db), current_user: User = Depends(require_patient)):
    patient = _get_patient_or_404(db, current_user)
    return PatientProfileOut(
        id=patient.id,
        user_id=patient.user_id,
        age=patient.age,
        gender=patient.gender,
        phone=patient.phone,
        name=current_user.name,
        email=current_user.email,
    )


@router.put("/me", response_model=PatientProfileOut)
def update_my_profile(
    payload: PatientProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_patient),
):
    patient = _get_patient_or_404(db, current_user)

    if payload.age is not None:
        patient.age = payload.age
    if payload.gender is not None:
        patient.gender = payload.gender
    if payload.phone is not None:
        patient.phone = payload.phone
        current_user.phone = payload.phone
    if payload.name is not None:
        current_user.name = payload.name

    db.add(patient)
    db.add(current_user)
    db.commit()
    db.refresh(patient)
    db.refresh(current_user)

    return PatientProfileOut(
        id=patient.id,
        user_id=patient.user_id,
        age=patient.age,
        gender=patient.gender,
        phone=patient.phone,
        name=current_user.name,
        email=current_user.email,
    )
