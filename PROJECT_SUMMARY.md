# CargoSync — Intelligent Freight & Fleet Management Platform

> Smart Logistics. Optimized Loading. Reliable Deliveries.

CargoSync is a full-stack freight and fleet management platform designed to streamline logistics operations by connecting shippers, fleet managers, and truck operators through a centralized digital system.

The platform combines intelligent 3D cargo optimization, vehicle capacity management, delivery planning, and checklist-based shipment verification to improve transportation efficiency, reduce manual operations, and provide better visibility throughout the delivery lifecycle.

CargoSync aims to simplify the entire freight management workflow — from creating shipment requests and optimizing truck loading to managing deliveries and verifying cargo handovers.

---

## Key Features

### 1. Intelligent 3D Cargo Optimization
- Implements 3D bin-packing logic to optimize cargo placement inside trucks
- Maximizes available cargo space and minimizes unused capacity
- Evaluates box dimensions, weight, and loading constraints
- Provides an interactive 3D view of the optimized loading arrangement
- Supports efficient loading sequences for multiple delivery destinations

### 2. Fleet and Vehicle Management
- Manage and maintain truck information
- Store vehicle dimensions and payload capacities
- Manage driver information and vehicle assignments
- Track fleet availability and transportation operations
- Match transportation requirements with suitable vehicle capacities

### 3. Checklist-Based Loading and Delivery Verification
- Provides digital checklists for cargo loading and delivery operations
- Allows drivers or authorized personnel to verify cargo items during loading
- Tracks completed and pending checklist items
- Supports delivery-side verification of individual cargo items
- Maintains shipment progress and helps prevent missing-item discrepancies

### 4. Multi-Stop Delivery Management
- Supports shipments involving multiple delivery destinations
- Organizes cargo based on delivery stop sequences
- Uses reverse delivery sequencing to ensure the correct loading order
- Helps simplify unloading at different destinations

### 5. Job and Shipment Management
- Create and manage freight transportation jobs
- Record cargo dimensions, weight, and delivery information
- Manage shipment status throughout its lifecycle
- Connect transportation requirements with available fleet resources
- Maintain organized shipment records

### 6. Interactive Dashboard
- Centralized dashboard for monitoring logistics operations
- Provides visibility into fleet, drivers, jobs, and deliveries
- Helps users manage transportation activities efficiently

### 7. Authentication and Role-Based Access
- Secure user authentication using JWT
- Separate administrative and company-level access
- Protected dashboard routes
- Password hashing and secure session management
- Password reset functionality

### 8. Digital Loading Documentation
- Generate loading sheets for transportation jobs
- Provide cargo placement information
- Support organized loading and delivery operations

---

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| 3D Visualization | Three.js, React Three Fiber, React Three Drei |
| Backend | Python, FastAPI |
| Database | Supabase PostgreSQL |
| ORM and Validation | SQLAlchemy, Pydantic |
| Authentication | JWT, Python-JOSE, bcrypt |
| API Communication | REST API, Axios |
| Document Generation | ReportLab |

---

## System Architecture

CargoSync follows a full-stack architecture consisting of a Next.js frontend, a Python FastAPI backend, and a Supabase PostgreSQL database.

```text
             ┌──────────────────────────┐
             │       FRONTEND           │
             │                          │
             │       Next.js 16         │
             │        React 19          │
             │     TypeScript           │
             │      Tailwind CSS        │
             │       Three.js           │
             └────────────┬─────────────┘
                          │
                    REST API / HTTP
                          │
             ┌────────────▼─────────────┐
             │        BACKEND           │
             │                          │
             │        FastAPI           │
             │         Python           │
             │       SQLAlchemy         │
             │       JWT Security       │
             │    Cargo Optimization    │
             └────────────┬─────────────┘
                          │
                     SQL Queries
                          │
             ┌────────────▼─────────────┐
             │        DATABASE         │
             │                          │
             │   Supabase PostgreSQL    │
             │                          │
             │  Users, Trucks, Drivers  │
             │  Jobs, Cargo, Deliveries │
             │  Claims, Audit Logs      │
             └──────────────────────────┘
```

### Application Workflow

