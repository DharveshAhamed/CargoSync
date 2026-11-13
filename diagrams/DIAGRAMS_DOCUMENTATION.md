# CargoSync — Project System Diagrams Documentation

This directory contains the complete set of formal, publication-ready monochrome UML and Entity-Relationship (ER) diagrams designed specifically for the CargoSync project report and Software Requirements Specification (SRS).

All diagrams are provided in both **lossless scalable vector graphics (`.svg`)** and **high-resolution 300 DPI (`.png`)** formats. They adhere strictly to clean academic and professional engineering standards (plain black `#000000` text, strokes, borders, and arrowheads on pure white `#FFFFFF` backgrounds).

---

## 📁 File Manifest

| Diagram Type | Vector File (SVG) | High-Res Raster (PNG) | Primary Scope |
| :--- | :--- | :--- | :--- |
| **1. Use Case Diagram** | [`use_case_diagram.svg`](use_case_diagram.svg) | [`use_case_diagram.png`](use_case_diagram.png) | User roles, system boundaries, functional use cases, and `«include»` / `«extend»` relationships. |
| **2. Entity-Relationship (ER)** | [`er_diagram.svg`](er_diagram.svg) | [`er_diagram.png`](er_diagram.png) | Relational database schema, entity tables, primary/foreign keys, and cardinalities (1:N). |
| **3. Activity Diagram** | [`activity_diagram.svg`](activity_diagram.svg) | [`activity_diagram.png`](activity_diagram.png) | End-to-end business process flow across Shipper, Trucker, and 3D System Engine swimlanes. |
| **4. Sequence Diagram** | [`sequence_diagram.svg`](sequence_diagram.svg) | [`sequence_diagram.png`](sequence_diagram.png) | Temporal interaction sequence between Web UI, Backend API, 3D Engine, Database, and Field Actors. |

---

## 1. Use Case Diagram

### Purpose
The Use Case Diagram defines the behavioral interactions between human actors, external services, and the CargoSync core application boundary.

### Standard UML Symbols
- **Stick Figures**: Primary and Secondary actors.
- **Large Rectangular Boundary**: Defines the system scope (`«system» CargoSync Freight & Fleet Orchestration Engine`).
- **Ovals**: Distinct functional operations (Use Cases).
- **Solid Association Lines**: Direct interaction between an Actor and a Use Case.
- **Dashed Arrow with `«include»`**: Mandatory sub-routines (e.g., Starting a trip unconditionally executes the pre-departure inspection checklist).
- **Dashed Arrow with `«extend»`**: Optional conditional behavior (e.g., Bundling an additional job extends the standard marketplace job acceptance).

### Primary Actors
1. **Shipper (Company User / Manager)**:
   - Registers enterprise organization.
   - Creates freight shipments, assigns origin/destination, dates, and delivery timeframes.
   - Specifies cargo item dimensions, weights, fragility, and multi-stop delivery priorities.
   - Publishes jobs to the marketplace and monitors in-transit status.
   - Dispatches delivery feedback and files claims for compromised goods.
2. **Fleet Owner (Trucker Admin)**:
   - Registers fleet vehicles with spatial dimensions ($L \times W \times H$) and maximum gross vehicle weight ratings ($GVWR$).
   - Enrolls certified drivers and assigns them to trucks.
   - Discovers marketplace cargo and accepts shipments.
   - Consolidates multiple available shipments into a single truck container.
   - Triggers 3D bin packing optimization and reviews 3D spatial orientation.
   - Dispatches loading manifests and QR cargo identification.
3. **Fleet Driver (Field Operator)**:
   - Executes pre-departure loading verification checklist.
   - Commences transit and records GPS timestamps.
   - Conducts destination unloading verification checklist with consignee.
   - Obtains proof of delivery (digital signature and delivery confirmation notes).
