"""
Generator for CargoSync Project Documentation Diagrams
Generates:
1. Use Case Diagram (UML Standard)
2. ER Diagram (Relational Schema / Crow's Foot)
3. Activity Diagram (UML Swimlane Workflow)
4. Sequence Diagram (UML Multi-Participant Lifecycle)

Formatting Rules:
- Plain black (#000000) for text, strokes, arrows, and borders
- Pure white (#FFFFFF) background and fills
- Standard UML / ER symbols
- High resolution vector SVGs and 300 DPI PNG exports
"""

import os
import subprocess

OUTPUT_DIR = "/Users/dharveshahamed/Desktop/Cargo Sync/new diagrams"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# -------------------------------------------------------------
# 1. USE CASE DIAGRAM SVG
# -------------------------------------------------------------
def get_use_case_svg() -> str:
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 1700" width="1400" height="1700">
  <defs>
    <style>
      .title { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 24px; font-weight: bold; fill: #000000; text-anchor: middle; }
      .subtitle { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 14px; fill: #000000; text-anchor: middle; }
      .boundary-label { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 16px; font-weight: bold; fill: #000000; }
      .package-label { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 13px; font-weight: bold; fill: #000000; font-style: italic; }
      .actor-label { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 13px; font-weight: bold; fill: #000000; text-anchor: middle; }
      .actor-sub { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 11px; fill: #000000; text-anchor: middle; }
      .usecase-text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 12px; font-weight: 600; fill: #000000; text-anchor: middle; }
      .rel-label { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 10px; font-weight: bold; fill: #000000; text-anchor: middle; }
      .line { stroke: #000000; stroke-width: 1.5; fill: none; }
      .line-dashed { stroke: #000000; stroke-width: 1.5; stroke-dasharray: 5,4; fill: none; }
      .usecase { fill: #FFFFFF; stroke: #000000; stroke-width: 1.6; }
      .boundary { fill: #FFFFFF; stroke: #000000; stroke-width: 2; }
      .sub-box { fill: none; stroke: #000000; stroke-width: 1; stroke-dasharray: 4,3; }
      .actor-head { fill: #FFFFFF; stroke: #000000; stroke-width: 1.8; }
    </style>
    <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#000000" />
    </marker>
    <marker id="arrow-open" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9" fill="none" stroke="#000000" stroke-width="1.5" />
    </marker>
  </defs>

  <!-- Background -->
  <rect x="0" y="0" width="1400" height="1700" fill="#FFFFFF" />

  <!-- Diagram Header -->
  <text x="700" y="45" class="title">CARGOSYNC PLATFORM — USE CASE DIAGRAM</text>
  <text x="700" y="70" class="subtitle">Standard UML Use Case Model • Plain Monochrome Specification</text>

  <!-- System Boundary -->
  <rect x="250" y="100" width="900" height="1560" class="boundary" rx="8" />
  <text x="270" y="130" class="boundary-label">«system» CargoSync Freight &amp; Fleet Orchestration Engine</text>

  <!-- ==================== LEFT ACTORS (SHIPPERS / USERS) ==================== -->
  
  <!-- Actor 1: Shipper / Company -->
  <g transform="translate(110, 360)">
    <circle cx="0" cy="-45" r="15" class="actor-head" />
    <line x1="0" y1="-30" x2="0" y2="10" class="line" style="stroke-width:2" />
    <line x1="-25" y1="-15" x2="25" y2="-15" class="line" style="stroke-width:2" />
    <line x1="0" y1="10" x2="-20" y2="40" class="line" style="stroke-width:2" />
    <line x1="0" y1="10" x2="20" y2="40" class="line" style="stroke-width:2" />
    <text x="0" y="60" class="actor-label">Shipper</text>
    <text x="0" y="75" class="actor-sub">(Company User / Manager)</text>
  </g>

  <!-- Actor 2: Driver -->
  <g transform="translate(110, 1150)">
    <circle cx="0" cy="-45" r="15" class="actor-head" />
    <line x1="0" y1="-30" x2="0" y2="10" class="line" style="stroke-width:2" />
    <line x1="-25" y1="-15" x2="25" y2="-15" class="line" style="stroke-width:2" />
    <line x1="0" y1="10" x2="-20" y2="40" class="line" style="stroke-width:2" />
    <line x1="0" y1="10" x2="20" y2="40" class="line" style="stroke-width:2" />
    <text x="0" y="60" class="actor-label">Fleet Driver</text>
    <text x="0" y="75" class="actor-sub">(Field Operator)</text>
  </g>

  <!-- ==================== RIGHT ACTORS (FLEET TRUCKER & ADMIN) ==================== -->
  
  <!-- Actor 3: Fleet Owner / Trucker -->
  <g transform="translate(1280, 520)">
    <circle cx="0" cy="-45" r="15" class="actor-head" />
    <line x1="0" y1="-30" x2="0" y2="10" class="line" style="stroke-width:2" />
    <line x1="-25" y1="-15" x2="25" y2="-15" class="line" style="stroke-width:2" />
    <line x1="0" y1="10" x2="-20" y2="40" class="line" style="stroke-width:2" />
    <line x1="0" y1="10" x2="20" y2="40" class="line" style="stroke-width:2" />
    <text x="0" y="60" class="actor-label">Fleet Owner</text>
    <text x="0" y="75" class="actor-sub">(Trucker Admin)</text>
  </g>

  <!-- Actor 4: System / 3D Engine -->
  <g transform="translate(1280, 950)">
    <rect x="-35" y="-35" width="70" height="45" fill="#FFFFFF" stroke="#000000" stroke-width="1.8" />
    <text x="0" y="-18" class="actor-label">«service»</text>
    <text x="0" y="-3" class="actor-label">3D Engine</text>
    <text x="0" y="25" class="actor-label">Optimization</text>
    <text x="0" y="40" class="actor-sub">(FFDH Alg.)</text>
  </g>

  <!-- Actor 5: Platform Admin -->
  <g transform="translate(1280, 1420)">
    <circle cx="0" cy="-45" r="15" class="actor-head" />
    <line x1="0" y1="-30" x2="0" y2="10" class="line" style="stroke-width:2" />
    <line x1="-25" y1="-15" x2="25" y2="-15" class="line" style="stroke-width:2" />
    <line x1="0" y1="10" x2="-20" y2="40" class="line" style="stroke-width:2" />
    <line x1="0" y1="10" x2="20" y2="40" class="line" style="stroke-width:2" />
    <text x="0" y="60" class="actor-label">Platform Admin</text>
    <text x="0" y="75" class="actor-sub">(System Superadmin)</text>
  </g>

  <!-- ==================== USE CASES INSIDE BOUNDARY ==================== -->

  <!-- Subsystem A: Authentication & Profile -->
  <rect x="270" y="150" width="860" height="150" class="sub-box" />
  <text x="285" y="172" class="package-label">Subsystem: Identity &amp; Profile Management</text>

  <!-- UC1 -->
  <ellipse cx="440" cy="220" rx="120" ry="32" class="usecase" id="uc1" />
  <text x="440" y="217" class="usecase-text">Register Organization</text>
  <text x="440" y="233" class="usecase-text">(Company / Trucker)</text>

  <!-- UC2 -->
  <ellipse cx="730" cy="220" rx="110" ry="32" class="usecase" id="uc2" />
  <text x="730" y="217" class="usecase-text">Authenticate &amp; Login</text>
  <text x="730" y="233" class="usecase-text">(JWT Sessions)</text>

  <!-- UC3 -->
  <ellipse cx="1000" cy="220" rx="100" ry="32" class="usecase" id="uc3" />
  <text x="1000" y="217" class="usecase-text">Manage Team</text>
  <text x="1000" y="233" class="usecase-text">&amp; Roles</text>

  <!-- Subsystem B: Fleet & Resource Operations -->
  <rect x="270" y="320" width="860" height="150" class="sub-box" />
  <text x="285" y="342" class="package-label">Subsystem: Fleet Vehicle &amp; Driver Management</text>

  <!-- UC4 -->
  <ellipse cx="450" cy="395" rx="130" ry="32" class="usecase" id="uc4" />
  <text x="450" y="392" class="usecase-text">Register Fleet Trucks</text>
  <text x="450" y="408" class="usecase-text">(L×W×H &amp; Max Weight)</text>

  <!-- UC5 -->
  <ellipse cx="760" cy="395" rx="120" ry="32" class="usecase" id="uc5" />
  <text x="760" y="392" class="usecase-text">Manage Drivers</text>
  <text x="760" y="408" class="usecase-text">&amp; License Records</text>

  <!-- UC6 -->
  <ellipse cx="1020" cy="395" rx="95" ry="32" class="usecase" id="uc6" />
  <text x="1020" y="392" class="usecase-text">Assign Driver</text>
  <text x="1020" y="408" class="usecase-text">to Truck</text>

  <!-- Subsystem C: Freight Creation & Marketplace -->
  <rect x="270" y="490" width="860" height="260" class="sub-box" />
  <text x="285" y="512" class="package-label">Subsystem: Freight Creation &amp; Marketplace Orchestration</text>

  <!-- UC7 -->
  <ellipse cx="440" cy="565" rx="130" ry="32" class="usecase" id="uc7" />
  <text x="440" y="562" class="usecase-text">Create Freight Job</text>
  <text x="440" y="578" class="usecase-text">(Route, Date &amp; Delivery Window)</text>

  <!-- UC8 -->
  <ellipse cx="750" cy="565" rx="130" ry="32" class="usecase" id="uc8" />
  <text x="750" y="562" class="usecase-text">Add Cargo Packages</text>
  <text x="750" y="578" class="usecase-text">(Dimensions, Weight, Fragile)</text>

  <!-- UC9 -->
  <ellipse cx="1020" cy="565" rx="95" ry="32" class="usecase" id="uc9" />
  <text x="1020" y="562" class="usecase-text">Publish Job to</text>
  <text x="1020" y="578" class="usecase-text">Marketplace</text>

  <!-- UC10 -->
  <ellipse cx="440" cy="670" rx="130" ry="32" class="usecase" id="uc10" />
  <text x="440" y="667" class="usecase-text">Browse &amp; Accept</text>
  <text x="440" y="683" class="usecase-text">Marketplace Shipments</text>

  <!-- UC11 -->
  <ellipse cx="780" cy="670" rx="145" ry="35" class="usecase" id="uc11" />
  <text x="780" y="667" class="usecase-text">Consolidate &amp; Combine</text>
  <text x="780" y="683" class="usecase-text">Jobs into Active Trip</text>

  <!-- Subsystem D: 3D Packing & Manifest -->
  <rect x="270" y="770" width="860" height="240" class="sub-box" />
  <text x="285" y="792" class="package-label">Subsystem: 3D Bin Packing &amp; Spatial Loading</text>

  <!-- UC12 -->
  <ellipse cx="480" cy="845" rx="145" ry="35" class="usecase" id="uc12" />
  <text x="480" y="842" class="usecase-text">Compute 3D Bin Packing</text>
  <text x="480" y="858" class="usecase-text">(Obstacles &amp; Multi-Job Placements)</text>

  <!-- UC13 -->
  <ellipse cx="840" cy="845" rx="135" ry="35" class="usecase" id="uc13" />
  <text x="840" y="842" class="usecase-text">Interactive 3D Visualizer</text>
  <text x="840" y="858" class="usecase-text">(Inspect Cargo &amp; Container Axle)</text>

  <!-- UC14 -->
  <ellipse cx="640" cy="940" rx="140" ry="32" class="usecase" id="uc14" />
  <text x="640" y="937" class="usecase-text">Generate PDF Load Sheet</text>
  <text x="640" y="953" class="usecase-text">&amp; QR Cargo Labels</text>

  <!-- Subsystem E: Verification, Checklists & Transit -->
  <rect x="270" y="1030" width="860" height="310" class="sub-box" />
  <text x="285" y="1052" class="package-label">Subsystem: Chain of Custody, Checklists &amp; Trip Execution</text>

  <!-- UC15 -->
  <ellipse cx="450" cy="1115" rx="140" ry="35" class="usecase" id="uc15" />
  <text x="450" y="1112" class="usecase-text">Perform Pre-Departure</text>
  <text x="450" y="1128" class="usecase-text">Loading Checklist</text>

  <!-- UC16 -->
  <ellipse cx="780" cy="1115" rx="125" ry="35" class="usecase" id="uc16" />
  <text x="780" y="1112" class="usecase-text">Start Freight Trip</text>
  <text x="780" y="1128" class="usecase-text">(Transition to In-Transit)</text>

  <!-- UC17 -->
  <ellipse cx="1020" cy="1115" rx="90" ry="35" class="usecase" id="uc17" />
  <text x="1020" y="1112" class="usecase-text">Track Shipment</text>
  <text x="1020" y="1128" class="usecase-text">Real-Time Status</text>

  <!-- UC18 -->
  <ellipse cx="460" cy="1245" rx="145" ry="35" class="usecase" id="uc18" />
  <text x="460" y="1242" class="usecase-text">Destination Unloading</text>
  <text x="460" y="1258" class="usecase-text">Verification Checklist</text>

  <!-- UC19 -->
  <ellipse cx="790" cy="1245" rx="135" ry="35" class="usecase" id="uc19" />
  <text x="790" y="1242" class="usecase-text">Capture Proof of Delivery</text>
  <text x="790" y="1258" class="usecase-text">(Signature &amp; Consignee Notes)</text>

  <!-- UC20 -->
  <ellipse cx="1020" cy="1245" rx="95" ry="35" class="usecase" id="uc20" />
  <text x="1020" y="1242" class="usecase-text">Notify Shipper of</text>
  <text x="1020" y="1258" class="usecase-text">Cargo Arrival</text>

  <!-- Subsystem F: Audit & Governance -->
  <rect x="270" y="1360" width="860" height="270" class="sub-box" />
  <text x="285" y="1382" class="package-label">Subsystem: Governance, Claims &amp; Audit Trail</text>

  <!-- UC21 -->
  <ellipse cx="460" cy="1440" rx="130" ry="32" class="usecase" id="uc21" />
  <text x="460" y="1437" class="usecase-text">Record Immutable Audit Log</text>
  <text x="460" y="1453" class="usecase-text">(GPS Coordinates &amp; Timestamps)</text>

  <!-- UC22 -->
  <ellipse cx="780" cy="1440" rx="120" ry="32" class="usecase" id="uc22" />
  <text x="780" y="1437" class="usecase-text">File Cargo Damage</text>
  <text x="780" y="1453" class="usecase-text">or Loss Claim</text>

  <!-- UC23 -->
  <ellipse cx="1010" cy="1440" rx="100" ry="32" class="usecase" id="uc23" />
  <text x="1010" y="1437" class="usecase-text">Audit &amp; Resolve</text>
  <text x="1010" y="1453" class="usecase-text">Claims</text>

  <!-- UC24 -->
  <ellipse cx="620" cy="1540" rx="130" ry="32" class="usecase" id="uc24" />
  <text x="620" y="1537" class="usecase-text">Platform Supervision</text>
  <text x="620" y="1553" class="usecase-text">&amp; Company Verification</text>

  <!-- ==================== ACTOR ASSOCIATION LINES ==================== -->
  
  <!-- Shipper Associations -->
  <line x1="140" y1="360" x2="330" y2="230" class="line" />
  <line x1="140" y1="365" x2="620" y2="230" class="line" />
  <line x1="140" y1="380" x2="315" y2="565" class="line" />
  <line x1="140" y1="390" x2="620" y2="565" class="line" />
  <line x1="140" y1="400" x2="930" y2="570" class="line" />
  <line x1="140" y1="410" x2="930" y2="1115" class="line" />
  <line x1="140" y1="430" x2="665" y2="1440" class="line" />

  <!-- Fleet Owner Associations -->
  <line x1="1245" y1="510" x2="840" y2="230" class="line" />
  <line x1="1245" y1="520" x2="580" y2="395" class="line" />
  <line x1="1245" y1="530" x2="880" y2="395" class="line" />
  <line x1="1245" y1="540" x2="925" y2="400" class="line" />
  <line x1="1245" y1="560" x2="565" y2="665" class="line" />
  <line x1="1245" y1="575" x2="920" y2="670" class="line" />
  <line x1="1245" y1="590" x2="620" y2="845" class="line" />
  <line x1="1245" y1="600" x2="710" y2="850" class="line" />
  <line x1="1245" y1="620" x2="900" y2="1120" class="line" />

  <!-- Driver Associations -->
  <line x1="145" y1="1140" x2="315" y2="1115" class="line" />
  <line x1="145" y1="1150" x2="655" y2="1120" class="line" />
  <line x1="145" y1="1165" x2="320" y2="1245" class="line" />
  <line x1="145" y1="1180" x2="655" y2="1250" class="line" />
  <line x1="145" y1="1130" x2="510" y2="950" class="line" />

  <!-- System / 3D Engine Associations -->
  <line x1="1240" y1="940" x2="625" y2="845" class="line" />
  <line x1="1240" y1="960" x2="780" y2="940" class="line" />
  <line x1="1240" y1="980" x2="925" y2="1245" class="line" />
  <line x1="1240" y1="1000" x2="585" y2="1440" class="line" />

  <!-- Platform Admin Associations -->
  <line x1="1245" y1="1410" x2="840" y2="230" class="line" />
  <line x1="1245" y1="1430" x2="910" y2="1440" class="line" />
  <line x1="1245" y1="1450" x2="750" y2="1540" class="line" />

  <!-- ==================== «INCLUDE» AND «EXTEND» RELATIONSHIPS ==================== -->
  
  <!-- UC11 extends UC10 -->
  <line x1="780" y1="670" x2="570" y2="670" class="line-dashed" marker-end="url(#arrow-open)" />
  <text x="670" y="660" class="rel-label">«extend»</text>

  <!-- UC11 includes UC12 -->
  <line x1="750" y1="705" x2="520" y2="815" class="line-dashed" marker-end="url(#arrow-open)" />
  <text x="660" y="750" class="rel-label">«include»</text>

  <!-- UC16 includes UC15 -->
  <line x1="660" y1="1115" x2="590" y2="1115" class="line-dashed" marker-end="url(#arrow-open)" />
  <text x="625" y="1105" class="rel-label">«include»</text>

  <!-- UC18 includes UC19 -->
  <line x1="605" y1="1245" x2="655" y2="1245" class="line-dashed" marker-end="url(#arrow-open)" />
  <text x="630" y="1235" class="rel-label">«include»</text>

  <!-- UC18 includes UC20 -->
  <line x1="605" y1="1260" x2="925" y2="1250" class="line-dashed" marker-end="url(#arrow-open)" />
  <text x="760" y="1285" class="rel-label">«include»</text>

  <!-- UC8 includes UC7 -->
  <line x1="620" y1="565" x2="570" y2="565" class="line-dashed" marker-end="url(#arrow-open)" />
  <text x="595" y="555" class="rel-label">«include»</text>

</svg>'''

# -------------------------------------------------------------
# 2. ENTITY RELATIONSHIP (ER) DIAGRAM SVG
# -------------------------------------------------------------
def get_er_svg() -> str:
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1700 1300" width="1700" height="1300">
  <defs>
    <style>
      .title { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 24px; font-weight: bold; fill: #000000; text-anchor: middle; }
      .subtitle { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 14px; fill: #000000; text-anchor: middle; }
      .tbl-header { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 13px; font-weight: bold; fill: #FFFFFF; }
      .col-pk { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 11px; font-weight: bold; fill: #000000; }
      .col-fk { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 11px; font-weight: bold; fill: #000000; font-style: italic; }
      .col-name { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 11px; fill: #000000; }
      .col-type { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 10px; fill: #000000; text-anchor: end; }
      .card-label { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 10px; font-weight: bold; fill: #000000; }
      .table-box { fill: #FFFFFF; stroke: #000000; stroke-width: 1.6; }
      .header-box { fill: #000000; stroke: #000000; stroke-width: 1.6; }
      .divider { stroke: #000000; stroke-width: 1; }
      .rel-line { stroke: #000000; stroke-width: 1.6; fill: none; }
    </style>
  </defs>

  <!-- Background -->
  <rect x="0" y="0" width="1700" height="1300" fill="#FFFFFF" />

  <!-- Diagram Title -->
  <text x="850" y="40" class="title">CARGOSYNC DATABASE RELATIONAL SCHEMA (ER DIAGRAM)</text>
  <text x="850" y="65" class="subtitle">PostgreSQL Relational Entities • Primary Keys (PK), Foreign Keys (FK) &amp; Cardinality (1:N)</text>

  <!-- ==================== ENTITY 1: COMPANIES (Central Organization) ==================== -->
  <g transform="translate(640, 100)">
    <rect x="0" y="0" width="260" height="230" class="table-box" />
    <rect x="0" y="0" width="260" height="28" class="header-box" />
    <text x="130" y="19" class="tbl-header" text-anchor="middle">COMPANIES</text>

    <!-- Attributes -->
    <text x="10" y="48" class="col-pk">PK  id</text><text x="250" y="48" class="col-type">UUID</text>
    <line x1="0" y1="56" x2="260" y2="56" class="divider" />
    <text x="10" y="74" class="col-name">name</text><text x="250" y="74" class="col-type">VARCHAR(255)</text>
    <text x="10" y="94" class="col-name">email</text><text x="250" y="94" class="col-type">VARCHAR(255)</text>
    <text x="10" y="114" class="col-name">phone</text><text x="250" y="114" class="col-type">VARCHAR(50)</text>
    <text x="10" y="134" class="col-name">address</text><text x="250" y="134" class="col-type">TEXT</text>
    <text x="10" y="154" class="col-name">logo_url</text><text x="250" y="154" class="col-type">TEXT</text>
    <text x="10" y="174" class="col-name">account_type</text><text x="250" y="174" class="col-type">VARCHAR(30)</text>
    <text x="10" y="194" class="col-name">created_at</text><text x="250" y="194" class="col-type">TIMESTAMPTZ</text>
  </g>

  <!-- ==================== ENTITY 2: USERS (Team Members) ==================== -->
  <g transform="translate(260, 100)">
    <rect x="0" y="0" width="250" height="230" class="table-box" />
    <rect x="0" y="0" width="250" height="28" class="header-box" />
    <text x="125" y="19" class="tbl-header" text-anchor="middle">USERS</text>

    <text x="10" y="48" class="col-pk">PK  id</text><text x="240" y="48" class="col-type">UUID</text>
    <line x1="0" y1="56" x2="250" y2="56" class="divider" />
    <text x="10" y="74" class="col-fk">FK  company_id</text><text x="240" y="74" class="col-type">UUID</text>
    <text x="10" y="94" class="col-name">email</text><text x="240" y="94" class="col-type">VARCHAR(255)</text>
    <text x="10" y="114" class="col-name">password_hash</text><text x="240" y="114" class="col-type">VARCHAR(255)</text>
    <text x="10" y="134" class="col-name">name</text><text x="240" y="134" class="col-type">VARCHAR(100)</text>
    <text x="10" y="154" class="col-name">phone</text><text x="240" y="154" class="col-type">VARCHAR(50)</text>
    <text x="10" y="174" class="col-name">role</text><text x="240" y="174" class="col-type">VARCHAR(20)</text>
    <text x="10" y="194" class="col-name">created_at</text><text x="240" y="194" class="col-type">TIMESTAMPTZ</text>
  </g>

  <!-- ==================== ENTITY 3: ADMINS ==================== -->
  <g transform="translate(40, 100)">
    <rect x="0" y="0" width="180" height="150" class="table-box" />
    <rect x="0" y="0" width="180" height="28" class="header-box" />
    <text x="90" y="19" class="tbl-header" text-anchor="middle">ADMINS</text>

    <text x="10" y="48" class="col-pk">PK  id</text><text x="170" y="48" class="col-type">UUID</text>
    <line x1="0" y1="56" x2="180" y2="56" class="divider" />
    <text x="10" y="74" class="col-name">email</text><text x="170" y="74" class="col-type">VARCHAR</text>
    <text x="10" y="94" class="col-name">full_name</text><text x="170" y="94" class="col-type">VARCHAR</text>
    <text x="10" y="114" class="col-name">is_superadmin</text><text x="170" y="114" class="col-type">BOOLEAN</text>
    <text x="10" y="134" class="col-name">created_at</text><text x="170" y="134" class="col-type">TIMESTAMPTZ</text>
  </g>

  <!-- ==================== ENTITY 4: TRUCKS (Fleet Assets) ==================== -->
  <g transform="translate(1040, 100)">
    <rect x="0" y="0" width="260" height="230" class="table-box" />
    <rect x="0" y="0" width="260" height="28" class="header-box" />
    <text x="130" y="19" class="tbl-header" text-anchor="middle">TRUCKS</text>

    <text x="10" y="48" class="col-pk">PK  id</text><text x="250" y="48" class="col-type">UUID</text>
    <line x1="0" y1="56" x2="260" y2="56" class="divider" />
    <text x="10" y="74" class="col-fk">FK  company_id</text><text x="250" y="74" class="col-type">UUID</text>
    <text x="10" y="94" class="col-name">truck_name</text><text x="250" y="94" class="col-type">VARCHAR(100)</text>
    <text x="10" y="114" class="col-name">plate_number</text><text x="250" y="114" class="col-type">VARCHAR(30)</text>
    <text x="10" y="134" class="col-name">length_cm, width_cm</text><text x="250" y="134" class="col-type">NUMERIC</text>
    <text x="10" y="154" class="col-name">height_cm, max_wt</text><text x="250" y="154" class="col-type">NUMERIC</text>
    <text x="10" y="174" class="col-name">is_active</text><text x="250" y="174" class="col-type">BOOLEAN</text>
    <text x="10" y="194" class="col-name">created_at</text><text x="250" y="194" class="col-type">TIMESTAMPTZ</text>
  </g>

  <!-- ==================== ENTITY 5: DRIVERS ==================== -->
  <g transform="translate(1390, 100)">
    <rect x="0" y="0" width="250" height="210" class="table-box" />
    <rect x="0" y="0" width="250" height="28" class="header-box" />
    <text x="125" y="19" class="tbl-header" text-anchor="middle">DRIVERS</text>

    <text x="10" y="48" class="col-pk">PK  id</text><text x="240" y="48" class="col-type">UUID</text>
    <line x1="0" y1="56" x2="250" y2="56" class="divider" />
    <text x="10" y="74" class="col-fk">FK  company_id</text><text x="240" y="74" class="col-type">UUID</text>
    <text x="10" y="94" class="col-fk">FK  truck_id</text><text x="240" y="94" class="col-type">UUID</text>
    <text x="10" y="114" class="col-name">full_name</text><text x="240" y="114" class="col-type">VARCHAR(100)</text>
    <text x="10" y="134" class="col-name">phone</text><text x="240" y="134" class="col-type">VARCHAR(50)</text>
    <text x="10" y="154" class="col-name">license_number</text><text x="240" y="154" class="col-type">VARCHAR(50)</text>
    <text x="10" y="174" class="col-name">is_active</text><text x="240" y="174" class="col-type">BOOLEAN</text>
  </g>

  <!-- ==================== ENTITY 6: JOBS (Shipment Header) ==================== -->
  <g transform="translate(640, 440)">
    <rect x="0" y="0" width="280" height="300" class="table-box" />
    <rect x="0" y="0" width="280" height="28" class="header-box" />
    <text x="140" y="19" class="tbl-header" text-anchor="middle">JOBS (FREIGHT SHIPMENTS)</text>

    <text x="10" y="48" class="col-pk">PK  id</text><text x="270" y="48" class="col-type">UUID</text>
    <line x1="0" y1="56" x2="280" y2="56" class="divider" />
    <text x="10" y="74" class="col-fk">FK  company_id</text><text x="270" y="74" class="col-type">UUID</text>
    <text x="10" y="94" class="col-fk">FK  truck_id</text><text x="270" y="94" class="col-type">UUID (Nullable)</text>
    <text x="10" y="114" class="col-name">job_name</text><text x="270" y="114" class="col-type">VARCHAR(255)</text>
    <text x="10" y="134" class="col-name">status</text><text x="270" y="134" class="col-type">VARCHAR(30)</text>
    <text x="10" y="154" class="col-name">pickup_location</text><text x="270" y="154" class="col-type">VARCHAR(255)</text>
    <text x="10" y="174" class="col-name">delivery_location</text><text x="270" y="174" class="col-type">VARCHAR(255)</text>
    <text x="10" y="194" class="col-name">pickup_lat, pickup_lng</text><text x="270" y="194" class="col-type">NUMERIC</text>
    <text x="10" y="214" class="col-name">delivery_lat, lng</text><text x="270" y="214" class="col-type">NUMERIC</text>
    <text x="10" y="234" class="col-name">date, time_window</text><text x="270" y="234" class="col-type">DATE / VARCHAR</text>
    <text x="10" y="254" class="col-name">packing_data</text><text x="270" y="254" class="col-type">JSONB</text>
    <text x="10" y="274" class="col-name">created_at, updated_at</text><text x="270" y="274" class="col-type">TIMESTAMPTZ</text>
  </g>

  <!-- ==================== ENTITY 7: BOXES (Cargo Items) ==================== -->
  <g transform="translate(230, 460)">
    <rect x="0" y="0" width="280" height="280" class="table-box" />
    <rect x="0" y="0" width="280" height="28" class="header-box" />
    <text x="140" y="19" class="tbl-header" text-anchor="middle">BOXES (CARGO PACKAGES)</text>

    <text x="10" y="48" class="col-pk">PK  id</text><text x="270" y="48" class="col-type">UUID</text>
    <line x1="0" y1="56" x2="280" y2="56" class="divider" />
    <text x="10" y="74" class="col-fk">FK  job_id</text><text x="270" y="74" class="col-type">UUID</text>
    <text x="10" y="94" class="col-name">label_reference</text><text x="270" y="94" class="col-type">VARCHAR(100)</text>
    <text x="10" y="114" class="col-name">length_cm, width_cm</text><text x="270" y="114" class="col-type">NUMERIC(8,2)</text>
    <text x="10" y="134" class="col-name">height_cm, weight_kg</text><text x="270" y="134" class="col-type">NUMERIC(8,2)</text>
    <text x="10" y="154" class="col-name">fragile</text><text x="270" y="154" class="col-type">BOOLEAN</text>
    <text x="10" y="174" class="col-name">stop_order</text><text x="270" y="174" class="col-type">INTEGER</text>
    <text x="10" y="194" class="col-name">qr_code_url</text><text x="270" y="194" class="col-type">TEXT</text>
    <text x="10" y="214" class="col-name">pack_x, pack_y, pack_z</text><text x="270" y="214" class="col-type">NUMERIC(8,2)</text>
    <text x="10" y="234" class="col-name">pack_rotation</text><text x="270" y="234" class="col-type">INTEGER</text>
  </g>

  <!-- ==================== ENTITY 8: DELIVERIES (Multi-Stop & POD) ==================== -->
  <g transform="translate(1050, 470)">
    <rect x="0" y="0" width="270" height="250" class="table-box" />
    <rect x="0" y="0" width="270" height="28" class="header-box" />
    <text x="135" y="19" class="tbl-header" text-anchor="middle">DELIVERIES (STOPS &amp; POD)</text>

    <text x="10" y="48" class="col-pk">PK  id</text><text x="260" y="48" class="col-type">UUID</text>
    <line x1="0" y1="56" x2="270" y2="56" class="divider" />
    <text x="10" y="74" class="col-fk">FK  job_id</text><text x="260" y="74" class="col-type">UUID</text>
    <text x="10" y="94" class="col-name">stop_order</text><text x="260" y="94" class="col-type">INTEGER</text>
    <text x="10" y="114" class="col-name">recipient_name</text><text x="260" y="114" class="col-type">VARCHAR(100)</text>
    <text x="10" y="134" class="col-name">address</text><text x="260" y="134" class="col-type">TEXT</text>
    <text x="10" y="154" class="col-name">status</text><text x="260" y="154" class="col-type">VARCHAR(20)</text>
    <text x="10" y="174" class="col-name">signature_data</text><text x="260" y="174" class="col-type">TEXT</text>
    <text x="10" y="194" class="col-name">proof_photo_url</text><text x="260" y="194" class="col-type">TEXT</text>
    <text x="10" y="214" class="col-name">delivered_at</text><text x="260" y="214" class="col-type">TIMESTAMPTZ</text>
  </g>

  <!-- ==================== ENTITY 9: AUDIT_LOGS (Chain of Custody) ==================== -->
  <g transform="translate(300, 890)">
    <rect x="0" y="0" width="260" height="210" class="table-box" />
    <rect x="0" y="0" width="260" height="28" class="header-box" />
    <text x="130" y="19" class="tbl-header" text-anchor="middle">AUDIT_LOGS (CUSTODY)</text>

    <text x="10" y="48" class="col-pk">PK  id</text><text x="250" y="48" class="col-type">UUID</text>
    <line x1="0" y1="56" x2="260" y2="56" class="divider" />
    <text x="10" y="74" class="col-fk">FK  job_id</text><text x="250" y="74" class="col-type">UUID</text>
    <text x="10" y="94" class="col-fk">FK  user_id</text><text x="250" y="94" class="col-type">UUID (Nullable)</text>
    <text x="10" y="114" class="col-name">action</text><text x="250" y="114" class="col-type">VARCHAR(50)</text>
    <text x="10" y="134" class="col-name">details</text><text x="250" y="134" class="col-type">TEXT</text>
    <text x="10" y="154" class="col-name">gps_lat, gps_lng</text><text x="250" y="154" class="col-type">NUMERIC</text>
    <text x="10" y="174" class="col-name">timestamp</text><text x="250" y="174" class="col-type">TIMESTAMPTZ</text>
  </g>

  <!-- ==================== ENTITY 10: CLAIMS ==================== -->
  <g transform="translate(680, 890)">
    <rect x="0" y="0" width="260" height="210" class="table-box" />
    <rect x="0" y="0" width="260" height="28" class="header-box" />
    <text x="130" y="19" class="tbl-header" text-anchor="middle">CLAIMS (CARGO DAMAGE)</text>

    <text x="10" y="48" class="col-pk">PK  id</text><text x="250" y="48" class="col-type">UUID</text>
    <line x1="0" y1="56" x2="260" y2="56" class="divider" />
    <text x="10" y="74" class="col-fk">FK  job_id</text><text x="250" y="74" class="col-type">UUID</text>
    <text x="10" y="94" class="col-fk">FK  box_id</text><text x="250" y="94" class="col-type">UUID (Nullable)</text>
    <text x="10" y="114" class="col-fk">FK  user_id</text><text x="250" y="114" class="col-type">UUID</text>
    <text x="10" y="134" class="col-name">claim_type</text><text x="250" y="134" class="col-type">VARCHAR(50)</text>
    <text x="10" y="154" class="col-name">status</text><text x="250" y="154" class="col-type">VARCHAR(20)</text>
    <text x="10" y="174" class="col-name">description</text><text x="250" y="174" class="col-type">TEXT</text>
  </g>

  <!-- ==================== ENTITY 11: JOB_REQUESTS ==================== -->
  <g transform="translate(1070, 890)">
    <rect x="0" y="0" width="250" height="190" class="table-box" />
    <rect x="0" y="0" width="250" height="28" class="header-box" />
    <text x="125" y="19" class="tbl-header" text-anchor="middle">JOB_REQUESTS</text>

    <text x="10" y="48" class="col-pk">PK  id</text><text x="240" y="48" class="col-type">UUID</text>
    <line x1="0" y1="56" x2="250" y2="56" class="divider" />
    <text x="10" y="74" class="col-fk">FK  job_id</text><text x="240" y="74" class="col-type">UUID</text>
    <text x="10" y="94" class="col-fk">FK  truck_id</text><text x="240" y="94" class="col-type">UUID</text>
    <text x="10" y="114" class="col-fk">FK  company_id</text><text x="240" y="114" class="col-type">UUID</text>
    <text x="10" y="134" class="col-name">status</text><text x="240" y="134" class="col-type">VARCHAR(20)</text>
    <text x="10" y="154" class="col-name">message</text><text x="240" y="154" class="col-type">TEXT</text>
  </g>

  <!-- ==================== RELATIONSHIPS & CARDINALITY LINES ==================== -->

  <!-- 1. COMPANIES (1) -> USERS (N) -->
  <line x1="640" y1="180" x2="510" y2="180" class="rel-line" />
  <text x="615" y="172" class="card-label">1</text>
  <text x="525" y="172" class="card-label">N</text>

  <!-- 2. COMPANIES (1) -> TRUCKS (N) -->
  <line x1="900" y1="180" x2="1040" y2="180" class="rel-line" />
  <text x="915" y="172" class="card-label">1</text>
  <text x="1020" y="172" class="card-label">N</text>

  <!-- 3. TRUCKS (1) -> DRIVERS (N) -->
  <line x1="1300" y1="180" x2="1390" y2="180" class="rel-line" />
  <text x="1310" y="172" class="card-label">1</text>
  <text x="1370" y="172" class="card-label">N</text>

  <!-- 4. COMPANIES (1) -> JOBS (N) -->
  <line x1="770" y1="330" x2="770" y2="440" class="rel-line" />
  <text x="778" y="350" class="card-label">1</text>
  <text x="778" y="425" class="card-label">N</text>

  <!-- 5. TRUCKS (1) -> JOBS (N) (Consolidated / Bundled jobs on same truck) -->
  <path d="M 1150 330 L 1150 400 L 920 500" class="rel-line" />
  <text x="1158" y="350" class="card-label">1</text>
  <text x="935" y="495" class="card-label">0..N (Consolidated)</text>

  <!-- 6. JOBS (1) -> BOXES (N) -->
  <line x1="640" y1="580" x2="510" y2="580" class="rel-line" />
  <text x="620" y="572" class="card-label">1</text>
  <text x="525" y="572" class="card-label">1..N</text>

  <!-- 7. JOBS (1) -> DELIVERIES (N) -->
  <line x1="920" y1="580" x2="1050" y2="580" class="rel-line" />
  <text x="935" y="572" class="card-label">1</text>
  <text x="1030" y="572" class="card-label">1..N</text>

  <!-- 8. JOBS (1) -> AUDIT_LOGS (N) -->
  <path d="M 700 740 L 700 820 L 430 820 L 430 890" class="rel-line" />
  <text x="708" y="760" class="card-label">1</text>
  <text x="438" y="875" class="card-label">N</text>

  <!-- 9. JOBS (1) -> CLAIMS (N) -->
  <line x1="810" y1="740" x2="810" y2="890" class="rel-line" />
  <text x="818" y="760" class="card-label">1</text>
  <text x="818" y="875" class="card-label">0..N</text>

  <!-- 10. JOBS (1) -> JOB_REQUESTS (N) -->
  <path d="M 880 740 L 880 820 L 1180 820 L 1180 890" class="rel-line" />
  <text x="888" y="760" class="card-label">1</text>
  <text x="1188" y="875" class="card-label">0..N</text>

  <!-- Crow's foot indicators (UML Crow's foot markers) -->
  <!-- On BOXES side -->
  <path d="M 525 573 L 510 580 L 525 587" fill="none" stroke="#000000" stroke-width="1.6" />
  <!-- On USERS side -->
  <path d="M 525 173 L 510 180 L 525 187" fill="none" stroke="#000000" stroke-width="1.6" />
  <!-- On TRUCKS side -->
  <path d="M 1025 173 L 1040 180 L 1025 187" fill="none" stroke="#000000" stroke-width="1.6" />
  <!-- On DRIVERS side -->
  <path d="M 1375 173 L 1390 180 L 1375 187" fill="none" stroke="#000000" stroke-width="1.6" />
  <!-- On JOBS side from COMPANY -->
  <path d="M 763 425 L 770 440 L 777 425" fill="none" stroke="#000000" stroke-width="1.6" />
  <!-- On DELIVERIES side -->
  <path d="M 1035 573 L 1050 580 L 1035 587" fill="none" stroke="#000000" stroke-width="1.6" />
  <!-- On AUDIT_LOGS side -->
  <path d="M 423 875 L 430 890 L 437 875" fill="none" stroke="#000000" stroke-width="1.6" />
  <!-- On CLAIMS side -->
  <path d="M 803 875 L 810 890 L 817 875" fill="none" stroke="#000000" stroke-width="1.6" />
  <!-- On JOB_REQUESTS side -->
  <path d="M 1173 875 L 1180 890 L 1187 875" fill="none" stroke="#000000" stroke-width="1.6" />

</svg>'''

# -------------------------------------------------------------
# 3. ACTIVITY DIAGRAM SVG
# -------------------------------------------------------------
def get_activity_svg() -> str:
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 1900" width="1400" height="1900">
  <defs>
    <style>
      .title { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 24px; font-weight: bold; fill: #000000; text-anchor: middle; }
      .subtitle { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 14px; fill: #000000; text-anchor: middle; }
      .swimlane-header { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 16px; font-weight: bold; fill: #FFFFFF; text-anchor: middle; }
      .act-text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 12px; font-weight: 600; fill: #000000; text-anchor: middle; }
      .guard-text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 11px; font-weight: bold; fill: #000000; }
      .action-node { fill: #FFFFFF; stroke: #000000; stroke-width: 1.8; rx: 14; ry: 14; }
      .decision-node { fill: #FFFFFF; stroke: #000000; stroke-width: 1.8; }
      .flow-line { stroke: #000000; stroke-width: 1.6; fill: none; }
      .fork-join { fill: #000000; stroke: #000000; }
    </style>
    <marker id="flow-arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#000000" />
    </marker>
  </defs>

  <!-- Background -->
  <rect x="0" y="0" width="1400" height="1900" fill="#FFFFFF" />

  <!-- Diagram Title -->
  <text x="700" y="45" class="title">CARGOSYNC FREIGHT LIFECYCLE — ACTIVITY DIAGRAM</text>
  <text x="700" y="70" class="subtitle">UML 2.5 Activity Model with Partitions (Swimlanes), Decisions &amp; 3D Engine Synchronization</text>

  <!-- Swimlane Partitions -->
  <!-- Header 1: Shipper -->
  <rect x="60" y="100" width="410" height="40" fill="#000000" stroke="#000000" />
  <text x="265" y="126" class="swimlane-header">SHIPPER (COMPANY)</text>
  <rect x="60" y="140" width="410" height="1720" fill="none" stroke="#000000" stroke-width="1.5" />

  <!-- Header 2: Trucker -->
  <rect x="470" y="100" width="460" height="40" fill="#000000" stroke="#000000" />
  <text x="700" y="126" class="swimlane-header">FLEET TRUCKER &amp; DRIVER</text>
  <rect x="470" y="140" width="460" height="1720" fill="none" stroke="#000000" stroke-width="1.5" />

  <!-- Header 3: System Engine -->
  <rect x="930" y="100" width="410" height="40" fill="#000000" stroke="#000000" />
  <text x="1135" y="126" class="swimlane-header">CARGOSYNC 3D &amp; AUDIT ENGINE</text>
  <rect x="930" y="140" width="410" height="1720" fill="none" stroke="#000000" stroke-width="1.5" />

  <!-- Initial Node in Shipper lane -->
  <circle cx="265" cy="180" r="14" fill="#000000" stroke="#000000" />

  <!-- Flow 1: Start -> Create Job -->
  <line x1="265" y1="194" x2="265" y2="230" class="flow-line" marker-end="url(#flow-arrow)" />

  <!-- Activity: Create Freight Job -->
  <rect x="145" y="230" width="240" height="50" class="action-node" />
  <text x="265" y="252" class="act-text">Create Freight Job</text>
  <text x="265" y="268" class="act-text">(Origin, Destination, Schedule)</text>

  <!-- Flow 2: -> Add Cargo Boxes -->
  <line x1="265" y1="280" x2="265" y2="320" class="flow-line" marker-end="url(#flow-arrow)" />

  <!-- Activity: Add Cargo Boxes -->
  <rect x="145" y="320" width="240" height="50" class="action-node" />
  <text x="265" y="342" class="act-text">Add Cargo Packages</text>
  <text x="265" y="358" class="act-text">(L, W, H, Weight, Fragility, Stops)</text>

  <!-- Flow 3: -> Publish to Marketplace -->
  <line x1="265" y1="370" x2="265" y2="410" class="flow-line" marker-end="url(#flow-arrow)" />

  <!-- Activity: Publish to Marketplace -->
  <rect x="145" y="410" width="240" height="50" class="action-node" />
  <text x="265" y="432" class="act-text">Publish Job to Marketplace</text>
  <text x="265" y="448" class="act-text">(Status = "posted")</text>

  <!-- Flow 4: Across to System for Marketplace index -->
  <path d="M 385 435 L 1135 435 L 1135 470" class="flow-line" marker-end="url(#flow-arrow)" />

  <!-- System Activity: Broadcast & Audit -->
  <rect x="1015" y="470" width="240" height="50" class="action-node" />
  <text x="1135" y="492" class="act-text">Broadcast to Available Fleet</text>
  <text x="1135" y="508" class="act-text">&amp; Log Immutable Audit Event</text>

  <!-- Flow 5: Across to Trucker -->
  <path d="M 1135 520 L 1135 560 L 700 560 L 700 580" class="flow-line" marker-end="url(#flow-arrow)" />

  <!-- Trucker Activity: Browse & Accept -->
  <rect x="580" y="580" width="240" height="50" class="action-node" />
  <text x="700" y="602" class="act-text">Browse &amp; Accept Job</text>
  <text x="700" y="618" class="act-text">(Assign Fleet Truck &amp; Driver)</text>

  <!-- Flow 6: -> Decision: Consolidate More Cargo? -->
  <line x1="700" y1="630" x2="700" y2="670" class="flow-line" marker-end="url(#flow-arrow)" />

  <!-- Decision Diamond: Consolidate? -->
  <polygon points="700,670 760,705 700,740 640,705" class="decision-node" />
  <text x="700" y="709" class="act-text" style="font-size:10px">Consolidate?</text>

  <!-- Branch [Yes]: Bundle candidate jobs -->
  <line x1="760" y1="705" x2="880" y2="705" class="flow-line" marker-end="url(#flow-arrow)" />
  <text x="770" y="695" class="guard-text">[Yes, More Space]</text>

  <!-- Activity: Bundle Job to Truck Trip -->
  <rect x="760" y="750" width="220" height="50" class="action-node" />
  <text x="870" y="772" class="act-text">Combine Another Job</text>
  <text x="870" y="788" class="act-text">to Existing Truck Trip</text>
  <path d="M 880 705 L 880 750" class="flow-line" />

  <!-- Flow back into 3D Bin Packing request -->
  <path d="M 870 800 L 870 835 L 700 835" class="flow-line" marker-end="url(#flow-arrow)" />

  <!-- Branch [No]: Direct Pack -->
  <line x1="700" y1="740" x2="700" y2="860" class="flow-line" marker-end="url(#flow-arrow)" />
  <text x="708" y="765" class="guard-text">[No, Direct Trip]</text>

  <!-- Activity: Trigger 3D Bin Packing -->
  <rect x="580" y="860" width="240" height="50" class="action-node" />
  <text x="700" y="882" class="act-text">Request 3D Bin Packing</text>
  <text x="700" y="898" class="act-text">(Truck Dimensions &amp; Cargo List)</text>

  <!-- Flow to 3D Engine -->
  <path d="M 820 885 L 1015 885" class="flow-line" marker-end="url(#flow-arrow)" />

  <!-- System Activity: Execute FFDH Bin Packing -->
  <rect x="1015" y="860" width="240" height="60" class="action-node" />
  <text x="1135" y="880" class="act-text">Execute 3D FFDH Packing</text>
  <text x="1135" y="896" class="act-text">• Fixed Obstacles for Prior Cargo</text>
  <text x="1135" y="910" class="act-text">• Reverse Stop Order &amp; Gravity</text>

  <!-- Flow back to Trucker to Review 3D Plan -->
  <path d="M 1135 920 L 1135 960 L 700 960 L 700 980" class="flow-line" marker-end="url(#flow-arrow)" />

  <!-- Trucker Activity: Inspect 3D Visualizer -->
  <rect x="580" y="980" width="240" height="50" class="action-node" />
  <text x="700" y="1002" class="act-text">Inspect 3D Container Model</text>
  <text x="700" y="1018" class="act-text">(Verify Stability, Weight &amp; Axle)</text>

  <!-- Flow: Pre-departure Checklist -->
  <line x1="700" y1="1030" x2="700" y2="1070" class="flow-line" marker-end="url(#flow-arrow)" />

  <!-- Trucker Activity: Loading Checklist -->
  <rect x="570" y="1070" width="260" height="50" class="action-node" />
  <text x="700" y="1092" class="act-text">Perform Pre-Departure Checklist</text>
  <text x="700" y="1108" class="act-text">(Verify Cargo Count, Seals &amp; Safety)</text>

  <!-- Flow: -> Start Trip -->
  <line x1="700" y1="1120" x2="700" y2="1160" class="flow-line" marker-end="url(#flow-arrow)" />

  <!-- Trucker Activity: Start Trip -->
  <rect x="580" y="1160" width="240" height="50" class="action-node" />
  <text x="700" y="1182" class="act-text">Start Freight Trip</text>
  <text x="700" y="1198" class="act-text">(Transition to In-Transit)</text>

  <!-- Flow: Synchronization to System and Shipper -->
  <!-- Fork Bar -->
  <line x1="200" y1="1240" x2="1200" y2="1240" class="flow-line" style="stroke-width: 5;" />
  <line x1="700" y1="1210" x2="700" y2="1240" class="flow-line" marker-end="url(#flow-arrow)" />

  <!-- Fork Branch 1: System Audit Log -->
  <line x1="1135" y1="1240" x2="1135" y2="1270" class="flow-line" marker-end="url(#flow-arrow)" />
  <rect x="1015" y="1270" width="240" height="50" class="action-node" />
  <text x="1135" y="1292" class="act-text">Record GPS Departure Stamp</text>
  <text x="1135" y="1308" class="act-text">&amp; Update Consolidated Jobs</text>

  <!-- Fork Branch 2: Shipper Tracking -->
  <line x1="265" y1="1240" x2="265" y2="1270" class="flow-line" marker-end="url(#flow-arrow)" />
  <rect x="145" y="1270" width="240" height="50" class="action-node" />
  <text x="265" y="1292" class="act-text">Track Shipment In-Transit</text>
  <text x="265" y="1308" class="act-text">(Status = "in_transit")</text>

  <!-- Fork Branch 3: Trucker Drives to Destination -->
  <line x1="700" y1="1240" x2="700" y2="1360" class="flow-line" marker-end="url(#flow-arrow)" />

  <!-- Trucker Activity: Arrive & Unload -->
  <rect x="570" y="1360" width="260" height="50" class="action-node" />
  <text x="700" y="1382" class="act-text">Arrive at Destination</text>
  <text x="700" y="1398" class="act-text">&amp; Perform Unloading Checklist</text>

  <!-- Flow: Destination Verification Decision -->
  <line x1="700" y1="1410" x2="700" y2="1450" class="flow-line" marker-end="url(#flow-arrow)" />

  <!-- Decision: Cargo Intact? -->
  <polygon points="700,1450 760,1485 700,1520 640,1485" class="decision-node" />
  <text x="700" y="1489" class="act-text" style="font-size:10px">Intact?</text>

  <!-- Branch [Damaged / Missing]: File Claim -->
  <line x1="640" y1="1485" x2="430" y2="1485" class="flow-line" marker-end="url(#flow-arrow)" />
  <text x="500" y="1475" class="guard-text">[Discrepancy]</text>

  <rect x="145" y="1460" width="240" height="50" class="action-node" />
  <text x="265" y="1482" class="act-text">Flag Damage &amp; File Claim</text>
  <text x="265" y="1498" class="act-text">(Upload Evidence &amp; Notes)</text>

  <!-- Branch [Verified / Intact]: Capture POD & End Trip -->
  <line x1="700" y1="1520" x2="700" y2="1560" class="flow-line" marker-end="url(#flow-arrow)" />
  <text x="708" y="1545" class="guard-text">[Verified 100%]</text>

  <!-- Trucker Activity: End Trip & Signature -->
  <rect x="570" y="1560" width="260" height="50" class="action-node" />
  <text x="700" y="1582" class="act-text">Capture Consignee Signature</text>
  <text x="700" y="1598" class="act-text">&amp; Complete End-Trip Handover</text>

  <!-- Join flow to System Notification -->
  <path d="M 830 1585 L 1015 1585" class="flow-line" marker-end="url(#flow-arrow)" />

  <!-- System Activity: Delivery Notification & Completion -->
  <rect x="1015" y="1560" width="240" height="50" class="action-node" />
  <text x="1135" y="1582" class="act-text">Mark Status = "delivered"</text>
  <text x="1135" y="1598" class="act-text">&amp; Notify Shipper Instantly</text>

  <!-- Flow to Shipper Final Delivery Confirmation -->
  <path d="M 1135 1610 L 1135 1670 L 265 1670 L 265 1700" class="flow-line" marker-end="url(#flow-arrow)" />

  <!-- Shipper Activity: Receive Notification & Rate -->
  <rect x="145" y="1700" width="240" height="50" class="action-node" />
  <text x="265" y="1722" class="act-text">Receive Delivery Notification</text>
  <text x="265" y="1738" class="act-text">&amp; Rate Driver / Trucker</text>

  <!-- Final Node -->
  <line x1="265" y1="1750" x2="265" y2="1800" class="flow-line" marker-end="url(#flow-arrow)" />
  <circle cx="265" cy="1820" r="14" fill="#FFFFFF" stroke="#000000" stroke-width="2" />
  <circle cx="265" cy="1820" r="8" fill="#000000" />

</svg>'''

# -------------------------------------------------------------
# 4. SEQUENCE DIAGRAM SVG
# -------------------------------------------------------------
def get_sequence_svg() -> str:
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 2000" width="1600" height="2000">
  <defs>
    <style>
      .title { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 24px; font-weight: bold; fill: #000000; text-anchor: middle; }
      .subtitle { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 14px; fill: #000000; text-anchor: middle; }
      .participant-box { fill: #FFFFFF; stroke: #000000; stroke-width: 1.8; rx: 4; ry: 4; }
      .participant-text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 13px; font-weight: bold; fill: #000000; text-anchor: middle; }
      .participant-sub { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 10px; fill: #000000; text-anchor: middle; }
      .lifeline { stroke: #000000; stroke-width: 1.2; stroke-dasharray: 6,4; fill: none; }
      .activation { fill: #FFFFFF; stroke: #000000; stroke-width: 1.5; }
      .msg-sync { stroke: #000000; stroke-width: 1.5; fill: none; }
      .msg-reply { stroke: #000000; stroke-width: 1.5; stroke-dasharray: 5,4; fill: none; }
      .msg-label { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 11px; font-weight: 600; fill: #000000; }
      .step-num { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 11px; font-weight: bold; fill: #000000; }
      .phase-box { fill: none; stroke: #000000; stroke-width: 1; stroke-dasharray: 4,4; }
      .phase-text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 12px; font-weight: bold; fill: #000000; font-style: italic; }
    </style>
    <marker id="arrow-solid" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#000000" />
    </marker>
    <marker id="arrow-open" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9" fill="none" stroke="#000000" stroke-width="1.5" />
    </marker>
  </defs>

  <!-- Background -->
  <rect x="0" y="0" width="1600" height="2000" fill="#FFFFFF" />

  <!-- Diagram Title -->
  <text x="800" y="45" class="title">CARGOSYNC ORCHESTRATION — SEQUENCE DIAGRAM</text>
  <text x="800" y="70" class="subtitle">End-to-End Execution Sequence: Job Creation, Consolidation, 3D Bin Packing, Verification &amp; Delivery</text>

  <!-- ==================== PARTICIPANTS ==================== -->
  <!-- X positions:
       1. Shipper: 140
       2. Web Frontend: 410
       3. Backend API: 710
       4. 3D Bin Engine: 990
       5. Database: 1240
       6. Fleet Trucker: 1460
  -->

  <!-- P1: Shipper -->
  <g transform="translate(60, 95)">
    <rect x="0" y="0" width="160" height="46" class="participant-box" />
    <text x="80" y="20" class="participant-text">Shipper</text>
    <text x="80" y="36" class="participant-sub">(Company Actor)</text>
  </g>
  <line x1="140" y1="141" x2="140" y2="1950" class="lifeline" />

  <!-- P2: Frontend -->
  <g transform="translate(330, 95)">
    <rect x="0" y="0" width="160" height="46" class="participant-box" />
    <text x="80" y="20" class="participant-text">Web Frontend</text>
    <text x="80" y="36" class="participant-sub">(Next.js / React 19)</text>
  </g>
  <line x1="410" y1="141" x2="410" y2="1950" class="lifeline" />

  <!-- P3: Backend API -->
  <g transform="translate(630, 95)">
    <rect x="0" y="0" width="160" height="46" class="participant-box" />
    <text x="80" y="20" class="participant-text">Backend API</text>
    <text x="80" y="36" class="participant-sub">(FastAPI / Python)</text>
  </g>
  <line x1="710" y1="141" x2="710" y2="1950" class="lifeline" />

  <!-- P4: 3D Packing Engine -->
  <g transform="translate(910, 95)">
    <rect x="0" y="0" width="160" height="46" class="participant-box" />
    <text x="80" y="20" class="participant-text">3D Packing Engine</text>
    <text x="80" y="36" class="participant-sub">(FFDH Alg. Service)</text>
  </g>
  <line x1="990" y1="141" x2="990" y2="1950" class="lifeline" />

  <!-- P5: Database -->
  <g transform="translate(1160, 95)">
    <rect x="0" y="0" width="160" height="46" class="participant-box" />
    <text x="80" y="20" class="participant-text">Database</text>
    <text x="80" y="36" class="participant-sub">(PostgreSQL / Supabase)</text>
  </g>
  <line x1="1240" y1="141" x2="1240" y2="1950" class="lifeline" />

  <!-- P6: Trucker / Driver -->
  <g transform="translate(1380, 95)">
    <rect x="0" y="0" width="160" height="46" class="participant-box" />
    <text x="80" y="20" class="participant-text">Fleet Trucker</text>
    <text x="80" y="36" class="participant-sub">(Driver / Fleet Owner)</text>
  </g>
  <line x1="1460" y1="141" x2="1460" y2="1950" class="lifeline" />

  <!-- ==================== PHASE 1: JOB CREATION & CARGO ENTRY ==================== -->
  <rect x="50" y="160" width="1500" height="230" class="phase-box" />
  <text x="70" y="180" class="phase-text">Phase 1: Freight Job Creation, Cargo Box Entry &amp; Marketplace Publishing</text>

  <!-- Step 1: Shipper creates job -->
  <line x1="140" y1="205" x2="410" y2="205" class="msg-sync" marker-end="url(#arrow-solid)" />
  <text x="160" y="200" class="msg-label">1. Fill Job Form(name, origin, dest, date, window)</text>

  <rect x="403" y="205" width="14" height="60" class="activation" />

  <!-- Step 2: Frontend to API -->
  <line x1="417" y1="225" x2="703" y2="225" class="msg-sync" marker-end="url(#arrow-solid)" />
  <text x="440" y="220" class="msg-label">2. POST /api/v1/jobs/ {job_data}</text>

  <rect x="703" y="225" width="14" height="45" class="activation" />

  <!-- Step 3: Insert DB -->
  <line x1="717" y1="240" x2="1233" y2="240" class="msg-sync" marker-end="url(#arrow-solid)" />
  <text x="740" y="235" class="msg-label">3. INSERT INTO jobs (status="draft")</text>

  <!-- Step 4: Add Cargo Boxes -->
  <line x1="140" y1="290" x2="410" y2="290" class="msg-sync" marker-end="url(#arrow-solid)" />
  <text x="160" y="285" class="msg-label">4. Add Boxes (L, W, H, Weight, Fragile, Stop)</text>

  <rect x="403" y="290" width="14" height="85" class="activation" />

  <line x1="417" y1="310" x2="703" y2="310" class="msg-sync" marker-end="url(#arrow-solid)" />
  <text x="440" y="305" class="msg-label">5. POST /api/v1/boxes/ {box_payload}</text>

  <rect x="703" y="310" width="14" height="65" class="activation" />

  <line x1="717" y1="330" x2="1233" y2="330" class="msg-sync" marker-end="url(#arrow-solid)" />
  <text x="740" y="325" class="msg-label">6. INSERT INTO boxes &amp; generate QR metadata</text>

  <!-- Step 7: Publish to Marketplace -->
  <line x1="140" y1="365" x2="410" y2="365" class="msg-sync" marker-end="url(#arrow-solid)" />
  <text x="160" y="360" class="msg-label">7. Click "Publish to Marketplace"</text>

  <line x1="417" y1="375" x2="703" y2="375" class="msg-sync" marker-end="url(#arrow-solid)" />
  <text x="440" y="370" class="msg-label">8. POST /api/v1/jobs/{id}/publish</text>

  <!-- ==================== PHASE 2: MARKETPLACE ACCEPTANCE & CONSOLIDATION ==================== -->
  <rect x="50" y="410" width="1500" height="270" class="phase-box" />
  <text x="70" y="430" class="phase-text">Phase 2: Trucker Marketplace Discovery, Job Acceptance &amp; Multi-Job Trip Consolidation</text>

  <!-- Trucker browses marketplace -->
  <line x1="1460" y1="460" x2="417" y2="460" class="msg-sync" marker-end="url(#arrow-solid)" />
  <text x="960" y="455" class="msg-label">9. Browse Open Freight Marketplace</text>

  <rect x="403" y="460" width="14" height="60" class="activation" />

  <line x1="417" y1="480" x2="703" y2="480" class="msg-sync" marker-end="url(#arrow-solid)" />
  <text x="450" y="475" class="msg-label">10. GET /api/v1/jobs/marketplace</text>

  <rect x="703" y="480" width="14" height="40" class="activation" />

  <!-- Trucker accepts job -->
  <line x1="1460" y1="535" x2="417" y2="535" class="msg-sync" marker-end="url(#arrow-solid)" />
  <text x="960" y="530" class="msg-label">11. Click "Accept Job" with assigned Truck (KL-32-M-3771)</text>

  <rect x="403" y="535" width="14" height="60" class="activation" />

  <line x1="417" y1="555" x2="703" y2="555" class="msg-sync" marker-end="url(#arrow-solid)" />
  <text x="450" y="550" class="msg-label">12. POST /api/v1/jobs/{id}/accept {truck_id}</text>

  <rect x="703" y="555" width="14" height="45" class="activation" />

  <line x1="717" y1="575" x2="1233" y2="575" class="msg-sync" marker-end="url(#arrow-solid)" />
  <text x="750" y="570" class="msg-label">13. UPDATE jobs SET status="accepted", truck_id</text>

  <!-- Trucker combines another job -->
  <line x1="1460" y1="620" x2="417" y2="620" class="msg-sync" marker-end="url(#arrow-solid)" />
  <text x="860" y="615" class="msg-label">14. Click "Combine Another Job to this Truck Trip" (Fetch Candidates)</text>

  <rect x="403" y="620" width="14" height="50" class="activation" />

  <line x1="417" y1="640" x2="703" y2="640" class="msg-sync" marker-end="url(#arrow-solid)" />
  <text x="440" y="635" class="msg-label">15. GET /api/v1/jobs/{id}/bundle-candidates</text>

  <rect x="703" y="640" width="14" height="35" class="activation" />

  <line x1="703" y1="660" x2="417" y2="660" class="msg-reply" marker-end="url(#arrow-open)" />
  <text x="460" y="655" class="msg-label">16. Return candidate jobs with box counts</text>

  <!-- ==================== PHASE 3: 3D BIN PACKING COMPUTATION ==================== -->
  <rect x="50" y="700" width="1500" height="350" class="phase-box" />
  <text x="70" y="720" class="phase-text">Phase 3: Multi-Job 3D Bin Packing Engine Computation (Collision-Free Spatial Layout)</text>

  <!-- Trucker confirms bundle -->
  <line x1="1460" y1="745" x2="417" y2="745" class="msg-sync" marker-end="url(#arrow-solid)" />
  <text x="860" y="740" class="msg-label">17. Select Candidate Job &amp; Click "Combine Job &amp; Pack Cargo in 3D"</text>

  <rect x="403" y="745" width="14" height="150" class="activation" />

  <line x1="417" y1="765" x2="703" y2="765" class="msg-sync" marker-end="url(#arrow-solid)" />
  <text x="450" y="760" class="msg-label">18. POST /api/v1/jobs/{id}/bundle-job {bundle_job_id}</text>

  <rect x="703" y="765" width="14" height="125" class="activation" />

  <!-- Backend queries truck & existing placed boxes -->
  <line x1="717" y1="785" x2="1233" y2="785" class="msg-sync" marker-end="url(#arrow-solid)" />
  <text x="750" y="780" class="msg-label">19. Fetch Truck Dimensions &amp; Existing Placed Boxes</text>

  <!-- Call 3D Bin Packing Service -->
  <line x1="717" y1="815" x2="983" y2="815" class="msg-sync" marker-end="url(#arrow-solid)" />
  <text x="740" y="810" class="msg-label">20. pack_boxes_3d(truck_dims, new_boxes, existing_placements)</text>

  <rect x="983" y="815" width="14" height="50" class="activation" />

  <!-- Internal 3D Algorithm execution -->
  <text x="1010" y="835" class="msg-label" style="font-size:10px; font-style:italic">• FFDH Volume Sort &amp; 6 Rotations</text>
  <text x="1010" y="850" class="msg-label" style="font-size:10px; font-style:italic">• Boundary &amp; Non-Overlap with Obstacles</text>

  <!-- Return packing placements -->
  <line x1="983" y1="860" x2="717" y2="860" class="msg-reply" marker-end="url(#arrow-open)" />
  <text x="740" y="855" class="msg-label">21. Placements (x, y, z, rotation) &amp; efficiency metrics</text>

  <!-- Update DB with coordinates -->
  <line x1="717" y1="880" x2="1233" y2="880" class="msg-sync" marker-end="url(#arrow-solid)" />
  <text x="750" y="875" class="msg-label">22. UPDATE boxes (pack_x, pack_y, pack_z) &amp; job (packing_data)</text>

  <!-- Return 3D result to frontend -->
  <line x1="703" y1="895" x2="417" y2="895" class="msg-reply" marker-end="url(#arrow-open)" />
  <text x="450" y="890" class="msg-label">23. Response: Combined Job added &amp; 3D coordinates ready</text>

  <!-- Render Three.js -->
  <line x1="410" y1="920" x2="1460" y2="920" class="msg-sync" marker-end="url(#arrow-solid)" />
  <text x="700" y="915" class="msg-label">24. Render Three.js 3D Visualizer (Active cargo + bundled cargo in container)</text>

  <line x1="1460" y1="950" x2="417" y2="950" class="msg-sync" marker-end="url(#arrow-solid)" />
  <text x="800" y="945" class="msg-label">25. Download PDF Loading Sheet &amp; Cargo Labels</text>

  <line x1="417" y1="975" x2="703" y2="975" class="msg-sync" marker-end="url(#arrow-solid)" />
  <text x="450" y="970" class="msg-label">26. GET /api/v1/packing/loading-sheet/{id}</text>

  <!-- ==================== PHASE 4: PRE-DEPARTURE CHECKLIST & TRIP START ==================== -->
  <rect x="50" y="1070" width="1500" height="290" class="phase-box" />
  <text x="70" y="1090" class="phase-text">Phase 4: Pre-Departure Loading Checklist &amp; Trip Start (In-Transit Transition)</text>

  <!-- Trucker performs loading checklist -->
  <line x1="1460" y1="1120" x2="417" y2="1120" class="msg-sync" marker-end="url(#arrow-solid)" />
  <text x="800" y="1115" class="msg-label">27. Open "Loading Verification Checklist" &amp; verify physical boxes</text>

  <rect x="403" y="1120" width="14" height="60" class="activation" />

  <line x1="417" y1="1140" x2="703" y2="1140" class="msg-sync" marker-end="url(#arrow-solid)" />
  <text x="450" y="1135" class="msg-label">28. POST /api/v1/checklist/approve/{id} {driver_name, checked_box_ids}</text>

  <rect x="703" y="1140" width="14" height="40" class="activation" />

  <line x1="717" y1="1160" x2="1233" y2="1160" class="msg-sync" marker-end="url(#arrow-solid)" />
  <text x="750" y="1155" class="msg-label">29. INSERT INTO audit_logs (action="checklist_approved") &amp; status="loading"</text>

  <!-- Trucker clicks Start Trip -->
  <line x1="1460" y1="1200" x2="417" y2="1200" class="msg-sync" marker-end="url(#arrow-solid)" />
  <text x="800" y="1195" class="msg-label">30. Click "🚀 Start Trip &amp; Depart"</text>

  <rect x="403" y="1200" width="14" height="70" class="activation" />

  <line x1="417" y1="1225" x2="703" y2="1225" class="msg-sync" marker-end="url(#arrow-solid)" />
  <text x="450" y="1220" class="msg-label">31. POST /api/v1/jobs/{id}/start-trip</text>

  <rect x="703" y="1225" width="14" height="50" class="activation" />

  <!-- Update status of all consolidated jobs on this truck -->
  <line x1="717" y1="1245" x2="1233" y2="1245" class="msg-sync" marker-end="url(#arrow-solid)" />
  <text x="750" y="1240" class="msg-label">32. UPDATE jobs SET status="in_transit" for all jobs on this truck</text>

  <!-- Broadcast status to Shipper -->
  <line x1="703" y1="1265" x2="140" y2="1265" class="msg-sync" marker-end="url(#arrow-solid)" />
  <text x="250" y="1260" class="msg-label">33. Notify Shipper: Fleet Truck has departed with cargo</text>

  <!-- ==================== PHASE 5: DESTINATION UNLOADING & PROOF OF DELIVERY ==================== -->
  <rect x="50" y="1380" width="1500" height="340" class="phase-box" />
  <text x="70" y="1400" class="phase-text">Phase 5: Destination Arrival, Consignee Verification Checklist &amp; Proof of Delivery (POD)</text>

  <!-- Trucker arrives and clicks End Trip -->
  <line x1="1460" y1="1430" x2="417" y2="1430" class="msg-sync" marker-end="url(#arrow-solid)" />
  <text x="800" y="1425" class="msg-label">34. Trucker arrives at destination &amp; clicks "🏁 End Trip / Mark Delivered"</text>

  <rect x="403" y="1430" width="14" height="60" class="activation" />

  <!-- Modal opens for Delivery Checklist -->
  <line x1="410" y1="1455" x2="1460" y2="1455" class="msg-reply" marker-end="url(#arrow-open)" />
  <text x="750" y="1450" class="msg-label">35. Display Delivery Unloading Checklist &amp; POD Handover Modal</text>

  <!-- Trucker submits verified delivery -->
  <line x1="1460" y1="1495" x2="417" y2="1495" class="msg-sync" marker-end="url(#arrow-solid)" />
  <text x="750" y="1490" class="msg-label">36. Submit Checklist (verified boxes, recipient_name, notes, signature)</text>

  <rect x="403" y="1495" width="14" height="90" class="activation" />

  <line x1="417" y1="1520" x2="703" y2="1520" class="msg-sync" marker-end="url(#arrow-solid)" />
  <text x="450" y="1515" class="msg-label">37. POST /api/v1/jobs/{id}/end-trip {recipient_name, notes, verified_box_ids}</text>

  <rect x="703" y="1520" width="14" height="70" class="activation" />

  <!-- Backend updates deliveries and audit log -->
  <line x1="717" y1="1540" x2="1233" y2="1540" class="msg-sync" marker-end="url(#arrow-solid)" />
  <text x="750" y="1535" class="msg-label">38. UPDATE jobs SET status="delivered", INSERT INTO deliveries (POD)</text>

  <!-- Backend creates Company delivery notification audit log -->
  <line x1="717" y1="1565" x2="1233" y2="1565" class="msg-sync" marker-end="url(#arrow-solid)" />
  <text x="750" y="1560" class="msg-label">39. INSERT INTO audit_logs (action="company_notification", details="🔔 Delivered")</text>

  <!-- Real-time notification to Shipper -->
  <line x1="703" y1="1590" x2="140" y2="1590" class="msg-sync" marker-end="url(#arrow-solid)" />
  <text x="220" y="1585" class="msg-label">40. 🔔 Dispatched Notification to Shipper: Cargo verified &amp; delivered</text>

  <!-- Shipper Rates Driver -->
  <line x1="140" y1="1640" x2="410" y2="1640" class="msg-sync" marker-end="url(#arrow-solid)" />
  <text x="160" y="1635" class="msg-label">41. View Delivery Proof &amp; Submit Star Rating</text>

  <line x1="417" y1="1660" x2="703" y2="1660" class="msg-sync" marker-end="url(#arrow-solid)" />
  <text x="450" y="1655" class="msg-label">42. POST /api/v1/jobs/{id}/rate-driver {rating, feedback}</text>

  <!-- ==================== PHASE 6: AUDIT TRAIL & CLAIMS GOVERNANCE ==================== -->
  <rect x="50" y="1740" width="1500" height="180" class="phase-box" />
  <text x="70" y="1760" class="phase-text">Phase 6: Immutable Chain of Custody Audit Log &amp; Claims Resolution</text>

  <!-- Shipper or Admin views audit log -->
  <line x1="140" y1="1800" x2="410" y2="1800" class="msg-sync" marker-end="url(#arrow-solid)" />
  <text x="160" y="1795" class="msg-label">43. Request Full Chain of Custody Audit Trail</text>

  <line x1="417" y1="1820" x2="703" y2="1820" class="msg-sync" marker-end="url(#arrow-solid)" />
  <text x="450" y="1815" class="msg-label">44. GET /api/v1/audit/job/{id}</text>

  <rect x="703" y="1820" width="14" height="40" class="activation" />

  <line x1="717" y1="1835" x2="1233" y2="1835" class="msg-sync" marker-end="url(#arrow-solid)" />
  <text x="750" y="1830" class="msg-label">45. SELECT * FROM audit_logs WHERE job_id ORDER BY timestamp</text>

  <line x1="703" y1="1855" x2="140" y2="1855" class="msg-reply" marker-end="url(#arrow-open)" />
  <text x="220" y="1850" class="msg-label">46. Return chronological events (GPS timestamps, driver signatures, checklist verifications)</text>

</svg>'''

# -------------------------------------------------------------
# MAIN EXPORT LOGIC
# -------------------------------------------------------------
def main():
    diagrams = {
        "use_case_diagram.svg": get_use_case_svg(),
        "er_diagram.svg": get_er_svg(),
        "activity_diagram.svg": get_activity_svg(),
        "sequence_diagram.svg": get_sequence_svg(),
    }

    print("Writing SVG files to:", OUTPUT_DIR)
    for filename, content in diagrams.items():
        filepath = os.path.join(OUTPUT_DIR, filename)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        print(f" -> Generated {filename} ({len(content)} bytes)")

    # Render PNGs using Google Chrome headless
    chrome_bin = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    if os.path.exists(chrome_bin):
        print("\nRendering High-Resolution Monochrome PNGs via Google Chrome...")
        png_configs = [
            ("use_case_diagram.svg", "use_case_diagram.png", 1400, 1700),
            ("er_diagram.svg", "er_diagram.png", 1700, 1300),
            ("activity_diagram.svg", "activity_diagram.png", 1400, 1900),
            ("sequence_diagram.svg", "sequence_diagram.png", 1600, 2000),
        ]
        for svg_name, png_name, w, h in png_configs:
            svg_path = os.path.join(OUTPUT_DIR, svg_name)
            png_path = os.path.join(OUTPUT_DIR, png_name)
            cmd = [
                chrome_bin,
                "--headless",
                "--disable-gpu",
                "--force-device-scale-factor=2",
                f"--window-size={w},{h}",
                f"--screenshot={png_path}",
                f"file://{svg_path}",
            ]
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            if os.path.exists(png_path) and os.path.getsize(png_path) > 0:
                print(f" ✓ Rendered {png_name} ({os.path.getsize(png_path)} bytes, 2x Retina Resolution)")
            else:
                print(f" ⚠ Failed to render {png_name}: {res.stderr.decode()[:200]}")

    print("\nAll diagrams successfully generated in:", OUTPUT_DIR)

if __name__ == "__main__":
    main()
