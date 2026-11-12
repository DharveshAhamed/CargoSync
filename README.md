# CargoSync

<p align="center">
  <strong>Smart Logistics. Optimized Loading. Reliable Deliveries.</strong>
</p>

CargoSync is a full-stack freight and fleet management platform designed to help logistics teams plan shipments, manage vehicles and drivers, optimize cargo loading, and verify deliveries through a centralized digital system.

The platform combines intelligent 3D cargo optimization, fleet tracking, shipment workflow management, and checklist-based verification to improve operational efficiency, reduce manual coordination, and provide better visibility across the delivery lifecycle.

## Overview

CargoSync supports the complete freight management process from shipment creation to loading, execution, and final delivery. It gives shippers, dispatch teams, and fleet operators a unified workflow for managing jobs, cargo, trucks, drivers, and delivery checkpoints.

## Key Features

### 3D Cargo Optimization
- Uses 3D bin-packing logic to determine efficient cargo placement inside trucks
- Maximizes available vehicle space and improves loading efficiency
- Evaluates box dimensions, weight constraints, and loading sequence
- Provides a visualized truck loading arrangement for better planning

### Fleet and Vehicle Management
- Manage truck records, dimensions, and capacity details
- Maintain driver profiles and assignments
- Match transportation requirements with suitable fleet assets
- Track fleet readiness and operational usage

### Shipment and Job Management
- Create and monitor freight jobs from start to completion
- Manage cargo dimensions, weights, destinations, and delivery information
- Track shipment status throughout the workflow
- Organize job records in a central platform

### Checklist-Based Loading and Delivery Verification
- Use digital checklists to validate cargo during loading and unloading
- Record completed and pending verification steps
- Monitor delivery progress and reduce loading discrepancies
- Improve accountability without relying only on ad hoc manual checks

### Multi-Stop Delivery Support
- Handle jobs with multiple destinations and stop sequences
- Organize cargo according to delivery order
- Support reverse sequencing for more efficient unloading at destination points

### Authentication and Role-Based Access
- Secure user logins with JWT-based authentication
- Separate admin and company-level access
- Protect sensitive routes and operations
- Support password reset and secure session flows

### Digital Loading Documentation
- Generate shipment loading sheets for operational reference
- Provide structured cargo placement information
- Support smoother coordination between dispatch and field teams

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| 3D Visualization | Three.js, React Three Fiber, React Three Drei |
| Backend | Python, FastAPI |
| Database | Supabase PostgreSQL |
| ORM / Validation | SQLAlchemy, Pydantic |
| Authentication | JWT, Python-JOSE, bcrypt |
| API Communication | REST API, Axios |
| Document Generation | ReportLab |

## System Architecture

CargoSync follows a full-stack architecture with a Next.js frontend, a FastAPI backend, and a PostgreSQL database hosted on Supabase.

```text
             ┌──────────────────────────┐
             │         FRONTEND         │
             │ Next.js 16 + React 19    │
             │ TypeScript + Tailwind    │
             │      Three.js UI         │
             └────────────┬─────────────┘
                          │
                    REST API / HTTP
                          │
             ┌────────────▼─────────────┐
             │         BACKEND          │
             │      FastAPI + Python    │
             │   SQLAlchemy + JWT       │
             │   Cargo Optimization     │
             └────────────┬─────────────┘
                          │
                     SQL Queries
                          │
             ┌────────────▼─────────────┐
             │         DATABASE         │
             │     Supabase PostgreSQL   │
             │ Users, Trucks, Drivers   │
             │ Jobs, Cargo, Deliveries │
             │ Claims, Audit Logs       │
             └──────────────────────────┘
```

## Typical Workflow

1. Users register and access the platform through secure authentication.
2. Shipment details, cargo, and delivery information are entered into the system.
3. The backend evaluates vehicle and cargo requirements.
4. An optimized loading arrangement is generated for the truck.
5. Vehicles and drivers are assigned and monitored.
6. Loading and delivery checklists are used to validate cargo movement.
7. Operational records and progress are maintained for traceability.

## Project Structure

```text
CargoSync/
├── frontend/                  # Next.js frontend application
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/                   # FastAPI backend service
│   ├── app/
│   ├── alembic/
│   └── requirements.txt
├── database tables/           # Database schema and documentation
├── diagrams/                  # Architecture and ER diagrams
├── screenshots/               # Project screenshots
├── PROJECT_SUMMARY.md         # Detailed project summary
├── .gitignore
├── README.md
└── ...
```

## Getting Started

### Prerequisites
- Node.js 20 or above
- Python 3.11 or above
- npm
- Git
- Supabase account

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

API docs will be available at:
- http://localhost:8000
- http://localhost:8000/docs

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will run at:
- http://localhost:3000

## Security

CargoSync incorporates several security practices, including:
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Protected dashboard routes
- Input validation with Pydantic
- SQLAlchemy ORM-based database interaction
- CORS configuration for secure API access

## Project Objectives

- Improve cargo-space utilization using intelligent 3D optimization
- Simplify fleet and driver management
- Streamline shipment and delivery operations
- Improve loading accuracy through verification workflows
- Reduce manual processing in logistics operations
- Provide a centralized platform for freight coordination

## Future Enhancements

- Real-time GPS vehicle tracking
- AI-based demand and route prediction
- Dynamic route optimization with traffic and delivery data
- Enhanced fleet analytics and performance dashboards
- Mobile support for drivers and field operators

## Contributors

Developed as an MCA Final Semester Project.

- Dharvesh Ahamed
- Farhad Shihab Yaseen

## Project Information

- Project Name: CargoSync
- Category: Full-Stack Web Application
- Domain: Logistics & Fleet Management
- Frontend: Next.js, React, TypeScript
- Backend: Python, FastAPI
- Database: Supabase PostgreSQL
- Repository: https://github.com/DharveshAhamed/CargoSync

## License

This project is for academic and portfolio use and is currently treated as a private project.
