# MediFlow — AI-Powered Hospital Queue & Patient Flow Optimization

Standalone, deployable source code.

```
React + TypeScript + Vite  →  FastAPI (Python)  →  PostgreSQL
```

## Structure

```
mediflow/
├── backend/    FastAPI + SQLAlchemy + PostgreSQL + JWT + Gemini AI triage
└── frontend/   React 18 + TypeScript + Vite + Tailwind + React Router
```

## 1. Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # fill in DATABASE_URL, JWT_SECRET_KEY, GEMINI_API_KEY
uvicorn app.main:app --reload --port 8000
```

Tables are created and departments + the admin account are seeded on first start.
API docs: http://localhost:8000/docs

Environment variables (`backend/.env`):

| Key | Purpose |
| --- | --- |
| `DATABASE_URL` | `postgresql://user:pass@host:5432/mediflow` |
| `JWT_SECRET_KEY` | Long random secret for token signing |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifetime |
| `GEMINI_API_KEY` | Optional; falls back to rule-based triage when empty |
| `FRONTEND_URL` | Allowed CORS origin |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | Seeded admin account |

## 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env        # VITE_API_URL=http://localhost:8000/api
npm run dev                 # http://localhost:5173
npm run build               # production bundle in dist/
```

## Roles and flows

- **Patient** — register, log in, describe symptoms, receive AI urgency + department
  suggestion, join the queue, track token and estimated wait.
- **Doctor** — registers and stays in `PENDING_APPROVAL`; login is blocked (403) until an
  admin approves. Once approved: dashboard, department queue, call next patient,
  consultation notes, completion, availability toggle, profile.
- **Admin** — seeded from env only. Dashboard, patients, doctors, pending doctor
  applications (approve/reject), live queue, departments and analytics.

AI triage never diagnoses; it returns an urgency level, suggested department and a short
reason. Gemini is called from FastAPI only — the key is never exposed to the browser.

## Queue prioritization

Deterministic score combining urgency weight (Emergency > High > Medium > Low) and
minutes waited, so urgent cases jump ahead while long-waiting patients still advance.

## Notes

- No Supabase, no client-side database access. All data goes through the REST API.
- Never commit real `.env` files; only `.env.example` is included.
