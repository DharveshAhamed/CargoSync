# CargoSync — Intelligent Freight & Fleet Orchestration

> A full-stack web application for logistics companies to manage their fleets, optimize cargo loading with 3D bin packing, and track deliveries with QR-based chain of custody.

---

## 🏗 Architecture Overview

```
┌─────────────────────┐     HTTP / REST      ┌────────────────────────┐     SQL      ┌───────────────┐
│   Next.js Frontend  │ ◄──────────────────► │   FastAPI Backend      │ ◄──────────► │   Supabase    │
│   (React 19 + TS)   │    localhost:3000     │   (Python 3.14)        │   :5432      │  (PostgreSQL) │
│   Tailwind CSS v4   │                      │   SQLAlchemy + Alembic │              │               │
│   Three.js / R3F    │                      │   JWT Auth (HS256)     │              │               │
└─────────────────────┘                      └────────────────────────┘              └───────────────┘
```

### Frontend (`frontend/`)
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 with warm soothing color palette
- **3D Rendering**: Three.js via `@react-three/fiber` + `@react-three/drei`
- **HTTP Client**: Axios with JWT interceptors
- **QR Scanning**: `html5-qrcode`

### Backend (`backend/`)
- **Framework**: FastAPI (Python)
- **ORM**: SQLAlchemy 2.0 with Pydantic v2 schemas
- **Migrations**: Alembic
- **Auth**: JWT (python-jose + passlib/bcrypt)
- **Database Driver**: psycopg3
- **PDF Generation**: ReportLab
- **QR Code Generation**: qrcode library

### Database (Supabase)
- **Engine**: PostgreSQL hosted on Supabase
- **10 tables**: companies, users, admins, trucks, drivers, jobs, boxes, deliveries, claims, audit_logs, team_invites

---

## 📁 Project Structure