4. **3D Optimization Engine (`«service»`)**:
   - Executes First Fit Decreasing Height (FFDH) heuristic 3D bin packing algorithm.
   - Treats existing cargo as fixed obstacles when packing consolidated multi-job trips.
   - Enforces gravity support, box orientation constraints, and weight axle balance.
5. **Platform Admin**:
   - Superintends platform tenants, company profiles, and claims resolution.

---

## 2. Entity-Relationship (ER) Diagram

### Purpose
Represents the normalized relational database schema implemented in PostgreSQL (Supabase) via SQLAlchemy ORM.

### Standard ER Symbology
- **Entity Rectangles**: Divided into Header (Table Name), Key Indicators (`PK`, `FK`), Attribute Names, and SQL Data Types (`UUID`, `VARCHAR`, `NUMERIC`, `JSONB`, `TIMESTAMPTZ`, `BOOLEAN`).
- **Crow's Foot Lines**: Represent One-to-Many (`1:N`) and Many-to-One relationships with mandatory and optional participation.

### Key Entities & Attributes
1. **`COMPANIES`**: Tenant accounts (`id PK`, `name`, `email`, `phone`, `address`, `account_type: 'company' | 'trucker'`).
2. **`USERS`**: User credentials & authentication profiles (`id PK`, `company_id FK`, `email`, `password_hash`, `role: 'manager' | 'trucker_owner' | 'driver'`).
3. **`TRUCKS`**: Commercial fleet vehicles (`id PK`, `company_id FK`, `plate_number`, `length_cm`, `width_cm`, `height_cm`, `max_weight_kg`).
4. **`DRIVERS`**: Licensed vehicle operators (`id PK`, `company_id FK`, `truck_id FK`, `full_name`, `license_number`).
5. **`JOBS`**: Primary freight shipments (`id PK`, `company_id FK`, `truck_id FK`, `job_name`, `status`, `pickup_location`, `delivery_location`, `packing_data JSONB`).
6. **`BOXES`**: Physical cargo packages (`id PK`, `job_id FK`, `label_reference`, `length_cm`, `width_cm`, `height_cm`, `weight_kg`, `fragile`, `stop_order`, `pack_x`, `pack_y`, `pack_z`, `pack_rotation`).
7. **`DELIVERIES`**: Delivery stops & Proof of Delivery records (`id PK`, `job_id FK`, `stop_order`, `recipient_name`, `signature_data`, `status`, `delivered_at`).
8. **`AUDIT_LOGS`**: Cryptographically verifiable immutable custody trail (`id PK`, `job_id FK`, `user_id FK`, `action`, `details`, `gps_lat`, `gps_lng`, `timestamp`).
9. **`CLAIMS`**: Cargo discrepancy & damage disputes (`id PK`, `job_id FK`, `box_id FK`, `claim_type`, `description`, `status`).
10. **`JOB_REQUESTS`**: Marketplace carrier bids and matching requests (`id PK`, `job_id FK`, `truck_id FK`, `company_id FK`, `status`).

---

## 3. Activity Diagram

### Purpose
Illustrates the dynamic workflow, concurrent processes, and decision branches across the three core partitions (swimlanes): **Shipper**, **Fleet Trucker**, and **CargoSync System Engine**.

### UML Activity Symbology
- **Solid Black Circle (`●`)**: Initial process entry point.
- **Rounded Rectangles**: Discrete business tasks / activities.
- **Diamond Symbols (`◇`)**: Branching decision points with guard conditions (`[Yes]`, `[No]`).
- **Horizontal Synchronization Bar (Fork / Join)**: Initiates concurrent asynchronous tasks (e.g., synchronizing real-time GPS departure stamps in the audit log while notifying the shipper).
- **Bullseye Circle (`◉`)**: Terminal process completion node.

