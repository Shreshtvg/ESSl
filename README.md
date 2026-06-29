# Attendix ERP

A workforce attendance & HR management system built around ESSL biometric attendance data. It provides a Django REST API backend and a React (Vite) single-page frontend for managing employees, shifts, rosters, leaves, attendance corrections, holidays, vendors, and reporting.

---

## Tech Stack

**Backend**
- Python / Django 4.2
- Django REST Framework
- SimpleJWT (sliding-session JWT auth)
- SQLite (default dev database)
- bcrypt password hashing

**Frontend**
- React 18 + Vite 5
- React Router v6 (hash routing)
- TanStack React Query
- Tailwind CSS v4
- Axios, lucide-react, motion, xlsx

---

## Project Structure

```
attendix_erp/
├── backend/
│   ├── attendix/              # Django project (settings, urls, wsgi/asgi)
│   ├── apps/                  # Modular Django apps
│   │   ├── core/              # Shared middleware, permissions, utils
│   │   ├── authentication/    # User model + JWT login/register
│   │   ├── departments/
│   │   ├── designations/
│   │   ├── shifts/
│   │   ├── employees/
│   │   ├── attendance/
│   │   ├── attendance_changes/
│   │   ├── leaves/
│   │   ├── roster/
│   │   ├── roster_changes/
│   │   ├── holidays/
│   │   ├── vendors/
│   │   ├── dashboard/
│   │   ├── reports/
│   │   └── activity_logs/
│   ├── manage.py
│   ├── requirements.txt
│   └── db.sqlite3
└── frontend/
    ├── src/
    │   ├── api/client.js       # Axios instance + auth interceptors
    │   ├── contexts/           # Auth, Notifications, Toast
    │   ├── layouts/            # DashboardLayout
    │   ├── pages/              # One component per route
    │   ├── components/         # Shared UI (Modal, Card, ConfirmDialog…)
    │   └── utils/              # export helpers
    ├── index.html
    ├── package.json
    └── vite.config.js
```

Each backend app follows the same layout: `models.py`, `serializers.py`, `services.py` (business logic), `views.py`, and `urls.py`.

---

## Features

- **Authentication** — JWT login with a sliding-session middleware that re-issues a fresh token on each request (`X-Refreshed-Token` header). Two roles: `Admin` and `Supervisor`.
- **Employees** — employee records linked to departments, designations, and vendors.
- **Departments & Designations** — organizational master data.
- **Shifts & Roster** — shift definitions and per-employee roster scheduling, with a change-request workflow (`roster_changes`).
- **Attendance** — biometric/ESSL-sourced attendance, plus an attendance correction workflow (`attendance_changes`).
- **Leaves** — leave request submission and approval.
- **Holidays** — holiday calendar management.
- **Vendors** — third-party / contractor vendor management.
- **Dashboard** — aggregated summary metrics.
- **Reports** — monthly attendance reports with printable and Excel export.
- **Activity Logs** — audit trail of system actions.

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Backend

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS / Linux

# Install dependencies
pip install -r requirements.txt

# Apply migrations
python manage.py migrate

# Create an admin user
python manage.py createsuperuser

# Run the dev server (http://localhost:8000)
python manage.py runserver
```

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run the dev server (http://localhost:5173)
npm run dev
```

The Vite dev server proxies `/api` requests to `http://localhost:8000`, so run both servers together during development.

---

## API Overview

All routes are mounted under `/api/`. Authentication lives under `/api/auth/`:

| Method | Endpoint              | Description                  |
|--------|-----------------------|------------------------------|
| POST   | `/api/auth/login`     | Log in, returns a JWT        |
| POST   | `/api/auth/register`  | Register a new user          |
| POST   | `/api/auth/check-email` | Check if an email exists   |
| GET    | `/api/auth/me`        | Current authenticated user   |

Domain resources are exposed under `/api/` by their respective apps (e.g. `/api/employees`, `/api/attendance`, `/api/leaves`, `/api/reports`, …). All non-auth endpoints require a `Bearer <token>` header.

Access tokens have a 15-minute lifetime but are automatically refreshed by the sliding-session middleware on every authenticated request.

---

## Available Scripts (Frontend)

| Command          | Description                       |
|------------------|-----------------------------------|
| `npm run dev`    | Start the Vite dev server         |

---

## License

Shresht V G. All rights reserved.
