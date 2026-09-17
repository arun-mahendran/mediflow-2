# MediFlow — AI-Powered Hospital Queue & Patient Flow Optimization

FastAPI + SQLAlchemy + PostgreSQL backend.

## Setup

```
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
```

Copy `.env.example` to `.env` and fill in real values (a working `.env` with local
defaults is already included for development). Make sure PostgreSQL is running and
the database in `DATABASE_URL` exists.

Run the API:

```
uvicorn app.main:app --reload
```

Interactive docs: http://localhost:8000/docs

On startup, the app creates all tables, seeds the default departments
(General Medicine, Cardiology, Orthopedics, Pediatrics, Emergency) and creates an
admin user from `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

## Endpoints (all under `/api`)

- `GET /health`
- **Auth**: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- **AI**: `POST /ai/analyze-symptoms`
- **Queue**: `POST /queue/join`, `GET /queue/my-status`, `GET /queue`
- **Doctors**: `GET /doctors/dashboard`, `GET /doctors/queue`, `PUT /doctors/availability`,
  `POST /doctors/call-next`, `GET /doctors/profile`, `PUT /doctors/profile`
- **Consultations**: `POST /consultations`, `PUT /consultations/{id}/complete`,
  `GET /consultations`, `GET /consultations/mine`
- **Admin**: `GET /admin/dashboard`, `GET /admin/patients`, `GET /admin/doctors`,
  `PUT /admin/doctors/{id}/department`, `GET /admin/pending-doctors`,
  `PUT /admin/doctors/{id}/approve`, `PUT /admin/doctors/{id}/reject`,
  `GET /admin/queue`, `GET /admin/analytics`
- **Departments**: `GET /departments`
- **Patients**: `GET /patients/me`, `PUT /patients/me`
