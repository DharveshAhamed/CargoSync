# CargoSync Database Documentation Files

This directory contains the database tables documentation for **CargoSync**, structured in multiple formats for easy integration into your project documentation, thesis, or SRS report.

## Available Files

| File Name | Format | Best Used For | How to Use |
|-----------|--------|---------------|------------|
| [`DATABASE_TABLES.html`](file:///Users/dharveshahamed/Desktop/Cargo%20Sync/database%20tables/DATABASE_TABLES.html) | Styled HTML (Monochrome Black & White) | **Microsoft Word / Google Docs** | Open in your browser (Google Chrome / Safari), click **"Copy All Tables for MS Word"** or select individual tables and press `Ctrl+C` / `Cmd+C`, then paste directly (`Ctrl+V` / `Cmd+V`) into your `.docx` document. Headers, columns, and borders will be natively formatted! |
| [`DATABASE_TABLES.md`](file:///Users/dharveshahamed/Desktop/Cargo%20Sync/database%20tables/DATABASE_TABLES.md) | GitHub-Flavored Markdown | **Markdown Docs / GitHub / Notion / Obsidian / LaTeX** | Copy the text directly into Markdown editors, Notion pages, or convert to LaTeX using Pandoc. |
| [`database_tables.csv`](file:///Users/dharveshahamed/Desktop/Cargo%20Sync/database%20tables/database_tables.csv) | Tabular CSV | **Microsoft Excel / Google Sheets** | Open directly in Excel or Google Sheets to inspect the unified data dictionary or import as tables. |
| [`schema.sql`](file:///Users/dharveshahamed/Desktop/Cargo%20Sync/database%20tables/schema.sql) | SQL DDL Script | **Technical Appendix / Database Setup** | Ready-to-execute `CREATE TABLE` and constraint statements for PostgreSQL and SQLite. |

---

## Documented Tables (12 Total)

1. **`companies`** — Corporate organizations (Shippers and Fleet Carriers)
2. **`users`** — User credentials, roles, and profiles
3. **`admins`** — Platform administrators and governance
4. **`drivers`** — Fleet commercial drivers and licenses
5. **`trucks`** — Fleet vehicles with physical dimensions and payload limits for 3D packing
6. **`jobs`** — Freight shipment contracts and statuses
7. **`boxes`** — Individual cargo boxes with dimensions, weights, and 3D coordinate placement
8. **`deliveries`** — Waypoint drop-offs and Proof of Delivery (e-signature, photos, GPS)
9. **`job_requests`** — Carrier marketplace bids and trucker assignments
10. **`claims`** — Cargo dispute and damage reports
11. **`audit_logs`** — Chain-of-custody telemetry, tamper detection, and scan history
12. **`team_invites`** — Staff and driver invitation tokens
