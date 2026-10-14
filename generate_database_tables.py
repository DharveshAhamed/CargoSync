"""
Script to generate database documentation files for CargoSync project documentation.
Outputs:
1. DATABASE_TABLES.md (Markdown format for Markdown / LaTeX / Notion)
2. DATABASE_TABLES.html (Monochrome, styled tables ready for direct 1-click copy into Microsoft Word)
3. schema.sql (Standard SQL DDL)
4. data_dictionary.csv (Tabular CSV format for Excel / Google Sheets)
"""

import os
import csv

TABLES = [
    {
        "name": "companies",
        "description": "Represents business organizations using the platform, categorized either as commercial shippers or independent trucking fleet carriers.",
        "pk": "id",
        "fks": [],
        "columns": [
            ("id", "VARCHAR(36)", "NO", "PRIMARY KEY", "UUIDv4", "Unique system identifier for the organization entity"),
            ("name", "VARCHAR(255)", "NO", "None", "-", "Registered legal business or corporate company name"),
            ("email", "VARCHAR(255)", "NO", "UNIQUE", "-", "Primary corporate contact and administration email address"),
            ("phone", "VARCHAR(50)", "YES", "None", "NULL", "Business telephone contact number"),
            ("address", "TEXT", "YES", "None", "NULL", "Registered physical headquarters or corporate office address"),
            ("logo_url", "TEXT", "YES", "None", "NULL", "Cloud storage URL pointing to company branding asset/logo"),
            ("account_type", "VARCHAR(30)", "NO", "None", "'company'", "Account categorization: 'company' (shipper) or 'trucker' (carrier)"),
            ("created_at", "TIMESTAMPTZ", "NO", "None", "CURRENT_TIMESTAMP", "UTC timestamp when the company profile was registered"),
        ],
        "relationships": [
            "1-to-Many with users (1 company employs many users)",
            "1-to-Many with trucks (1 company owns many trucks)",
            "1-to-Many with drivers (1 company employs many drivers)",
            "1-to-Many with jobs (1 company posts many freight jobs)",
            "1-to-Many with claims (1 company files many claims)",
            "1-to-Many with team_invites (1 company issues many team invites)",
            "1-to-Many with job_requests (1 trucker company receives/issues many bids)"
        ]
    },
    {
        "name": "users",
        "description": "Stores user authentication credentials, assigned roles, and profile attributes for company managers, dispatchers, and staff.",
        "pk": "id",
        "fks": [("company_id", "companies.id")],
        "columns": [
            ("id", "VARCHAR(36)", "NO", "PRIMARY KEY", "UUIDv4", "Unique identifier for the user account"),
            ("company_id", "VARCHAR(36)", "NO", "FOREIGN KEY", "-", "Foreign key linking user to their parent company"),
            ("name", "VARCHAR(255)", "NO", "None", "-", "Full personal name of the account holder"),
            ("email", "VARCHAR(255)", "NO", "UNIQUE", "-", "Official login email address and communication channel"),
            ("password_hash", "VARCHAR(255)", "NO", "None", "-", "Bcrypt/Argon2 one-way cryptographically hashed password"),
            ("phone", "VARCHAR(50)", "YES", "None", "NULL", "Direct mobile contact number"),
            ("location", "TEXT", "YES", "None", "NULL", "Designated dispatch location, branch, or home depot"),
            ("role", "VARCHAR(50)", "NO", "None", "'user'", "Access control role: 'user', 'manager', or 'driver'"),
            ("created_at", "TIMESTAMPTZ", "NO", "None", "CURRENT_TIMESTAMP", "UTC timestamp when user registration occurred"),
        ],
        "relationships": [
            "Many-to-1 with companies (Many users belong to 1 company)",
            "1-to-Many with audit_logs (1 user performs many audited system actions)"
        ]
    },
    {
        "name": "admins",
        "description": "Stores platform-level super administrators and support personnel responsible for system governance, user approval, and dispute resolution.",
        "pk": "id",
        "fks": [],
        "columns": [
            ("id", "VARCHAR(36)", "NO", "PRIMARY KEY", "UUIDv4", "Unique system identifier for administrative personnel"),
            ("name", "VARCHAR(255)", "NO", "None", "-", "Full name of the system administrator"),
            ("email", "VARCHAR(255)", "NO", "UNIQUE", "-", "Administrative login email address"),
            ("password_hash", "VARCHAR(255)", "NO", "None", "-", "Secure cryptographic password hash"),
            ("role", "VARCHAR(50)", "NO", "None", "'super_admin'", "Governance tier: 'super_admin' or 'support'"),
            ("created_at", "TIMESTAMPTZ", "NO", "None", "CURRENT_TIMESTAMP", "UTC timestamp of administrator provisioning"),
        ],
        "relationships": [
            "Platform-level governance over all companies, jobs, claims, and audit logs"
        ]
    },
    {
        "name": "drivers",
        "description": "Represents professional commercial vehicle drivers employed by trucking fleets, tracking licensing and assignment records.",
        "pk": "id",
        "fks": [("company_id", "companies.id")],
        "columns": [
            ("id", "VARCHAR(36)", "NO", "PRIMARY KEY", "UUIDv4", "Unique identifier for the commercial driver record"),
            ("company_id", "VARCHAR(36)", "NO", "FOREIGN KEY", "-", "Foreign key linking driver to the employing trucking company"),
            ("name", "VARCHAR(255)", "NO", "None", "-", "Full legal name of the licensed commercial driver"),
            ("email", "VARCHAR(255)", "YES", "None", "NULL", "Driver personal or dispatch email address"),
            ("phone", "VARCHAR(50)", "YES", "None", "NULL", "Driver mobile phone number for transit communication"),
            ("license_number", "VARCHAR(100)", "YES", "None", "NULL", "Commercial Driver's License (CDL) registration identifier"),
            ("license_expiry", "TIMESTAMPTZ", "YES", "None", "NULL", "Official expiration date of the commercial license"),
            ("notes", "TEXT", "YES", "None", "NULL", "Medical certifications, endorsements, or driving notes"),
            ("is_active", "BOOLEAN", "NO", "None", "TRUE", "Status flag indicating driver operational availability"),
            ("created_at", "TIMESTAMPTZ", "NO", "None", "CURRENT_TIMESTAMP", "UTC timestamp when the driver profile was created"),
        ],
        "relationships": [
            "Many-to-1 with companies (Many drivers belong to 1 company)",
            "1-to-1 with trucks (1 driver is actively assigned to 1 vehicle at a time)"
        ]
    },
    {
        "name": "trucks",
        "description": "Catalogs fleet transport vehicles and cargo containers with accurate physical dimensions and payload capacities for 3D bin packing calculations.",
        "pk": "id",
        "fks": [
            ("company_id", "companies.id"),
            ("driver_id", "drivers.id")
        ],
        "columns": [
            ("id", "VARCHAR(36)", "NO", "PRIMARY KEY", "UUIDv4", "Unique system identifier for the fleet vehicle"),
            ("company_id", "VARCHAR(36)", "NO", "FOREIGN KEY", "-", "Foreign key linking vehicle to the owning transport firm"),
            ("driver_id", "VARCHAR(36)", "YES", "FOREIGN KEY", "NULL", "Foreign key linking vehicle to the assigned primary driver"),
            ("truck_name", "VARCHAR(255)", "NO", "None", "-", "Vehicle fleet designation (e.g., 'Freightliner Cascadia #12')"),
            ("plate_number", "VARCHAR(50)", "NO", "UNIQUE", "-", "Government-registered license plate alphanumeric number"),
            ("length_cm", "FLOAT", "NO", "None", "-", "Internal cargo bay usable container length (centimeters)"),
            ("width_cm", "FLOAT", "NO", "None", "-", "Internal cargo bay usable container width (centimeters)"),
            ("height_cm", "FLOAT", "NO", "None", "-", "Internal cargo bay usable container height (centimeters)"),
            ("max_weight_kg", "FLOAT", "NO", "None", "-", "Maximum gross payload carrying capacity (kilograms)"),
            ("driver_name", "VARCHAR(255)", "YES", "None", "NULL", "Legacy fallback driver name record"),
            ("availability_schedule", "TEXT", "YES", "None", "NULL", "JSON serialized operating calendar and time slots"),
            ("is_active", "BOOLEAN", "NO", "None", "TRUE", "Fleet operational readiness status flag"),
            ("created_at", "TIMESTAMPTZ", "NO", "None", "CURRENT_TIMESTAMP", "UTC timestamp when vehicle was added to inventory"),
        ],
        "relationships": [
            "Many-to-1 with companies (Many trucks belong to 1 company)",
            "1-to-1 with drivers (1 truck is operated by 1 assigned driver)",
            "1-to-Many with jobs (1 truck executes multiple freight jobs across its lifecycle)",
            "1-to-Many with job_requests (1 truck can be requested for multiple jobs)"
        ]
    },
    {
        "name": "jobs",
        "description": "Core operational entity representing a freight transport contract, tracking shipment milestones, 3D cargo packing manifests, and journey state.",
        "pk": "id",
        "fks": [
            ("company_id", "companies.id"),
            ("truck_id", "trucks.id")
        ],
        "columns": [
            ("id", "VARCHAR(36)", "NO", "PRIMARY KEY", "UUIDv4", "Unique system identifier for the freight job"),
            ("company_id", "VARCHAR(36)", "NO", "FOREIGN KEY", "-", "Foreign key linking shipment to the originating shipper"),
            ("truck_id", "VARCHAR(36)", "YES", "FOREIGN KEY", "NULL", "Foreign key linking job to the assigned transport vehicle"),
            ("job_name", "VARCHAR(255)", "NO", "None", "-", "Descriptive job title (e.g., 'Perishable Produce Dispatch - NYC to BOS')"),
            ("date", "DATE", "NO", "None", "-", "Scheduled date for cargo pickup and transit initiation"),
            ("time_window", "VARCHAR(100)", "YES", "None", "NULL", "Permissible pickup/delivery time range (e.g. '09:00-17:00')"),
            ("description", "TEXT", "YES", "None", "NULL", "Detailed cargo profile and handling requirements"),
            ("pickup_location", "TEXT", "YES", "None", "NULL", "Full origin facility address, dock number, and city"),
            ("delivery_location", "TEXT", "YES", "None", "NULL", "Final destination facility address or distribution hub"),
            ("status", "VARCHAR(50)", "NO", "None", "'draft'", "State lifecycle: 'draft', 'posted', 'matched', 'accepted', 'loading', 'in_transit', 'out_for_delivery', 'delivered'"),
            ("packing_data", "TEXT", "YES", "None", "NULL", "JSON payload containing 3D bin packing coordinates and box rotations"),
            ("rating", "INTEGER", "YES", "CHECK (1-5)", "NULL", "Customer satisfaction star rating score (1 to 5)"),
            ("feedback", "TEXT", "YES", "None", "NULL", "Post-trip review commentary from the shipper"),
            ("created_at", "TIMESTAMPTZ", "NO", "None", "CURRENT_TIMESTAMP", "UTC timestamp when shipment order was initiated"),
        ],
        "relationships": [
            "Many-to-1 with companies (Many jobs posted by 1 shipper)",
            "Many-to-1 with trucks (Many jobs fulfilled by 1 truck)",
            "1-to-Many with boxes (1 job contains multiple cargo boxes)",
            "1-to-Many with deliveries (1 job comprises multiple waypoint delivery stops)",
            "1-to-Many with claims (1 job may experience dispute claims)",
            "1-to-Many with audit_logs (1 job generates full timeline of custody events)",
            "1-to-Many with job_requests (1 job receives multiple carrier bids)"
        ]
    },
    {
        "name": "boxes",
        "description": "Represents individual packaged cargo items with 3D physical dimensions, weight, handling flags, and bin packing coordinate positions.",
        "pk": "id",
        "fks": [("job_id", "jobs.id")],
        "columns": [
            ("id", "VARCHAR(36)", "NO", "PRIMARY KEY", "UUIDv4", "Unique system identifier for the individual cargo box"),
            ("job_id", "VARCHAR(36)", "NO", "FOREIGN KEY", "-", "Foreign key linking box to its associated parent freight job"),
            ("label_reference", "VARCHAR(255)", "NO", "None", "-", "Item label identifier or internal warehouse SKU"),
            ("length_cm", "FLOAT", "NO", "None", "-", "Physical external length of the cargo carton (cm)"),
            ("width_cm", "FLOAT", "NO", "None", "-", "Physical external width of the cargo carton (cm)"),
            ("height_cm", "FLOAT", "NO", "None", "-", "Physical external height of the cargo carton (cm)"),
            ("weight_kg", "FLOAT", "NO", "None", "-", "Individual carton gross mass/weight (kg)"),
            ("stop_order", "INTEGER", "NO", "None", "1", "Delivery route drop-off sequence (governs LIFO loading order)"),
            ("fragile", "BOOLEAN", "NO", "None", "FALSE", "Fragility flag (prevents heavy stacking above during packing)"),
            ("hazard", "BOOLEAN", "NO", "None", "FALSE", "Hazardous materials flag requiring regulatory segregation"),
            ("qr_code", "TEXT", "YES", "None", "NULL", "Encrypted QR code data string and verification checksum"),
            ("pack_x", "FLOAT", "YES", "None", "NULL", "Calculated 3D Cartesian X-offset coordinate in truck bed (cm)"),
            ("pack_y", "FLOAT", "YES", "None", "NULL", "Calculated 3D Cartesian Y-offset coordinate in truck bed (cm)"),
            ("pack_z", "FLOAT", "YES", "None", "NULL", "Calculated 3D Cartesian Z-offset (elevation) in truck bed (cm)"),
            ("pack_rotation", "INTEGER", "NO", "None", "0", "Orthogonal 3D orientation index (0 to 5, across 6 degrees of freedom)"),
            ("created_at", "TIMESTAMPTZ", "NO", "None", "CURRENT_TIMESTAMP", "UTC timestamp when box specification was recorded"),
        ],
        "relationships": [
            "Many-to-1 with jobs (Many boxes belong to 1 job)",
            "1-to-1 with deliveries (1 box can be tied directly to a waypoint delivery)",
            "1-to-Many with audit_logs (1 box has individual scan and custody events)"
        ]
    },
    {
        "name": "deliveries",
        "description": "Tracks delivery waypoints, recipients, electronic Proof of Delivery (e-POD), signatures, and geolocation coordinates.",
        "pk": "id",
        "fks": [
            ("job_id", "jobs.id"),
            ("box_id", "boxes.id")
        ],
        "columns": [
            ("id", "VARCHAR(36)", "NO", "PRIMARY KEY", "UUIDv4", "Unique system identifier for the delivery waypoint stop"),
            ("job_id", "VARCHAR(36)", "NO", "FOREIGN KEY", "-", "Foreign key linking delivery stop to the overall freight job"),
            ("box_id", "VARCHAR(36)", "YES", "FOREIGN KEY", "NULL", "Optional foreign key linking stop to a specific cargo unit"),
            ("stop_order", "INTEGER", "NO", "None", "1", "Sequential destination stop index along the transit corridor"),
            ("recipient_name", "VARCHAR(255)", "NO", "None", "-", "Name of the designated consignee or receiving party"),
            ("address", "TEXT", "YES", "None", "NULL", "Physical delivery destination street address and gate notes"),
            ("signature_url", "TEXT", "YES", "None", "NULL", "Cloud storage URL for captured digital e-signature image"),
            ("photo_url", "TEXT", "YES", "None", "NULL", "Cloud storage URL for cargo condition photographic evidence"),
            ("gps_lat", "FLOAT", "YES", "None", "NULL", "GPS latitude coordinate captured at point of electronic handover"),
            ("gps_lng", "FLOAT", "YES", "None", "NULL", "GPS longitude coordinate captured at point of electronic handover"),
            ("notes", "TEXT", "YES", "None", "NULL", "Consignee delivery remarks or access instructions"),
            ("delivered_at", "TIMESTAMPTZ", "YES", "None", "NULL", "Actual timestamp of successful parcel handover and verification"),
            ("status", "VARCHAR(50)", "NO", "None", "'pending'", "Stop status: 'pending', 'scanned', 'in_transit', 'arrived', 'delivered'"),
            ("created_at", "TIMESTAMPTZ", "NO", "None", "CURRENT_TIMESTAMP", "UTC timestamp when delivery milestone was scheduled"),
        ],
        "relationships": [
            "Many-to-1 with jobs (Many delivery stops belong to 1 job)",
            "1-to-1 with boxes (1 delivery waypoint corresponds to 1 box)"
        ]
    },
    {
        "name": "job_requests",
        "description": "Facilitates carrier marketplace bidding, where trucking companies submit bids or accept assignments for posted freight jobs.",
        "pk": "id",
        "fks": [
            ("job_id", "jobs.id"),
            ("truck_id", "trucks.id"),
            ("trucker_id", "companies.id")
        ],
        "columns": [
            ("id", "VARCHAR(36)", "NO", "PRIMARY KEY", "UUIDv4", "Unique system identifier for the marketplace proposal/bid"),
            ("job_id", "VARCHAR(36)", "NO", "FOREIGN KEY", "-", "Foreign key identifying the requested freight shipment"),
            ("truck_id", "VARCHAR(36)", "NO", "FOREIGN KEY", "-", "Foreign key identifying the carrier's proposed vehicle"),
            ("trucker_id", "VARCHAR(36)", "NO", "FOREIGN KEY", "-", "Foreign key identifying the bidding trucking enterprise"),
            ("message", "TEXT", "YES", "None", "NULL", "Carrier remarks, service terms, or dispatch availability message"),
            ("status", "VARCHAR(30)", "NO", "None", "'pending'", "Proposal disposition: 'pending', 'accepted', 'rejected'"),
            ("created_at", "TIMESTAMPTZ", "NO", "None", "CURRENT_TIMESTAMP", "UTC timestamp when the job proposal was submitted"),
        ],
        "relationships": [
            "Many-to-1 with jobs (Many requests submitted for 1 job)",
            "Many-to-1 with trucks (Many requests associate with 1 vehicle)",
            "Many-to-1 with companies (Many requests issued by 1 carrier company)"
        ]
    },
    {
        "name": "claims",
        "description": "Manages damage claims, cargo loss incidents, and freight disputes between shippers and carriers with administrative adjudication.",
        "pk": "id",
        "fks": [
            ("company_id", "companies.id"),
            ("job_id", "jobs.id")
        ],
        "columns": [
            ("id", "VARCHAR(36)", "NO", "PRIMARY KEY", "UUIDv4", "Unique system identifier for the dispute claim"),
            ("company_id", "VARCHAR(36)", "NO", "FOREIGN KEY", "-", "Foreign key linking claim to the filing claimant company"),
            ("job_id", "VARCHAR(36)", "NO", "FOREIGN KEY", "-", "Foreign key linking claim to the contested freight shipment"),
            ("description", "TEXT", "NO", "None", "-", "Detailed factual report of cargo impairment, delay, or damage"),
            ("proof_url", "TEXT", "YES", "None", "NULL", "Cloud storage link to photographic damage proof or bill of lading"),
            ("status", "VARCHAR(50)", "NO", "None", "'open'", "Dispute status: 'open', 'reviewing', 'resolved', 'rejected'"),
            ("admin_notes", "TEXT", "YES", "None", "NULL", "Super admin review remarks, settlement determination, or findings"),
            ("created_at", "TIMESTAMPTZ", "NO", "None", "CURRENT_TIMESTAMP", "UTC timestamp when the claim incident was logged"),
        ],
        "relationships": [
            "Many-to-1 with companies (Many claims filed by 1 company)",
            "Many-to-1 with jobs (Many claims tied to 1 job)"
        ]
    },
    {
        "name": "audit_logs",
        "description": "Immutable security and chain-of-custody tracking log recording every scan, status update, geofence trigger, and transit checkpoint.",
        "pk": "id",
        "fks": [
            ("job_id", "jobs.id"),
            ("box_id", "boxes.id"),
            ("user_id", "users.id")
        ],
        "columns": [
            ("id", "VARCHAR(36)", "NO", "PRIMARY KEY", "UUIDv4", "Unique system identifier for the telemetry audit record"),
            ("job_id", "VARCHAR(36)", "NO", "FOREIGN KEY", "-", "Foreign key linking event to the active freight job"),
            ("box_id", "VARCHAR(36)", "YES", "FOREIGN KEY", "NULL", "Optional foreign key identifying specific parcel scanned"),
            ("user_id", "VARCHAR(36)", "YES", "FOREIGN KEY", "NULL", "Foreign key identifying operator or driver responsible for event"),
            ("action", "VARCHAR(100)", "NO", "None", "-", "Event action: 'box_created', 'qr_generated', 'loading_scanned', 'transit_started', 'tamper_detected', 'delivery_scanned', 'pod_submitted', 'status_changed'"),
            ("details", "TEXT", "YES", "None", "NULL", "JSON snapshot of event metadata, barcode data, or device state"),
            ("gps_lat", "FLOAT", "YES", "None", "NULL", "GPS latitude recorded at the exact moment of barcode scan"),
            ("gps_lng", "FLOAT", "YES", "None", "NULL", "GPS longitude recorded at the exact moment of barcode scan"),
            ("scanned_at", "TIMESTAMPTZ", "NO", "None", "CURRENT_TIMESTAMP", "UTC immutable timestamp of transaction execution"),
        ],
        "relationships": [
            "Many-to-1 with jobs (Many audit events occur under 1 job)",
            "Many-to-1 with boxes (Many audit events reference 1 box)",
            "Many-to-1 with users (Many audit events triggered by 1 user)"
        ]
    },
    {
        "name": "team_invites",
        "description": "Secures organizational member onboarding through time-limited cryptographic tokens for new dispatchers and staff.",
        "pk": "id",
        "fks": [("company_id", "companies.id")],
        "columns": [
            ("id", "VARCHAR(36)", "NO", "PRIMARY KEY", "UUIDv4", "Unique identifier for the onboarding invitation"),
            ("company_id", "VARCHAR(36)", "NO", "FOREIGN KEY", "-", "Foreign key identifying inviting corporate organization"),
            ("email", "VARCHAR(255)", "NO", "None", "-", "Target corporate email address invited to join workspace"),
            ("role", "VARCHAR(50)", "NO", "None", "'user'", "Assigned member authorization level: 'user', 'manager', 'driver'"),
            ("token", "VARCHAR(255)", "NO", "UNIQUE", "-", "Cryptographic single-use URL invitation validation token"),
            ("status", "VARCHAR(50)", "NO", "None", "'pending'", "Token lifecycle status: 'pending', 'accepted', 'expired'"),
            ("created_at", "TIMESTAMPTZ", "NO", "None", "CURRENT_TIMESTAMP", "UTC timestamp when the invitation email was dispatched"),
            ("expires_at", "TIMESTAMPTZ", "NO", "None", "CURRENT_TIMESTAMP + 7d", "UTC timestamp when invitation token automatically expires"),
        ],
        "relationships": [
            "Many-to-1 with companies (Many invites issued by 1 company)"
        ]
    }
]

