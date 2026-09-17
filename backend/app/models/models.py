import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class UserRole(str, enum.Enum):
    PATIENT = "PATIENT"
    DOCTOR = "DOCTOR"
    ADMIN = "ADMIN"


class ApprovalStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class DoctorAvailability(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    BUSY = "BUSY"
    OFFLINE = "OFFLINE"


class UrgencyLevel(str, enum.Enum):
    EMERGENCY = "EMERGENCY"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class QueueStatus(str, enum.Enum):
    WAITING = "WAITING"
    CALLED = "CALLED"
    IN_CONSULTATION = "IN_CONSULTATION"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


def gen_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    phone = Column(String, nullable=True)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.PATIENT)
    approval_status = Column(
        Enum(ApprovalStatus), nullable=False, default=ApprovalStatus.APPROVED
    )
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="user", uselist=False)
    doctor = relationship("Doctor", back_populates="user", uselist=False)


class Department(Base):
    __tablename__ = "departments"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    name = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=True)


class Patient(Base):
    __tablename__ = "patients"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), unique=True, nullable=False)
    age = Column(Integer, nullable=True)
    gender = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="patient")


class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), unique=True, nullable=False)
    specialization = Column(String, nullable=True)
    license_number = Column(String, nullable=True)
    department_id = Column(UUID(as_uuid=False), ForeignKey("departments.id"), nullable=True)
    availability = Column(
        Enum(DoctorAvailability), nullable=False, default=DoctorAvailability.OFFLINE
    )
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="doctor")
    department = relationship("Department")


class DoctorApplication(Base):
    __tablename__ = "doctor_applications"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)
    full_name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    specialization = Column(String, nullable=True)
    license_number = Column(String, nullable=True)
    department_id = Column(UUID(as_uuid=False), ForeignKey("departments.id"), nullable=True)
    status = Column(Enum(ApprovalStatus), nullable=False, default=ApprovalStatus.PENDING)
    review_note = Column(String, nullable=True)
    reviewed_by = Column(UUID(as_uuid=False), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class QueueEntry(Base):
    __tablename__ = "queue_entries"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    queue_number = Column(String, unique=True, nullable=False)
    patient_id = Column(UUID(as_uuid=False), ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(UUID(as_uuid=False), ForeignKey("doctors.id"), nullable=True)
    department_id = Column(UUID(as_uuid=False), ForeignKey("departments.id"), nullable=True)
    symptoms = Column(Text, nullable=True)
    urgency = Column(Enum(UrgencyLevel), nullable=False, default=UrgencyLevel.MEDIUM)
    ai_reason = Column(Text, nullable=True)
    priority_score = Column(Float, nullable=False, default=0.0)
    status = Column(Enum(QueueStatus), nullable=False, default=QueueStatus.WAITING)
    created_at = Column(DateTime, default=datetime.utcnow)
    called_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    patient = relationship("Patient")
    doctor = relationship("Doctor")
    department = relationship("Department")


class Consultation(Base):
    __tablename__ = "consultations"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    queue_id = Column(UUID(as_uuid=False), ForeignKey("queue_entries.id"), nullable=False)
    doctor_id = Column(UUID(as_uuid=False), ForeignKey("doctors.id"), nullable=False)
    patient_id = Column(UUID(as_uuid=False), ForeignKey("patients.id"), nullable=False)
    notes = Column(Text, nullable=True)
    diagnosis = Column(Text, nullable=True)
    prescription = Column(Text, nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    queue_entry = relationship("QueueEntry")
    doctor = relationship("Doctor")
    patient = relationship("Patient")
