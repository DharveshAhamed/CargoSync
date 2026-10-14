-- =============================================================================
-- CargoSync Database DDL Schema
-- System: PostgreSQL / SQLite Compatible Relational Schema
-- Generated for CargoSync Project Documentation
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Table: companies
-- Description: Represents business organizations using the platform, categorized either as commercial shippers or independent trucking fleet carriers.
-- -----------------------------------------------------------------------------
CREATE TABLE companies (
    id                     VARCHAR(36)        NOT NULL PRIMARY KEY,
    name                   VARCHAR(255)       NOT NULL,
    email                  VARCHAR(255)       NOT NULL UNIQUE,
    phone                  VARCHAR(50)        NULL,
    address                TEXT               NULL,
    logo_url               TEXT               NULL,
    account_type           VARCHAR(30)        NOT NULL DEFAULT 'company',
    created_at             TIMESTAMPTZ        NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- Table: users
-- Description: Stores user authentication credentials, assigned roles, and profile attributes for company managers, dispatchers, and staff.
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id                     VARCHAR(36)        NOT NULL PRIMARY KEY,
    company_id             VARCHAR(36)        NOT NULL,
    name                   VARCHAR(255)       NOT NULL,
    email                  VARCHAR(255)       NOT NULL UNIQUE,
    password_hash          VARCHAR(255)       NOT NULL,
    phone                  VARCHAR(50)        NULL,
    location               TEXT               NULL,
    role                   VARCHAR(50)        NOT NULL DEFAULT 'user',
    created_at             TIMESTAMPTZ        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- Table: admins
-- Description: Stores platform-level super administrators and support personnel responsible for system governance, user approval, and dispute resolution.
-- -----------------------------------------------------------------------------
CREATE TABLE admins (
    id                     VARCHAR(36)        NOT NULL PRIMARY KEY,
    name                   VARCHAR(255)       NOT NULL,
    email                  VARCHAR(255)       NOT NULL UNIQUE,
    password_hash          VARCHAR(255)       NOT NULL,
    role                   VARCHAR(50)        NOT NULL DEFAULT 'super_admin',
    created_at             TIMESTAMPTZ        NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- Table: drivers
-- Description: Represents professional commercial vehicle drivers employed by trucking fleets, tracking licensing and assignment records.
-- -----------------------------------------------------------------------------
CREATE TABLE drivers (
    id                     VARCHAR(36)        NOT NULL PRIMARY KEY,
    company_id             VARCHAR(36)        NOT NULL,
    name                   VARCHAR(255)       NOT NULL,
    email                  VARCHAR(255)       NULL,
    phone                  VARCHAR(50)        NULL,
    license_number         VARCHAR(100)       NULL,
    license_expiry         TIMESTAMPTZ        NULL,
    notes                  TEXT               NULL,
    is_active              BOOLEAN            NOT NULL DEFAULT TRUE,
    created_at             TIMESTAMPTZ        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_drivers_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- Table: trucks
-- Description: Catalogs fleet transport vehicles and cargo containers with accurate physical dimensions and payload capacities for 3D bin packing calculations.
-- -----------------------------------------------------------------------------
CREATE TABLE trucks (
    id                     VARCHAR(36)        NOT NULL PRIMARY KEY,
    company_id             VARCHAR(36)        NOT NULL,
    driver_id              VARCHAR(36)        NULL,
    truck_name             VARCHAR(255)       NOT NULL,
    plate_number           VARCHAR(50)        NOT NULL UNIQUE,
    length_cm              FLOAT              NOT NULL,
    width_cm               FLOAT              NOT NULL,
    height_cm              FLOAT              NOT NULL,
    max_weight_kg          FLOAT              NOT NULL,
    driver_name            VARCHAR(255)       NULL,
    availability_schedule  TEXT               NULL,
    is_active              BOOLEAN            NOT NULL DEFAULT TRUE,
    created_at             TIMESTAMPTZ        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_trucks_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    CONSTRAINT fk_trucks_driver_id FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- Table: jobs
-- Description: Core operational entity representing a freight transport contract, tracking shipment milestones, 3D cargo packing manifests, and journey state.
-- -----------------------------------------------------------------------------
CREATE TABLE jobs (
    id                     VARCHAR(36)        NOT NULL PRIMARY KEY,
    company_id             VARCHAR(36)        NOT NULL,
    truck_id               VARCHAR(36)        NULL,
    job_name               VARCHAR(255)       NOT NULL,
    date                   DATE               NOT NULL,
    time_window            VARCHAR(100)       NULL,
    description            TEXT               NULL,
    pickup_location        TEXT               NULL,
    delivery_location      TEXT               NULL,
    status                 VARCHAR(50)        NOT NULL DEFAULT 'draft',
    packing_data           TEXT               NULL,
    rating                 INTEGER            NULL CHECK (1-5),
    feedback               TEXT               NULL,
    created_at             TIMESTAMPTZ        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_jobs_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    CONSTRAINT fk_jobs_truck_id FOREIGN KEY (truck_id) REFERENCES trucks(id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- Table: boxes
-- Description: Represents individual packaged cargo items with 3D physical dimensions, weight, handling flags, and bin packing coordinate positions.
-- -----------------------------------------------------------------------------
CREATE TABLE boxes (
    id                     VARCHAR(36)        NOT NULL PRIMARY KEY,
    job_id                 VARCHAR(36)        NOT NULL,
    label_reference        VARCHAR(255)       NOT NULL,
    length_cm              FLOAT              NOT NULL,
    width_cm               FLOAT              NOT NULL,
    height_cm              FLOAT              NOT NULL,
    weight_kg              FLOAT              NOT NULL,
    stop_order             INTEGER            NOT NULL DEFAULT 1,
    fragile                BOOLEAN            NOT NULL DEFAULT FALSE,
    hazard                 BOOLEAN            NOT NULL DEFAULT FALSE,
    qr_code                TEXT               NULL,
    pack_x                 FLOAT              NULL,
    pack_y                 FLOAT              NULL,
    pack_z                 FLOAT              NULL,
    pack_rotation          INTEGER            NOT NULL DEFAULT 0,
    created_at             TIMESTAMPTZ        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_boxes_job_id FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- Table: deliveries
-- Description: Tracks delivery waypoints, recipients, electronic Proof of Delivery (e-POD), signatures, and geolocation coordinates.
-- -----------------------------------------------------------------------------
CREATE TABLE deliveries (
    id                     VARCHAR(36)        NOT NULL PRIMARY KEY,
    job_id                 VARCHAR(36)        NOT NULL,
    box_id                 VARCHAR(36)        NULL,
    stop_order             INTEGER            NOT NULL DEFAULT 1,
    recipient_name         VARCHAR(255)       NOT NULL,
    address                TEXT               NULL,
    signature_url          TEXT               NULL,
    photo_url              TEXT               NULL,
    gps_lat                FLOAT              NULL,
    gps_lng                FLOAT              NULL,
    notes                  TEXT               NULL,
    delivered_at           TIMESTAMPTZ        NULL,
    status                 VARCHAR(50)        NOT NULL DEFAULT 'pending',
    created_at             TIMESTAMPTZ        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_deliveries_job_id FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    CONSTRAINT fk_deliveries_box_id FOREIGN KEY (box_id) REFERENCES boxes(id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- Table: job_requests
-- Description: Facilitates carrier marketplace bidding, where trucking companies submit bids or accept assignments for posted freight jobs.
-- -----------------------------------------------------------------------------
CREATE TABLE job_requests (
    id                     VARCHAR(36)        NOT NULL PRIMARY KEY,
    job_id                 VARCHAR(36)        NOT NULL,
    truck_id               VARCHAR(36)        NOT NULL,
    trucker_id             VARCHAR(36)        NOT NULL,
    message                TEXT               NULL,
    status                 VARCHAR(30)        NOT NULL DEFAULT 'pending',
    created_at             TIMESTAMPTZ        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_job_requests_job_id FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    CONSTRAINT fk_job_requests_truck_id FOREIGN KEY (truck_id) REFERENCES trucks(id) ON DELETE CASCADE,
    CONSTRAINT fk_job_requests_trucker_id FOREIGN KEY (trucker_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- Table: claims
-- Description: Manages damage claims, cargo loss incidents, and freight disputes between shippers and carriers with administrative adjudication.
-- -----------------------------------------------------------------------------
CREATE TABLE claims (
    id                     VARCHAR(36)        NOT NULL PRIMARY KEY,
    company_id             VARCHAR(36)        NOT NULL,
    job_id                 VARCHAR(36)        NOT NULL,
    description            TEXT               NOT NULL,
    proof_url              TEXT               NULL,
    status                 VARCHAR(50)        NOT NULL DEFAULT 'open',
    admin_notes            TEXT               NULL,
    created_at             TIMESTAMPTZ        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_claims_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    CONSTRAINT fk_claims_job_id FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- Table: audit_logs
-- Description: Immutable security and chain-of-custody tracking log recording every scan, status update, geofence trigger, and transit checkpoint.
-- -----------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id                     VARCHAR(36)        NOT NULL PRIMARY KEY,
    job_id                 VARCHAR(36)        NOT NULL,
    box_id                 VARCHAR(36)        NULL,
    user_id                VARCHAR(36)        NULL,
    action                 VARCHAR(100)       NOT NULL,
    details                TEXT               NULL,
    gps_lat                FLOAT              NULL,
    gps_lng                FLOAT              NULL,
    scanned_at             TIMESTAMPTZ        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_logs_job_id FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    CONSTRAINT fk_audit_logs_box_id FOREIGN KEY (box_id) REFERENCES boxes(id) ON DELETE CASCADE,
    CONSTRAINT fk_audit_logs_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- Table: team_invites
-- Description: Secures organizational member onboarding through time-limited cryptographic tokens for new dispatchers and staff.
-- -----------------------------------------------------------------------------
CREATE TABLE team_invites (
    id                     VARCHAR(36)        NOT NULL PRIMARY KEY,
    company_id             VARCHAR(36)        NOT NULL,
    email                  VARCHAR(255)       NOT NULL,
    role                   VARCHAR(50)        NOT NULL DEFAULT 'user',
    token                  VARCHAR(255)       NOT NULL UNIQUE,
    status                 VARCHAR(50)        NOT NULL DEFAULT 'pending',
    created_at             TIMESTAMPTZ        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at             TIMESTAMPTZ        NOT NULL,
    CONSTRAINT fk_team_invites_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);