def generate_markdown(output_path):
    lines = []
    lines.append("# CargoSync — Database Schema & Data Dictionary")
    lines.append("")
    lines.append("> **Project**: CargoSync — Intelligent Freight & Fleet Orchestration Platform  ")
    lines.append("> **Database Architecture**: Relational Database Management System (PostgreSQL / SQLite)  ")
    lines.append("> **ORM**: SQLAlchemy (Python / FastAPI)  ")
    lines.append("> **Total Tables**: 12  ")
    lines.append("")
    lines.append("This document contains the complete database tables schema for the **CargoSync** platform. It has been prepared for direct integration into project documentation, software requirements specifications (SRS), architecture reports, and academic dissertations.")
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## Table of Contents")
    lines.append("")
    for i, t in enumerate(TABLES, 1):
        lines.append(f"{i}. [{t['name']}](#{i}-{t['name']}) — {t['description'][:75]}...")
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## Database Architecture Overview")
    lines.append("")
    lines.append("| # | Table Name | Primary Key | Foreign Key Count | Column Count | Core Purpose |")
    lines.append("|---|------------|-------------|-------------------|--------------|--------------|")
    for i, t in enumerate(TABLES, 1):
        pk = t['pk']
        fk_cnt = len(t['fks'])
        col_cnt = len(t['columns'])
        lines.append(f"| {i} | `{t['name']}` | `{pk}` | {fk_cnt} | {col_cnt} | {t['description'][:55]}... |")
    lines.append("")
    lines.append("---")
    lines.append("")

    for i, t in enumerate(TABLES, 1):
        lines.append(f"### {i}. `{t['name']}`")
        lines.append("")
        lines.append(f"**Description**: {t['description']}")
        lines.append("")
        lines.append(f"- **Primary Key**: `{t['pk']}`")
        if t['fks']:
            fk_str = ", ".join([f"`{col}` → `{ref}`" for col, ref in t['fks']])
            lines.append(f"- **Foreign Keys**: {fk_str}")
        else:
            lines.append("- **Foreign Keys**: None (Independent Root Entity)")
        lines.append("")
        lines.append("**Table Schema Definition:**")
        lines.append("")
        lines.append("| Column Name | Data Type | Nullable | Constraint / Key | Default Value | Description |")
        lines.append("|-------------|-----------|----------|------------------|---------------|-------------|")
        for col in t['columns']:
            c_name, c_type, c_null, c_key, c_def, c_desc = col
            lines.append(f"| `{c_name}` | `{c_type}` | {c_null} | {c_key} | `{c_def}` | {c_desc} |")
        lines.append("")
        lines.append("**Entity Relationships:**")
        for rel in t['relationships']:
            lines.append(f"- {rel}")
        lines.append("")
        lines.append("---")
        lines.append("")

    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"Generated {output_path}")

