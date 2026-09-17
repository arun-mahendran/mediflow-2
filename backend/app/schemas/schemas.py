from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.models import (
    ApprovalStatus,
    DoctorAvailability,
    QueueStatus,
    UrgencyLevel,
    UserRole,
)


# ---------- Auth ----------
class RegisterRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    role: UserRole = UserRole.PATIENT
    age: Optional[int] = None
    gender: Optional[str] = None
    specialization: Optional[str] = None
    license_number: Optional[str] = Field(default=None, alias="licenseNumber")
    department_id: Optional[str] = Field(default=None, alias="departmentId")


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    email: EmailStr
    phone: Optional[str] = None
    role: UserRole
    approval_status: ApprovalStatus
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class RegisterResponse(BaseModel):
    status: str  # "CREATED" | "PENDING_APPROVAL"


class AuthUserOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: UserRole
    patientId: Optional[str] = None
    doctorId: Optional[str] = None


# ---------- Department ----------
class DepartmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: Optional[str] = None


# ---------- Patient ----------
class PatientProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None


class PatientProfileUpdate(BaseModel):
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    name: Optional[str] = None


class ProfileOut(BaseModel):
    id: str
    name: str
    email: str


# ---------- Doctor ----------
class DoctorProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    specialization: Optional[str] = None
    license_number: Optional[str] = None
    department_id: Optional[str] = None
    department_name: Optional[str] = None
    availability: DoctorAvailability
    name: Optional[str] = None
    email: Optional[str] = None


class AdminDoctorOut(BaseModel):
    id: str
    user_id: str
    specialization: Optional[str] = None
    department_id: Optional[str] = None
    availability: DoctorAvailability
    name: Optional[str] = None
    email: Optional[str] = None
    department: Optional[str] = None
    consultations: int = 0


class DoctorProfileUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    specialization: Optional[str] = None
    license_number: Optional[str] = None
    name: Optional[str] = None
    phone: Optional[str] = None
    department_id: Optional[str] = Field(default=None, alias="departmentId")


class DoctorAvailabilityUpdate(BaseModel):
    availability: DoctorAvailability


class DoctorDepartmentUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    department_id: Optional[str] = Field(default=None, alias="departmentId")


# ---------- AI ----------
class SymptomAnalysisRequest(BaseModel):
    symptoms: str
    age: Optional[int] = None
    gender: Optional[str] = None


class SymptomAnalysisResponse(BaseModel):
    urgency: UrgencyLevel
    department: str
    reason: str
    source: str  # "ai" | "fallback"


# ---------- Queue ----------
class QueueJoinRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    symptoms: str
    urgency: Optional[UrgencyLevel] = None
    department_id: Optional[str] = Field(default=None, alias="departmentId")
    reason: Optional[str] = None
    patient_id: Optional[str] = Field(default=None, alias="patientId")


class QueueEntryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    queue_number: str
    patient_id: str
    patient_name: Optional[str] = None
    doctor_id: Optional[str] = None
    department_id: Optional[str] = None
    department_name: Optional[str] = None
    symptoms: Optional[str] = None
    urgency: UrgencyLevel
    ai_reason: Optional[str] = None
    priority_score: float
    status: QueueStatus
    created_at: datetime
    called_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class ConsultationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    queue_id: str
    doctor_id: str
    patient_id: str
    patient_name: Optional[str] = None
    notes: Optional[str] = None
    diagnosis: Optional[str] = None
    prescription: Optional[str] = None
    started_at: datetime
    completed_at: Optional[datetime] = None


class EnrichedQueueEntryOut(QueueEntryOut):
    department: Optional[str] = None
    patientName: Optional[str] = None
    patientAge: Optional[int] = None
    patientGender: Optional[str] = None
    consult: Optional[ConsultationOut] = None


class QueueWaitingRow(BaseModel):
    id: str
    urgency: UrgencyLevel
    created_at: datetime
    department_id: Optional[str] = None


class QueueDoctorBrief(BaseModel):
    id: str
    specialization: Optional[str] = None
    availability: DoctorAvailability
    user_id: str


class QueueStatusOut(BaseModel):
    current: Optional[QueueEntryOut] = None
    waiting: List[QueueWaitingRow] = []
    departments: List[DepartmentOut] = []
    doctors: List[QueueDoctorBrief] = []


# ---------- Consultation ----------
class ConsultationStartRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    queue_id: str = Field(alias="queueId")


class ConsultationCompleteRequest(BaseModel):
    notes: Optional[str] = None
    diagnosis: Optional[str] = None
    prescription: Optional[str] = None


class ConsultationHistoryOut(BaseModel):
    entries: List[QueueEntryOut] = []
    consults: List[ConsultationOut] = []


# ---------- Admin ----------
class DoctorApplicationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    full_name: str
    email: EmailStr
    specialization: Optional[str] = None
    license_number: Optional[str] = None
    department_id: Optional[str] = None
    status: ApprovalStatus
    review_note: Optional[str] = None
    created_at: datetime


class DoctorApplicationReview(BaseModel):
    note: Optional[str] = None


class DoctorDashboardOut(BaseModel):
    doctor: Optional[DoctorProfileOut] = None
    departments: List[DepartmentOut] = []
    patients: List[PatientProfileOut] = []
    profiles: List[ProfileOut] = []
    queue: List[QueueEntryOut] = []


class ConsultationBriefOut(BaseModel):
    id: str
    doctor_id: str
    started_at: datetime
    completed_at: Optional[datetime] = None


class AdminDashboardOut(BaseModel):
    queue: List[QueueEntryOut] = []
    doctors: List[DoctorProfileOut] = []
    departments: List[DepartmentOut] = []
    profiles: List[ProfileOut] = []
    consultations: List[ConsultationBriefOut] = []
    patients: List[PatientProfileOut] = []
