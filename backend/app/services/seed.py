from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.models.models import ApprovalStatus, Department, User, UserRole

DEFAULT_DEPARTMENTS = [
    ("General Medicine", "Primary care and general health concerns"),
    ("Cardiology", "Heart and cardiovascular conditions"),
    ("Orthopedics", "Bones, joints, and musculoskeletal issues"),
    ("Pediatrics", "Care for infants, children, and adolescents"),
    ("Emergency", "Urgent and life-threatening conditions"),
]


def seed_departments(db: Session) -> None:
    for name, description in DEFAULT_DEPARTMENTS:
        existing = db.query(Department).filter(Department.name == name).first()
        if not existing:
            db.add(Department(name=name, description=description))
    db.commit()


def seed_admin(db: Session) -> None:
    existing = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()
    if existing:
        return
    admin = User(
        name=settings.ADMIN_NAME,
        email=settings.ADMIN_EMAIL,
        password_hash=hash_password(settings.ADMIN_PASSWORD),
        role=UserRole.ADMIN,
        approval_status=ApprovalStatus.APPROVED,
    )
    db.add(admin)
    db.commit()


def run_seed(db: Session) -> None:
    seed_departments(db)
    seed_admin(db)