def generate_html(output_path):
    html = []
    html.append("<!DOCTYPE html>")
    html.append("<html lang=\"en\">")
    html.append("<head>")
    html.append("<meta charset=\"UTF-8\">")
    html.append("<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">")
    html.append("<title>CargoSync Database Tables Documentation</title>")
    html.append("<style>")
    html.append("  body { font-family: 'Times New Roman', Times, serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto; color: #000000; background: #ffffff; line-height: 1.5; padding: 40px; max-width: 1000px; margin: 0 auto; }")
    html.append("  h1 { font-size: 24pt; border-bottom: 2px solid #000000; padding-bottom: 8px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }")
    html.append("  h2 { font-size: 16pt; border-bottom: 1px solid #000000; padding-bottom: 4px; margin-top: 32px; margin-bottom: 12px; text-transform: uppercase; }")
    html.append("  h3 { font-size: 13pt; margin-top: 24px; margin-bottom: 6px; font-weight: bold; }")
    html.append("  p, li { font-size: 11pt; color: #000000; }")
    html.append("  .meta-box { border: 1px solid #000000; padding: 12px 16px; margin: 20px 0; background: #fdfdfd; }")
    html.append("  .meta-box p { margin: 4px 0; }")
    html.append("  table { width: 100%; border-collapse: collapse; margin: 16px 0 24px 0; font-size: 10pt; page-break-inside: avoid; }")
    html.append("  th { border: 1.5px solid #000000; background-color: #f2f2f2; color: #000000; padding: 8px 10px; font-weight: bold; text-align: left; }")
    html.append("  td { border: 1px solid #000000; padding: 6px 10px; vertical-align: top; color: #000000; }")
    html.append("  tr:nth-child(even) td { background-color: #fafafa; }")
    html.append("  .code { font-family: 'Courier New', Courier, monospace; font-size: 9.5pt; font-weight: 600; }")
    html.append("  .btn-copy { background: #000000; color: #ffffff; border: 1px solid #000000; padding: 6px 14px; font-size: 9pt; cursor: pointer; border-radius: 4px; float: right; margin-top: -30px; }")
    html.append("  .btn-copy:hover { background: #333333; }")
    html.append("  .notice { font-style: italic; font-size: 10pt; margin-top: 4px; color: #333333; }")
    html.append("  @media print { body { padding: 0; } .btn-copy { display: none; } }")
    html.append("</style>")
    html.append("<script>")
    html.append("function copyTable(tableId) {")
    html.append("  const el = document.getElementById(tableId);")
    html.append("  const range = document.createRange();")
    html.append("  range.selectNodeContents(el);")
    html.append("  const sel = window.getSelection();")
    html.append("  sel.removeAllRanges();")
    html.append("  sel.addRange(range);")
    html.append("  document.execCommand('copy');")
    html.append("  alert('Table copied to clipboard! You can now paste directly into Microsoft Word (Ctrl+V).');")
    html.append("}")
    html.append("function copyEntireDoc() {")
    html.append("  const range = document.createRange();")
    html.append("  range.selectNodeContents(document.body);")
    html.append("  const sel = window.getSelection();")
    html.append("  sel.removeAllRanges();")
    html.append("  sel.addRange(range);")
    html.append("  document.execCommand('copy');")
    html.append("  alert('Entire document copied to clipboard! You can now paste directly into Microsoft Word (Ctrl+V).');")
    html.append("}")
    html.append("</script>")
    html.append("</head>")
    html.append("<body>")
    html.append("<button class=\"btn-copy\" style=\"float: right; margin-top: 0; padding: 8px 16px; font-weight: bold;\" onclick=\"copyEntireDoc()\">📋 Copy All Tables for MS Word</button>")
    html.append("<h1>CargoSync — Database Tables Documentation</h1>")
    html.append("<div class=\"meta-box\">")
    html.append("  <p><strong>Project Name:</strong> CargoSync — Intelligent Freight and Fleet Orchestration</p>")
    html.append("  <p><strong>Subsystem:</strong> Relational Database Management System (PostgreSQL / SQLite)</p>")
    html.append("  <p><strong>ORM & Data Framework:</strong> SQLAlchemy 2.0 / Pydantic V2 / FastAPI</p>")
    html.append("  <p><strong>Total Entity Tables:</strong> 12 Normalized Relational Tables</p>")
    html.append("  <p class=\"notice\">Tip: Select any table below or click \"Copy Table\" to paste clean, formatted tables with native borders directly into your Microsoft Word or Google Docs project report.</p>")
    html.append("</div>")

    html.append("<h2>1. Schema Inventory Summary</h2>")
    html.append("<table id=\"summary_table\">")
    html.append("  <thead>")
    html.append("    <tr>")
    html.append("      <th style=\"width: 5%;\">#</th>")
    html.append("      <th style=\"width: 18%;\">Table Name</th>")
    html.append("      <th style=\"width: 15%;\">Primary Key</th>")
    html.append("      <th style=\"width: 12%;\">Foreign Keys</th>")
    html.append("      <th style=\"width: 10%;\">Columns</th>")
    html.append("      <th>Core Functional Scope</th>")
    html.append("    </tr>")
    html.append("  </thead>")
    html.append("  <tbody>")
    for i, t in enumerate(TABLES, 1):
        html.append("    <tr>")
        html.append(f"      <td>{i}</td>")
        html.append(f"      <td class=\"code\">{t['name']}</td>")
        html.append(f"      <td class=\"code\">{t['pk']}</td>")
        html.append(f"      <td>{len(t['fks'])} FK(s)</td>")
        html.append(f"      <td>{len(t['columns'])} cols</td>")
        html.append(f"      <td>{t['description']}</td>")
        html.append("    </tr>")
    html.append("  </tbody>")
    html.append("</table>")

    html.append("<h2>2. Detailed Data Dictionaries & Table Definitions</h2>")

    for i, t in enumerate(TABLES, 1):
        table_id = f"table_{t['name']}"
        html.append(f"<div id=\"section_{t['name']}\" style=\"margin-top: 36px;\">")
        html.append(f"  <button class=\"btn-copy\" onclick=\"copyTable('{table_id}')\">📋 Copy Table</button>")
        html.append(f"  <h3>Table {i}: <span class=\"code\">{t['name']}</span></h3>")
        html.append(f"  <p><strong>Functional Description:</strong> {t['description']}</p>")
        html.append("  <p>")
        html.append(f"    <strong>Primary Key:</strong> <span class=\"code\">{t['pk']}</span> | ")
        if t['fks']:
            fk_str = ", ".join([f"<span class=\"code\">{col}</span> &rarr; <span class=\"code\">{ref}</span>" for col, ref in t['fks']])
            html.append(f"<strong>Foreign Keys:</strong> {fk_str}")
        else:
            html.append("<strong>Foreign Keys:</strong> <em>None (Root Entity)</em>")
        html.append("  </p>")

        html.append(f"  <table id=\"{table_id}\">")
        html.append("    <thead>")
        html.append("      <tr>")
        html.append("        <th style=\"width: 18%;\">Column Name</th>")
        html.append("        <th style=\"width: 14%;\">Data Type</th>")
        html.append("        <th style=\"width: 10%;\">Nullable</th>")
        html.append("        <th style=\"width: 16%;\">Constraint / Key</th>")
        html.append("        <th style=\"width: 14%;\">Default Value</th>")
        html.append("        <th style=\"width: 28%;\">Description</th>")
        html.append("      </tr>")
        html.append("    </thead>")
        html.append("    <tbody>")
        for col in t['columns']:
            c_name, c_type, c_null, c_key, c_def, c_desc = col
            html.append("      <tr>")
            html.append(f"        <td class=\"code\"><strong>{c_name}</strong></td>")
            html.append(f"        <td class=\"code\">{c_type}</td>")
            html.append(f"        <td>{c_null}</td>")
            html.append(f"        <td>{c_key}</td>")
            html.append(f"        <td class=\"code\">{c_def}</td>")
            html.append(f"        <td>{c_desc}</td>")
            html.append("      </tr>")
        html.append("    </tbody>")
        html.append("  </table>")

        html.append("  <p><strong>Entity Relationships:</strong></p>")
        html.append("  <ul>")
        for rel in t['relationships']:
            html.append(f"    <li>{rel}</li>")
        html.append("  </ul>")
        html.append("</div>")

    html.append("</body>")
    html.append("</html>")

    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(html))
    print(f"Generated {output_path}")

