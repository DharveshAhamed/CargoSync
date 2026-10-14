# CargoSync — Database Schema & Data Dictionary

> **Project**: CargoSync — Intelligent Freight & Fleet Orchestration Platform  
> **Database Architecture**: Relational Database Management System (PostgreSQL / SQLite)  
> **ORM**: SQLAlchemy (Python / FastAPI)  
> **Total Tables**: 12  

This document contains the complete database tables schema for the **CargoSync** platform. It has been prepared for direct integration into project documentation, software requirements specifications (SRS), architecture reports, and academic dissertations.

---

## Table of Contents

1. [companies](#1-companies) — Represents business organizations using the platform, categorized either as...
2. [users](#2-users) — Stores user authentication credentials, assigned roles, and profile attribu...
3. [admins](#3-admins) — Stores platform-level super administrators and support personnel responsibl...
4. [drivers](#4-drivers) — Represents professional commercial vehicle drivers employed by trucking fle...
5. [trucks](#5-trucks) — Catalogs fleet transport vehicles and cargo containers with accurate physic...
6. [jobs](#6-jobs) — Core operational entity representing a freight transport contract, tracking...
7. [boxes](#7-boxes) — Represents individual packaged cargo items with 3D physical dimensions, wei...
8. [deliveries](#8-deliveries) — Tracks delivery waypoints, recipients, electronic Proof of Delivery (e-POD)...
9. [job_requests](#9-job_requests) — Facilitates carrier marketplace bidding, where trucking companies submit bi...
10. [claims](#10-claims) — Manages damage claims, cargo loss incidents, and freight disputes between s...
11. [audit_logs](#11-audit_logs) — Immutable security and chain-of-custody tracking log recording every scan, ...
12. [team_invites](#12-team_invites) — Secures organizational member onboarding through time-limited cryptographic...

---

## Database Architecture Overview

| # | Table Name | Primary Key | Foreign Key Count | Column Count | Core Purpose |
|---|------------|-------------|-------------------|--------------|--------------|
| 1 | `companies` | `id` | 0 | 8 | Represents business organizations using the platform, c... |
| 2 | `users` | `id` | 1 | 9 | Stores user authentication credentials, assigned roles,... |
| 3 | `admins` | `id` | 0 | 6 | Stores platform-level super administrators and support ... |
| 4 | `drivers` | `id` | 1 | 10 | Represents professional commercial vehicle drivers empl... |
| 5 | `trucks` | `id` | 2 | 13 | Catalogs fleet transport vehicles and cargo containers ... |
| 6 | `jobs` | `id` | 2 | 14 | Core operational entity representing a freight transpor... |
| 7 | `boxes` | `id` | 1 | 16 | Represents individual packaged cargo items with 3D phys... |
| 8 | `deliveries` | `id` | 2 | 14 | Tracks delivery waypoints, recipients, electronic Proof... |
| 9 | `job_requests` | `id` | 3 | 7 | Facilitates carrier marketplace bidding, where trucking... |
| 10 | `claims` | `id` | 2 | 8 | Manages damage claims, cargo loss incidents, and freigh... |
| 11 | `audit_logs` | `id` | 3 | 9 | Immutable security and chain-of-custody tracking log re... |
| 12 | `team_invites` | `id` | 1 | 8 | Secures organizational member onboarding through time-l... |

---

### 1. `companies`

**Description**: Represents business organizations using the platform, categorized either as commercial shippers or independent trucking fleet carriers.

- **Primary Key**: `id`
- **Foreign Keys**: None (Independent Root Entity)

**Table Schema Definition:**

| Column Name | Data Type | Nullable | Constraint / Key | Default Value | Description |
|-------------|-----------|----------|------------------|---------------|-------------|
| `id` | `VARCHAR(36)` | NO | PRIMARY KEY | `UUIDv4` | Unique system identifier for the organization entity |
| `name` | `VARCHAR(255)` | NO | None | `-` | Registered legal business or corporate company name |
| `email` | `VARCHAR(255)` | NO | UNIQUE | `-` | Primary corporate contact and administration email address |
| `phone` | `VARCHAR(50)` | YES | None | `NULL` | Business telephone contact number |
| `address` | `TEXT` | YES | None | `NULL` | Registered physical headquarters or corporate office address |
| `logo_url` | `TEXT` | YES | None | `NULL` | Cloud storage URL pointing to company branding asset/logo |
| `account_type` | `VARCHAR(30)` | NO | None | `'company'` | Account categorization: 'company' (shipper) or 'trucker' (carrier) |
| `created_at` | `TIMESTAMPTZ` | NO | None | `CURRENT_TIMESTAMP` | UTC timestamp when the company profile was registered |

**Entity Relationships:**
- 1-to-Many with users (1 company employs many users)
- 1-to-Many with trucks (1 company owns many trucks)
- 1-to-Many with drivers (1 company employs many drivers)
- 1-to-Many with jobs (1 company posts many freight jobs)
- 1-to-Many with claims (1 company files many claims)
- 1-to-Many with team_invites (1 company issues many team invites)
- 1-to-Many with job_requests (1 trucker company receives/issues many bids)

---

### 2. `users`

**Description**: Stores user authentication credentials, assigned roles, and profile attributes for company managers, dispatchers, and staff.

- **Primary Key**: `id`
- **Foreign Keys**: `company_id` → `companies.id`

**Table Schema Definition:**

| Column Name | Data Type | Nullable | Constraint / Key | Default Value | Description |
|-------------|-----------|----------|------------------|---------------|-------------|
| `id` | `VARCHAR(36)` | NO | PRIMARY KEY | `UUIDv4` | Unique identifier for the user account |
| `company_id` | `VARCHAR(36)` | NO | FOREIGN KEY | `-` | Foreign key linking user to their parent company |
| `name` | `VARCHAR(255)` | NO | None | `-` | Full personal name of the account holder |
| `email` | `VARCHAR(255)` | NO | UNIQUE | `-` | Official login email address and communication channel |
| `password_hash` | `VARCHAR(255)` | NO | None | `-` | Bcrypt/Argon2 one-way cryptographically hashed password |
| `phone` | `VARCHAR(50)` | YES | None | `NULL` | Direct mobile contact number |
| `location` | `TEXT` | YES | None | `NULL` | Designated dispatch location, branch, or home depot |
| `role` | `VARCHAR(50)` | NO | None | `'user'` | Access control role: 'user', 'manager', or 'driver' |
| `created_at` | `TIMESTAMPTZ` | NO | None | `CURRENT_TIMESTAMP` | UTC timestamp when user registration occurred |

**Entity Relationships:**
- Many-to-1 with companies (Many users belong to 1 company)
- 1-to-Many with audit_logs (1 user performs many audited system actions)

---

### 3. `admins`

**Description**: Stores platform-level super administrators and support personnel responsible for system governance, user approval, and dispute resolution.

- **Primary Key**: `id`
- **Foreign Keys**: None (Independent Root Entity)

**Table Schema Definition:**

| Column Name | Data Type | Nullable | Constraint / Key | Default Value | Description |
|-------------|-----------|----------|------------------|---------------|-------------|
| `id` | `VARCHAR(36)` | NO | PRIMARY KEY | `UUIDv4` | Unique system identifier for administrative personnel |
| `name` | `VARCHAR(255)` | NO | None | `-` | Full name of the system administrator |
| `email` | `VARCHAR(255)` | NO | UNIQUE | `-` | Administrative login email address |
| `password_hash` | `VARCHAR(255)` | NO | None | `-` | Secure cryptographic password hash |
| `role` | `VARCHAR(50)` | NO | None | `'super_admin'` | Governance tier: 'super_admin' or 'support' |
| `created_at` | `TIMESTAMPTZ` | NO | None | `CURRENT_TIMESTAMP` | UTC timestamp of administrator provisioning |

**Entity Relationships:**
- Platform-level governance over all companies, jobs, claims, and audit logs

---

### 4. `drivers`

**Description**: Represents professional commercial vehicle drivers employed by trucking fleets, tracking licensing and assignment records.

- **Primary Key**: `id`
- **Foreign Keys**: `company_id` → `companies.id`

**Table Schema Definition:**

| Column Name | Data Type | Nullable | Constraint / Key | Default Value | Description |
|-------------|-----------|----------|------------------|---------------|-------------|
| `id` | `VARCHAR(36)` | NO | PRIMARY KEY | `UUIDv4` | Unique identifier for the commercial driver record |
| `company_id` | `VARCHAR(36)` | NO | FOREIGN KEY | `-` | Foreign key linking driver to the employing trucking company |
| `name` | `VARCHAR(255)` | NO | None | `-` | Full legal name of the licensed commercial driver |
| `email` | `VARCHAR(255)` | YES | None | `NULL` | Driver personal or dispatch email address |
| `phone` | `VARCHAR(50)` | YES | None | `NULL` | Driver mobile phone number for transit communication |
| `license_number` | `VARCHAR(100)` | YES | None | `NULL` | Commercial Driver's License (CDL) registration identifier |
| `license_expiry` | `TIMESTAMPTZ` | YES | None | `NULL` | Official expiration date of the commercial license |
| `notes` | `TEXT` | YES | None | `NULL` | Medical certifications, endorsements, or driving notes |
| `is_active` | `BOOLEAN` | NO | None | `TRUE` | Status flag indicating driver operational availability |
| `created_at` | `TIMESTAMPTZ` | NO | None | `CURRENT_TIMESTAMP` | UTC timestamp when the driver profile was created |

**Entity Relationships:**
- Many-to-1 with companies (Many drivers belong to 1 company)
- 1-to-1 with trucks (1 driver is actively assigned to 1 vehicle at a time)

---

### 5. `trucks`

**Description**: Catalogs fleet transport vehicles and cargo containers with accurate physical dimensions and payload capacities for 3D bin packing calculations.

- **Primary Key**: `id`
- **Foreign Keys**: `company_id` → `companies.id`, `driver_id` → `drivers.id`

**Table Schema Definition:**

| Column Name | Data Type | Nullable | Constraint / Key | Default Value | Description |
|-------------|-----------|----------|------------------|---------------|-------------|
| `id` | `VARCHAR(36)` | NO | PRIMARY KEY | `UUIDv4` | Unique system identifier for the fleet vehicle |
| `company_id` | `VARCHAR(36)` | NO | FOREIGN KEY | `-` | Foreign key linking vehicle to the owning transport firm |
| `driver_id` | `VARCHAR(36)` | YES | FOREIGN KEY | `NULL` | Foreign key linking vehicle to the assigned primary driver |
| `truck_name` | `VARCHAR(255)` | NO | None | `-` | Vehicle fleet designation (e.g., 'Freightliner Cascadia #12') |
| `plate_number` | `VARCHAR(50)` | NO | UNIQUE | `-` | Government-registered license plate alphanumeric number |
| `length_cm` | `FLOAT` | NO | None | `-` | Internal cargo bay usable container length (centimeters) |
| `width_cm` | `FLOAT` | NO | None | `-` | Internal cargo bay usable container width (centimeters) |
| `height_cm` | `FLOAT` | NO | None | `-` | Internal cargo bay usable container height (centimeters) |
| `max_weight_kg` | `FLOAT` | NO | None | `-` | Maximum gross payload carrying capacity (kilograms) |
| `driver_name` | `VARCHAR(255)` | YES | None | `NULL` | Legacy fallback driver name record |
| `availability_schedule` | `TEXT` | YES | None | `NULL` | JSON serialized operating calendar and time slots |
| `is_active` | `BOOLEAN` | NO | None | `TRUE` | Fleet operational readiness status flag |
| `created_at` | `TIMESTAMPTZ` | NO | None | `CURRENT_TIMESTAMP` | UTC timestamp when vehicle was added to inventory |

**Entity Relationships:**
- Many-to-1 with companies (Many trucks belong to 1 company)
- 1-to-1 with drivers (1 truck is operated by 1 assigned driver)
- 1-to-Many with jobs (1 truck executes multiple freight jobs across its lifecycle)
- 1-to-Many with job_requests (1 truck can be requested for multiple jobs)

---

### 6. `jobs`

**Description**: Core operational entity representing a freight transport contract, tracking shipment milestones, 3D cargo packing manifests, and journey state.

- **Primary Key**: `id`
- **Foreign Keys**: `company_id` → `companies.id`, `truck_id` → `trucks.id`

**Table Schema Definition:**

| Column Name | Data Type | Nullable | Constraint / Key | Default Value | Description |
|-------------|-----------|----------|------------------|---------------|-------------|
| `id` | `VARCHAR(36)` | NO | PRIMARY KEY | `UUIDv4` | Unique system identifier for the freight job |
| `company_id` | `VARCHAR(36)` | NO | FOREIGN KEY | `-` | Foreign key linking shipment to the originating shipper |
| `truck_id` | `VARCHAR(36)` | YES | FOREIGN KEY | `NULL` | Foreign key linking job to the assigned transport vehicle |
| `job_name` | `VARCHAR(255)` | NO | None | `-` | Descriptive job title (e.g., 'Perishable Produce Dispatch - NYC to BOS') |
| `date` | `DATE` | NO | None | `-` | Scheduled date for cargo pickup and transit initiation |
| `time_window` | `VARCHAR(100)` | YES | None | `NULL` | Permissible pickup/delivery time range (e.g. '09:00-17:00') |
| `description` | `TEXT` | YES | None | `NULL` | Detailed cargo profile and handling requirements |
| `pickup_location` | `TEXT` | YES | None | `NULL` | Full origin facility address, dock number, and city |
| `delivery_location` | `TEXT` | YES | None | `NULL` | Final destination facility address or distribution hub |
| `status` | `VARCHAR(50)` | NO | None | `'draft'` | State lifecycle: 'draft', 'posted', 'matched', 'accepted', 'loading', 'in_transit', 'out_for_delivery', 'delivered' |
| `packing_data` | `TEXT` | YES | None | `NULL` | JSON payload containing 3D bin packing coordinates and box rotations |
| `rating` | `INTEGER` | YES | CHECK (1-5) | `NULL` | Customer satisfaction star rating score (1 to 5) |
| `feedback` | `TEXT` | YES | None | `NULL` | Post-trip review commentary from the shipper |
| `created_at` | `TIMESTAMPTZ` | NO | None | `CURRENT_TIMESTAMP` | UTC timestamp when shipment order was initiated |

**Entity Relationships:**
- Many-to-1 with companies (Many jobs posted by 1 shipper)
- Many-to-1 with trucks (Many jobs fulfilled by 1 truck)
- 1-to-Many with boxes (1 job contains multiple cargo boxes)
- 1-to-Many with deliveries (1 job comprises multiple waypoint delivery stops)
- 1-to-Many with claims (1 job may experience dispute claims)
- 1-to-Many with audit_logs (1 job generates full timeline of custody events)
- 1-to-Many with job_requests (1 job receives multiple carrier bids)

---

### 7. `boxes`

**Description**: Represents individual packaged cargo items with 3D physical dimensions, weight, handling flags, and bin packing coordinate positions.

- **Primary Key**: `id`
- **Foreign Keys**: `job_id` → `jobs.id`

**Table Schema Definition:**

| Column Name | Data Type | Nullable | Constraint / Key | Default Value | Description |
|-------------|-----------|----------|------------------|---------------|-------------|
| `id` | `VARCHAR(36)` | NO | PRIMARY KEY | `UUIDv4` | Unique system identifier for the individual cargo box |
| `job_id` | `VARCHAR(36)` | NO | FOREIGN KEY | `-` | Foreign key linking box to its associated parent freight job |
| `label_reference` | `VARCHAR(255)` | NO | None | `-` | Item label identifier or internal warehouse SKU |
| `length_cm` | `FLOAT` | NO | None | `-` | Physical external length of the cargo carton (cm) |
| `width_cm` | `FLOAT` | NO | None | `-` | Physical external width of the cargo carton (cm) |
| `height_cm` | `FLOAT` | NO | None | `-` | Physical external height of the cargo carton (cm) |
| `weight_kg` | `FLOAT` | NO | None | `-` | Individual carton gross mass/weight (kg) |
| `stop_order` | `INTEGER` | NO | None | `1` | Delivery route drop-off sequence (governs LIFO loading order) |
| `fragile` | `BOOLEAN` | NO | None | `FALSE` | Fragility flag (prevents heavy stacking above during packing) |
| `hazard` | `BOOLEAN` | NO | None | `FALSE` | Hazardous materials flag requiring regulatory segregation |
| `qr_code` | `TEXT` | YES | None | `NULL` | Encrypted QR code data string and verification checksum |
| `pack_x` | `FLOAT` | YES | None | `NULL` | Calculated 3D Cartesian X-offset coordinate in truck bed (cm) |
| `pack_y` | `FLOAT` | YES | None | `NULL` | Calculated 3D Cartesian Y-offset coordinate in truck bed (cm) |
| `pack_z` | `FLOAT` | YES | None | `NULL` | Calculated 3D Cartesian Z-offset (elevation) in truck bed (cm) |
| `pack_rotation` | `INTEGER` | NO | None | `0` | Orthogonal 3D orientation index (0 to 5, across 6 degrees of freedom) |
| `created_at` | `TIMESTAMPTZ` | NO | None | `CURRENT_TIMESTAMP` | UTC timestamp when box specification was recorded |

**Entity Relationships:**
- Many-to-1 with jobs (Many boxes belong to 1 job)
- 1-to-1 with deliveries (1 box can be tied directly to a waypoint delivery)
- 1-to-Many with audit_logs (1 box has individual scan and custody events)

---

### 8. `deliveries`

**Description**: Tracks delivery waypoints, recipients, electronic Proof of Delivery (e-POD), signatures, and geolocation coordinates.

- **Primary Key**: `id`
- **Foreign Keys**: `job_id` → `jobs.id`, `box_id` → `boxes.id`

**Table Schema Definition:**

| Column Name | Data Type | Nullable | Constraint / Key | Default Value | Description |
|-------------|-----------|----------|------------------|---------------|-------------|
| `id` | `VARCHAR(36)` | NO | PRIMARY KEY | `UUIDv4` | Unique system identifier for the delivery waypoint stop |
| `job_id` | `VARCHAR(36)` | NO | FOREIGN KEY | `-` | Foreign key linking delivery stop to the overall freight job |
| `box_id` | `VARCHAR(36)` | YES | FOREIGN KEY | `NULL` | Optional foreign key linking stop to a specific cargo unit |
| `stop_order` | `INTEGER` | NO | None | `1` | Sequential destination stop index along the transit corridor |
| `recipient_name` | `VARCHAR(255)` | NO | None | `-` | Name of the designated consignee or receiving party |
| `address` | `TEXT` | YES | None | `NULL` | Physical delivery destination street address and gate notes |
| `signature_url` | `TEXT` | YES | None | `NULL` | Cloud storage URL for captured digital e-signature image |
| `photo_url` | `TEXT` | YES | None | `NULL` | Cloud storage URL for cargo condition photographic evidence |
| `gps_lat` | `FLOAT` | YES | None | `NULL` | GPS latitude coordinate captured at point of electronic handover |
| `gps_lng` | `FLOAT` | YES | None | `NULL` | GPS longitude coordinate captured at point of electronic handover |
| `notes` | `TEXT` | YES | None | `NULL` | Consignee delivery remarks or access instructions |
| `delivered_at` | `TIMESTAMPTZ` | YES | None | `NULL` | Actual timestamp of successful parcel handover and verification |
| `status` | `VARCHAR(50)` | NO | None | `'pending'` | Stop status: 'pending', 'scanned', 'in_transit', 'arrived', 'delivered' |
| `created_at` | `TIMESTAMPTZ` | NO | None | `CURRENT_TIMESTAMP` | UTC timestamp when delivery milestone was scheduled |

**Entity Relationships:**
- Many-to-1 with jobs (Many delivery stops belong to 1 job)
- 1-to-1 with boxes (1 delivery waypoint corresponds to 1 box)

---

### 9. `job_requests`

**Description**: Facilitates carrier marketplace bidding, where trucking companies submit bids or accept assignments for posted freight jobs.

- **Primary Key**: `id`
- **Foreign Keys**: `job_id` → `jobs.id`, `truck_id` → `trucks.id`, `trucker_id` → `companies.id`

**Table Schema Definition:**

| Column Name | Data Type | Nullable | Constraint / Key | Default Value | Description |
|-------------|-----------|----------|------------------|---------------|-------------|
| `id` | `VARCHAR(36)` | NO | PRIMARY KEY | `UUIDv4` | Unique system identifier for the marketplace proposal/bid |
| `job_id` | `VARCHAR(36)` | NO | FOREIGN KEY | `-` | Foreign key identifying the requested freight shipment |
| `truck_id` | `VARCHAR(36)` | NO | FOREIGN KEY | `-` | Foreign key identifying the carrier's proposed vehicle |
| `trucker_id` | `VARCHAR(36)` | NO | FOREIGN KEY | `-` | Foreign key identifying the bidding trucking enterprise |
| `message` | `TEXT` | YES | None | `NULL` | Carrier remarks, service terms, or dispatch availability message |
| `status` | `VARCHAR(30)` | NO | None | `'pending'` | Proposal disposition: 'pending', 'accepted', 'rejected' |
| `created_at` | `TIMESTAMPTZ` | NO | None | `CURRENT_TIMESTAMP` | UTC timestamp when the job proposal was submitted |

**Entity Relationships:**
- Many-to-1 with jobs (Many requests submitted for 1 job)
- Many-to-1 with trucks (Many requests associate with 1 vehicle)
- Many-to-1 with companies (Many requests issued by 1 carrier company)

---

### 10. `claims`

**Description**: Manages damage claims, cargo loss incidents, and freight disputes between shippers and carriers with administrative adjudication.

- **Primary Key**: `id`
- **Foreign Keys**: `company_id` → `companies.id`, `job_id` → `jobs.id`

**Table Schema Definition:**

| Column Name | Data Type | Nullable | Constraint / Key | Default Value | Description |
|-------------|-----------|----------|------------------|---------------|-------------|
| `id` | `VARCHAR(36)` | NO | PRIMARY KEY | `UUIDv4` | Unique system identifier for the dispute claim |
| `company_id` | `VARCHAR(36)` | NO | FOREIGN KEY | `-` | Foreign key linking claim to the filing claimant company |
| `job_id` | `VARCHAR(36)` | NO | FOREIGN KEY | `-` | Foreign key linking claim to the contested freight shipment |
| `description` | `TEXT` | NO | None | `-` | Detailed factual report of cargo impairment, delay, or damage |
| `proof_url` | `TEXT` | YES | None | `NULL` | Cloud storage link to photographic damage proof or bill of lading |
| `status` | `VARCHAR(50)` | NO | None | `'open'` | Dispute status: 'open', 'reviewing', 'resolved', 'rejected' |
| `admin_notes` | `TEXT` | YES | None | `NULL` | Super admin review remarks, settlement determination, or findings |
| `created_at` | `TIMESTAMPTZ` | NO | None | `CURRENT_TIMESTAMP` | UTC timestamp when the claim incident was logged |

**Entity Relationships:**
- Many-to-1 with companies (Many claims filed by 1 company)
- Many-to-1 with jobs (Many claims tied to 1 job)

---

### 11. `audit_logs`

**Description**: Immutable security and chain-of-custody tracking log recording every scan, status update, geofence trigger, and transit checkpoint.

- **Primary Key**: `id`
- **Foreign Keys**: `job_id` → `jobs.id`, `box_id` → `boxes.id`, `user_id` → `users.id`

**Table Schema Definition:**

| Column Name | Data Type | Nullable | Constraint / Key | Default Value | Description |
|-------------|-----------|----------|------------------|---------------|-------------|
| `id` | `VARCHAR(36)` | NO | PRIMARY KEY | `UUIDv4` | Unique system identifier for the telemetry audit record |
| `job_id` | `VARCHAR(36)` | NO | FOREIGN KEY | `-` | Foreign key linking event to the active freight job |
| `box_id` | `VARCHAR(36)` | YES | FOREIGN KEY | `NULL` | Optional foreign key identifying specific parcel scanned |
| `user_id` | `VARCHAR(36)` | YES | FOREIGN KEY | `NULL` | Foreign key identifying operator or driver responsible for event |
| `action` | `VARCHAR(100)` | NO | None | `-` | Event action: 'box_created', 'qr_generated', 'loading_scanned', 'transit_started', 'tamper_detected', 'delivery_scanned', 'pod_submitted', 'status_changed' |
| `details` | `TEXT` | YES | None | `NULL` | JSON snapshot of event metadata, barcode data, or device state |
| `gps_lat` | `FLOAT` | YES | None | `NULL` | GPS latitude recorded at the exact moment of barcode scan |
| `gps_lng` | `FLOAT` | YES | None | `NULL` | GPS longitude recorded at the exact moment of barcode scan |
| `scanned_at` | `TIMESTAMPTZ` | NO | None | `CURRENT_TIMESTAMP` | UTC immutable timestamp of transaction execution |

**Entity Relationships:**
- Many-to-1 with jobs (Many audit events occur under 1 job)
- Many-to-1 with boxes (Many audit events reference 1 box)
- Many-to-1 with users (Many audit events triggered by 1 user)

---

### 12. `team_invites`

**Description**: Secures organizational member onboarding through time-limited cryptographic tokens for new dispatchers and staff.

- **Primary Key**: `id`
- **Foreign Keys**: `company_id` → `companies.id`

**Table Schema Definition:**

| Column Name | Data Type | Nullable | Constraint / Key | Default Value | Description |
|-------------|-----------|----------|------------------|---------------|-------------|
| `id` | `VARCHAR(36)` | NO | PRIMARY KEY | `UUIDv4` | Unique identifier for the onboarding invitation |
| `company_id` | `VARCHAR(36)` | NO | FOREIGN KEY | `-` | Foreign key identifying inviting corporate organization |
| `email` | `VARCHAR(255)` | NO | None | `-` | Target corporate email address invited to join workspace |
| `role` | `VARCHAR(50)` | NO | None | `'user'` | Assigned member authorization level: 'user', 'manager', 'driver' |
| `token` | `VARCHAR(255)` | NO | UNIQUE | `-` | Cryptographic single-use URL invitation validation token |
| `status` | `VARCHAR(50)` | NO | None | `'pending'` | Token lifecycle status: 'pending', 'accepted', 'expired' |
| `created_at` | `TIMESTAMPTZ` | NO | None | `CURRENT_TIMESTAMP` | UTC timestamp when the invitation email was dispatched |
| `expires_at` | `TIMESTAMPTZ` | NO | None | `CURRENT_TIMESTAMP + 7d` | UTC timestamp when invitation token automatically expires |

**Entity Relationships:**
- Many-to-1 with companies (Many invites issued by 1 company)

---