1. Users register and access the platform through secure authentication.
2. Shipment details and cargo information are entered into the system.
3. The backend processes cargo information and calculates an optimized loading arrangement.
4. The optimized arrangement is displayed through an interactive 3D visualization.
5. Suitable vehicles and drivers are managed for transportation operations.
6. Loading checklists are used to verify cargo before transportation.
7. Delivery checklists help verify cargo at individual delivery destinations.
8. Shipment progress and operational records are maintained in the database.

---

## 3D Bin Packing and Cargo Optimization

One of the core components of CargoSync is its intelligent cargo optimization engine.

The backend implements a First Fit Decreasing Height (FFDH)-based approach to determine suitable cargo placements inside a truck.

### Optimization Process
1. Sort cargo boxes based on volume.
2. Evaluate possible box rotations.
3. Check available truck dimensions.
4. Validate vehicle weight capacity.
5. Apply cargo placement constraints.
6. Consider reverse delivery sequencing.
7. Generate 3D placement coordinates.
8. Visualize the final loading arrangement.

This optimized placement helps improve cargo-space utilization and simplifies physical loading operations.

---

## Checklist-Based Verification Workflow

CargoSync uses digital checklists to manage cargo verification during loading and delivery.

### Loading Verification
- Display the cargo items assigned to a shipment
- Verify each item during the loading process
- Track completed and pending items
- Maintain loading progress

### Delivery Verification
- Display cargo items associated with each delivery stop
- Verify items during unloading and handover
- Track delivery checklist completion
- Update shipment progress based on verification status

This approach provides a simple and structured method of monitoring cargo movement and reducing manual verification errors.

---

## Project Structure

```text
CargoSync/
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── types/
│   │   └── middleware.ts
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── main.py
│   ├── alembic/
│   └── requirements.txt
│
├── database tables/
├── diagrams/
├── new diagrams/
├── screenshots/
├── PROJECT_SUMMARY.md
├── README.md
└── ...
```

---

## Getting Started

### Prerequisites
Make sure you have the following installed:

- Node.js 20 or above
- Python 3.11 or above
- npm
- Git
- Supabase account

### 1. Clone the Repository

```bash
git clone https://github.com/DharveshAhamed/CargoSync.git
cd CargoSync
```

### 2. Backend Setup

```bash
cd backend

python -m venv venv
```

Activate the virtual environment:

Windows:

```bash
venv\Scripts\activate
```

macOS / Linux:

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Configure backend environment variables in `.env` using your Supabase credentials and application secrets.

Run database migrations:

```bash
alembic upgrade head
```

Start the backend server:

```bash
uvicorn app.main:app --reload --port 8000
```

Backend API:
- http://localhost:8000

API Documentation:
- http://localhost:8000/docs

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
```

Configure the required environment variables in `.env.local`.

Start the development server:

```bash
npm run dev
```

Frontend application:
- http://localhost:3000

---

## Security

CargoSync incorporates several security practices:

- JWT-based authentication
- Password hashing using bcrypt
- Role-based access control
- Protected frontend routes
- Backend request validation using Pydantic
- Database operations through SQLAlchemy ORM
- Configured CORS policies

---

## Project Objectives

- Improve cargo-space utilization through intelligent 3D optimization
- Simplify fleet and driver management
- Streamline shipment and delivery operations
- Improve loading and unloading accuracy through digital checklists
- Reduce manual logistics processes
- Provide a centralized platform for freight management

---

## Future Enhancements

- Real-time GPS-based vehicle tracking
- AI-powered logistics and demand prediction
- Dynamic route optimization using live traffic data
- Advanced fleet performance analytics
- Integrated payment and settlement systems
- Mobile application for drivers and fleet operators

---

## Contributors

Developed as an MCA Final Semester Project.

- Dharvesh Ahamed
- Farhad Shihab Yaseen

---

## Project Information

- Project Name: CargoSync
- Category: Full-Stack Web Application
- Domain: Logistics & Fleet Management
- Frontend: Next.js, React, TypeScript
- Backend: Python, FastAPI
- Database: Supabase PostgreSQL
- Repository: https://github.com/DharveshAhamed/CargoSync

---

If you find CargoSync interesting, consider giving the repository a star.