### Workflow Stages
1. **Creation & Ingestion**: Shipper specifies route parameters, cargo dimensions, and stop sequence, publishing the job to the marketplace.
2. **Marketplace Discovery & Acceptance**: Trucker claims the shipment, associating an authorized fleet vehicle.
3. **Cargo Consolidation Decision**: Trucker evaluates remaining truck payload. If surplus volume exists, additional compatible shipments are bundled into the trip.
4. **Algorithmic 3D Spatial Layout**: CargoSync 3D engine computes collision-free package coordinates, treating previous packages as physical obstacles and applying reverse stop order loading.
5. **Verification & Dispatch**: Trucker executes physical pre-departure loading verification checklist before transitioning the trip to `in_transit`.
6. **Delivery & Custody Handover**: At destination, driver reviews unloading verification checklist with recipient, captures digital signature (POD), and the system automatically dispatches delivery confirmation to the shipper.

---

## 4. Sequence Diagram

### Purpose
Documents the precise chronological message exchange between system participants across all functional lifecycles.

### Participants (Lifelines)
1. `Shipper (Company User)`
2. `Web Frontend (Next.js 16 / React 19)`
3. `Backend API (FastAPI / Python 3.14)`
4. `3D Packing Engine (FFDH Spatial Solver)`
5. `Database (PostgreSQL / Supabase)`
6. `Fleet Trucker (Driver / Fleet Owner)`

### Message Exchange Breakdown
- **Phase 1 (Creation)**: Shipper inputs job parameters and cargo packages; Frontend calls `POST /api/v1/jobs` and `POST /api/v1/boxes`; records persist in PostgreSQL.
- **Phase 2 (Marketplace & Bundling)**: Trucker queries open jobs via `GET /api/v1/jobs/marketplace` and assigns truck via `POST /api/v1/jobs/{id}/accept`. Trucker queries consolidation candidates via `GET /api/v1/jobs/{id}/bundle-candidates`.
- **Phase 3 (3D Bin Packing Computation)**: Front-end invokes `POST /api/v1/jobs/{id}/bundle-job`; API fetches vehicle dimensions and existing cargo obstacles, executing `pack_boxes_3d(...)`. Calculated spatial coordinates (`pack_x`, `pack_y`, `pack_z`) and rotations are written back to PostgreSQL. Interactive Three.js viewer renders 3D visualization.
- **Phase 4 (Loading Checklist & Transit)**: Driver submits pre-departure inspection via `POST /api/v1/checklist/approve/{id}`; status advances to `loading`. Driver triggers `POST /api/v1/jobs/{id}/start-trip`, transitioning all consolidated jobs on that truck to `in_transit`.
- **Phase 5 (Destination Unloading & POD)**: Driver arrives at destination, executes physical package verification checklist, and submits recipient name, delivery notes, and digital signature to `POST /api/v1/jobs/{id}/end-trip`. Job status transitions to `delivered`, creating an immutable audit log record and dispatching real-time arrival notification to the shipper.
- **Phase 6 (Audit Trail & Governance)**: Stakeholders inspect end-to-end chronological chain of custody via `GET /api/v1/audit/job/{id}`.

---

## How to Include These Diagrams in Documentation

### For Microsoft Word (`.docx`)
1. In Word, navigate to **Insert** ➔ **Pictures** ➔ **This Device...**
2. Browse to `Desktop/Cargo Sync/new diagrams/`
3. Select the `.png` file (e.g., `use_case_diagram.png`). Because the PNGs are rendered at **2x Retina resolution**, they will appear crisp and sharp when printed or scaled.

### For LaTeX Reports
```latex
\begin{figure}[htbp]
    \centering
    \includegraphics[width=\textwidth]{new diagrams/use_case_diagram.png}
    \caption{CargoSync Use Case Diagram}
    \label{fig:use_case}
\end{figure}
```

### For Markdown / HTML
```markdown
![CargoSync Use Case Diagram](new%20diagrams/use_case_diagram.png)
![CargoSync ER Diagram](new%20diagrams/er_diagram.png)
![CargoSync Activity Diagram](new%20diagrams/activity_diagram.png)
![CargoSync Sequence Diagram](new%20diagrams/sequence_diagram.png)
```
