from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.routers import admin, ai, auth, consultations, departments, doctors, patients, queue
from app.services.seed import run_seed

app = FastAPI(title="MediFlow API")

allowed_origins = {settings.FRONTEND_URL, "http://localhost:5173"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(allowed_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        run_seed(db)
    finally:
        db.close()


app.include_router(auth.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(queue.router, prefix="/api")
app.include_router(doctors.router, prefix="/api")
app.include_router(consultations.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(departments.router, prefix="/api")
app.include_router(patients.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "MediFlow API"}