```
Cargo Sync/
├── frontend/                    # Next.js 16 frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/          # Auth pages (login, register, reset)
│   │   │   │   ├── login/       # Company user login
│   │   │   │   ├── admin/login/ # Admin login (separate page)
│   │   │   │   ├── register/    # Company registration
│   │   │   │   └── reset-password/
│   │   │   ├── (dashboard)/     # Protected dashboard pages
│   │   │   │   ├── dashboard/   # Overview dashboard
│   │   │   │   ├── trucks/      # Fleet management
│   │   │   │   ├── drivers/     # Driver CRUD + assign/unassign
│   │   │   │   ├── jobs/        # Job management + detail + new job
│   │   │   │   ├── cargo/       # Cargo/box overview per job
│   │   │   │   ├── scanning/    # QR scanner + manifest validation
│   │   │   │   ├── deliveries/  # Delivery tracking + POD
│   │   │   │   ├── load-plan/   # Three.js 3D load plan visualizer
│   │   │   │   ├── audit-log/   # Chain of custody log
│   │   │   │   ├── settings/    # Company profile + team invites
│   │   │   │   └── admin/       # Admin panel (companies, users, claims)
│   │   │   ├── layout.tsx       # Root layout (fonts, meta)
│   │   │   ├── page.tsx         # Landing/home page
│   │   │   └── globals.css      # Theme tokens + animations
│   │   ├── components/
│   │   │   └── three/           # Three.js 3D components
│   │   ├── lib/
│   │   │   ├── api.ts           # Axios instance with JWT interceptors
│   │   │   └── auth.ts          # Auth utilities (save, get, logout)
│   │   ├── types/
│   │   │   └── index.ts         # TypeScript interfaces
│   │   └── middleware.ts        # Route protection middleware
│   ├── package.json
│   └── .env.local               # Frontend environment variables
│
├── backend/                     # FastAPI backend
│   ├── app/
│   │   ├── api/v1/              # API route handlers
│   │   │   ├── auth.py          # Login, register, password reset
│   │   │   ├── trucks.py        # Truck CRUD
│   │   │   ├── drivers.py       # Driver CRUD + assign/unassign
│   │   │   ├── jobs.py          # Job CRUD + status transitions
│   │   │   ├── boxes.py         # Box/cargo CRUD
│   │   │   ├── deliveries.py    # Delivery management + POD
│   │   │   ├── qr.py            # QR code generation
│   │   │   ├── scanning.py      # Scan validation + manifest
│   │   │   ├── packing.py       # 3D bin packing computation
│   │   │   ├── audit.py         # Chain of custody audit log
│   │   │   └── admin.py         # Platform admin operations
│   │   ├── core/
│   │   │   ├── config.py        # Pydantic Settings (.env loading)
│   │   │   ├── deps.py          # DB session, auth dependencies
│   │   │   └── security.py      # JWT encode/decode, password hashing
│   │   ├── models/              # SQLAlchemy ORM models
│   │   │   ├── company.py, user.py, admin.py
│   │   │   ├── truck.py, driver.py, job.py
│   │   │   ├── box.py, delivery.py, claim.py
│   │   │   ├── audit_log.py, team_invite.py
│   │   │   └── __init__.py
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── services/
│   │   │   ├── bin_packing.py   # 3D bin packing algorithm (FFDH)
│   │   │   ├── qr_service.py    # QR code generation
│   │   │   └── pdf_service.py   # PDF loading sheet export
│   │   └── main.py              # FastAPI app entry point
│   ├── alembic/                 # Database migrations
│   │   ├── env.py
│   │   ├── script.py.mako
│   │   └── versions/
│   ├── alembic.ini
│   ├── requirements.txt
│   └── .env                     # Backend environment variables
│
├── diagrams/                    # UML/ER diagrams (reference)
├── .gitignore
└── PROJECT_SUMMARY.md           # This file
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 20
- **Python** ≥ 3.11
- **Supabase** account (free tier is fine)

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
# Edit .env and fill in your Supabase credentials:
#   DATABASE_URL=postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres
#   SUPABASE_SERVICE_KEY=<your-service-role-key>
#   SECRET_KEY=<generate-a-random-64-char-string>

# Run database migrations
alembic upgrade head

# Start the API server
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000` with interactive docs at `http://localhost:8000/docs`.

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
# .env.local should already contain:
#   NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
#   NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>

# Start the dev server
npm run dev
```

The frontend will be available at `http://localhost:3000`.

---

## 📋 Module Reference

### Phase 1 — Authentication (5 modules)
| Module | Description |
|--------|-------------|
| Company Registration | Creates company + first admin user account |
| Login (User & Admin) | Separate login pages with JWT token issuance |
| JWT Session Management | Token-based auth with auto-refresh and protected routes |
| Password Reset | Email-based password reset flow via Supabase Auth |
| Team Management | Invite team members by email, assign roles (user/manager/driver) |

### Phase 2 — Core Operations (5 modules)
| Module | Description |
|--------|-------------|
| Truck Management | Add, edit, deactivate fleet vehicles with dimensions & weight capacity |
| Driver Management | Add drivers, assign/unassign to trucks, license tracking |
| Job Management | Create freight jobs with status workflow (Draft → Delivered) |
| Cargo Entry | Add boxes with dimensions, weight, fragile/hazard flags, stop ordering |
| Delivery Stops | Multi-stop delivery management per job |

### Phase 3 — Optimization Engine (4 modules)
| Module | Description |
|--------|-------------|
| 3D Bin Packing | First Fit Decreasing Height algorithm with weight/fragile constraints |
| Reverse Delivery Sequencing | Boxes loaded in reverse stop order for efficient unloading |
| Three.js 3D Visualizer | Interactive 3D view of truck cargo area with color-coded boxes |
| PDF Loading Sheet | Downloadable PDF with loading order, box positions, and QR codes |

