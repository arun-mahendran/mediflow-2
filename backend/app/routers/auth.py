from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.models.models import (
    ApprovalStatus,
    Doctor,
    DoctorApplication,
    Patient,
    User,
    UserRole,
)
from app.schemas.schemas import (
    AuthUserOut,
    LoginRequest,
    RegisterRequest,
    RegisterResponse,
    TokenResponse,
    UserOut,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=RegisterResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    if payload.role == UserRole.DOCTOR:
        user = User(
            name=payload.name,
            email=payload.email,
            phone=payload.phone,
            password_hash=hash_password(payload.password),
            role=UserRole.DOCTOR,
            approval_status=ApprovalStatus.PENDING,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        doctor = Doctor(
            user_id=user.id,
            specialization=payload.specialization,
            license_number=payload.license_number,
            department_id=payload.department_id,
        )
        db.add(doctor)

        application = DoctorApplication(
            user_id=user.id,
            full_name=payload.name,
            email=payload.email,
            specialization=payload.specialization,
            license_number=payload.license_number,
            department_id=payload.department_id,
            status=ApprovalStatus.PENDING,
        )
        db.add(application)
        db.commit()

        return RegisterResponse(status="PENDING_APPROVAL")

    user = User(
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        password_hash=hash_password(payload.password),
        role=UserRole.PATIENT,
        approval_status=ApprovalStatus.APPROVED,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    patient = Patient(
        user_id=user.id,
        age=payload.age,
        gender=payload.gender,
        phone=payload.phone,
    )
    db.add(patient)
    db.commit()

    return RegisterResponse(status="CREATED")


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if user.role == UserRole.DOCTOR and user.approval_status != ApprovalStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Doctor account is {user.approval_status.value.lower()}. Please wait for admin approval.",
        )

    token = create_access_token({"sub": user.id, "role": user.role.value})
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=AuthUserOut)
def me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    return AuthUserOut(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        role=current_user.role,
        patientId=patient.id if patient else None,
        doctorId=doctor.id if doctor else None,
    )