def generate_sql(output_path):
    sql = []
    sql.append("-- =============================================================================")
    sql.append("-- CargoSync Database DDL Schema")
    sql.append("-- System: PostgreSQL / SQLite Compatible Relational Schema")
    sql.append("-- Generated for CargoSync Project Documentation")
    sql.append("-- =============================================================================")
    sql.append("")

    for t in TABLES:
        sql.append(f"-- -----------------------------------------------------------------------------")
        sql.append(f"-- Table: {t['name']}")
        sql.append(f"-- Description: {t['description']}")
        sql.append(f"-- -----------------------------------------------------------------------------")
        sql.append(f"CREATE TABLE {t['name']} (")
        col_defs = []
        for col in t['columns']:
            c_name, c_type, c_null, c_key, c_def, c_desc = col
            null_clause = "NOT NULL" if c_null == "NO" else "NULL"
            
            line = f"    {c_name:<22} {c_type:<18} {null_clause}"
            if c_key == "PRIMARY KEY":
                line += " PRIMARY KEY"
            elif c_key == "UNIQUE":
                line += " UNIQUE"
            elif c_key.startswith("CHECK"):
                line += f" {c_key}"
            
            if c_def != "-" and c_def != "NULL" and c_key != "PRIMARY KEY":
                if c_def == "CURRENT_TIMESTAMP":
                    line += " DEFAULT CURRENT_TIMESTAMP"
                elif c_def.startswith("'") or c_def in ["TRUE", "FALSE"] or c_def.isdigit():
                    line += f" DEFAULT {c_def}"
            col_defs.append(line)
        
        # Add foreign key constraints
        for col, ref in t['fks']:
            ref_table, ref_col = ref.split(".")
            col_defs.append(f"    CONSTRAINT fk_{t['name']}_{col} FOREIGN KEY ({col}) REFERENCES {ref_table}({ref_col}) ON DELETE CASCADE")
            
        sql.append(",\n".join(col_defs))
        sql.append(");")
        sql.append("")

    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(sql))
    print(f"Generated {output_path}")

def generate_csv(output_path):
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Table Name", "Column Name", "Data Type", "Nullable", "Constraint / Key", "Default Value", "Description"])
        for t in TABLES:
            for col in t['columns']:
                c_name, c_type, c_null, c_key, c_def, c_desc = col
                writer.writerow([t['name'], c_name, c_type, c_null, c_key, c_def, c_desc])
    print(f"Generated {output_path}")

if __name__ == "__main__":
    out_dir = "/Users/dharveshahamed/Desktop/Cargo Sync/database tables"
    os.makedirs(out_dir, exist_ok=True)
    
    generate_markdown(os.path.join(out_dir, "DATABASE_TABLES.md"))
    generate_html(os.path.join(out_dir, "DATABASE_TABLES.html"))
    generate_sql(os.path.join(out_dir, "schema.sql"))
    generate_csv(os.path.join(out_dir, "database_tables.csv"))
    print("All database documentation files generated successfully!")