### Phase 4 — Scanning & Chain of Custody (7 modules)
| Module | Description |
|--------|-------------|
| QR Code Generator | Unique QR per box encoding box_id, job_id, and label |
| Printable QR Labels | Formatted labels for printing and affixing to cargo |
| Loading Scan | Camera-based QR scanning to validate boxes against manifest |
| Tamper Monitoring | Flag unexpected scans at wrong location/time |
| Delivery Scan | Per-stop scan verification for correct delivery |
| Proof of Delivery | Signature capture, photo upload, GPS auto-capture |
| Audit Log | Complete chain of custody trail with timestamps and GPS |

---

## 🔐 Security

- **JWT Authentication** with HS256 signing (configurable expiry)
- **Password Hashing** using bcrypt via passlib
- **Route Protection** via Next.js middleware (redirects to login)
- **CORS** configured to allow only the frontend origin
- **Role-Based Access** — Admin vs Company User vs Driver
- **Input Validation** — Pydantic schemas enforce data constraints
- **SQL Injection Prevention** — SQLAlchemy ORM with parameterized queries

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register company + admin user |
| POST | `/api/v1/auth/login` | User login → JWT tokens |
| POST | `/api/v1/auth/admin/login` | Admin login → JWT tokens |
| POST | `/api/v1/auth/reset-password` | Request password reset |
| GET | `/api/v1/auth/me` | Get current user profile |
| GET/POST/PUT/DELETE | `/api/v1/trucks/` | Truck CRUD |
| GET/POST/PUT/DELETE | `/api/v1/drivers/` | Driver CRUD |
| POST | `/api/v1/drivers/{id}/assign/{truck_id}` | Assign driver to truck |
| POST | `/api/v1/drivers/{id}/unassign` | Unassign driver |
| GET/POST/PUT | `/api/v1/jobs/` | Job CRUD + status transitions |
| GET/POST | `/api/v1/boxes/` | Box/cargo CRUD |
| GET/POST | `/api/v1/deliveries/` | Delivery management |
| POST | `/api/v1/packing/compute/{job_id}` | Run 3D bin packing |
| GET | `/api/v1/packing/loading-sheet/{job_id}` | Download PDF loading sheet |
| POST | `/api/v1/qr/generate/{job_id}` | Generate QR codes for all boxes |
| GET | `/api/v1/scanning/manifest/{job_id}` | Get scanning manifest |
| POST | `/api/v1/scanning/scan` | Record a scan event |
| GET | `/api/v1/audit/job/{job_id}` | Get audit log for a job |
| GET/POST | `/api/v1/admin/companies` | Admin: manage companies |
| GET/POST | `/api/v1/admin/users` | Admin: manage users |
| GET | `/api/v1/health` | Health check |

Full interactive API documentation is available at `/docs` (Swagger UI) or `/redoc`.

---

## 🎨 Design System

The UI uses a **warm, soothing color palette** designed to be easy on the eyes:

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#C17B4A` | Buttons, links, active nav items |
| `--color-secondary` | `#6B8F71` | Success states, driver badges |
| `--color-accent` | `#D4A853` | Warnings, highlights |
| `--color-bg` | `#FFFBF5` | Page background |
| `--color-card` | `#FFFFFF` | Card backgrounds |
| `--color-text` | `#3D3631` | Primary text |
| `--color-danger` | `#C25B56` | Errors, deactivate buttons |

Typography: **Inter** font family (Google Fonts).

---

## 📝 Job Status Workflow

```
DRAFT → POSTED → MATCHED → ACCEPTED → LOADING → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED
```

Each transition is tracked in the audit log with timestamp, user, and GPS coordinates.

---

## 🧊 3D Bin Packing Algorithm

The backend implements a **First Fit Decreasing Height (FFDH)** variant:

1. Sort boxes by volume (largest first)
2. For each box, try all 6 rotations
3. Place at the first valid position that satisfies:
   - Fits within truck dimensions
   - Total weight ≤ truck capacity
   - Fragile items placed on top
   - Boxes loaded in reverse delivery order (last stop loaded first)
4. Returns placement coordinates (x, y, z, rotation) for each box
5. Computes packing efficiency percentage

---

## 📄 License

Private project — all rights reserved.
