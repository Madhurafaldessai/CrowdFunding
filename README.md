# LaunchPad — Production All-or-Nothing Crowdfunding Platform

[![Node.js 22](https://img.shields.io/badge/Node.js-22.x-green.svg)](https://nodejs.org/)
[![MySQL 8.4](https://img.shields.io/badge/MySQL-8.4.x_InnoDB-blue.svg)](https://www.mysql.com/)
[![React 18](https://img.shields.io/badge/React-18.x-cyan.svg)](https://react.dev/)
[![TailwindCSS 3](https://img.shields.io/badge/TailwindCSS-3.x-38bdf8.svg)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-19%20Passing-brightgreen.svg)]()

LaunchPad is a full-stack, enterprise-grade, all-or-nothing crowdfunding platform inspired by Kickstarter. It is architected from the ground up for strict financial transaction integrity, atomic inventory reservation, and resilience when utilizing external APFS SSD storage.

---

## Table of Contents

1. [Key Features](#key-features)
2. [Architecture & Concurrency Design](#architecture--concurrency-design)
3. [Project Directory Structure](#project-directory-structure)
4. [Prerequisites & Environment Setup](#prerequisites--environment-setup)
5. [External Drive & APFS Configuration](#external-drive--apfs-configuration)
6. [Database Setup & Order of Execution](#database-setup--order-of-execution)
7. [Demo Accounts & Credentials](#demo-accounts--credentials)
8. [Running the Application](#running-the-application)
9. [Automated Testing Suite](#automated-testing-suite)
10. [API Endpoint Documentation](#api-endpoint-documentation)
11. [Backup & Restore Procedures](#backup--restore-procedures)
12. [Troubleshooting Guide](#troubleshooting-guide)

---

## 1. Key Features

- **All-or-Nothing Funding Logic:** A campaign only collects pledges if its funding goal is met before its deadline. If expired and underfunded, pledges are automatically refunded.
- **Pessimistic Concurrency & Inventory Protection:** Reward tier limits are enforced via row-level locks (`SELECT ... FOR UPDATE`) in the `make_pledge` stored procedure, guaranteeing that limited rewards are never oversold under concurrent traffic.
- **Automated Idempotent Refunds:** Expired campaigns are processed either automatically every 5 minutes by the MySQL Event Scheduler (`evt_process_expired_campaigns`) or manually via `npm run expire`. Refunds use `INSERT IGNORE` to guarantee that pledges are never refunded twice.
- **Role-Based Access Control:** Dual-role architecture (`user` and `admin`). Any authenticated user can act as both creator (publishing drafts, setting reward tiers, posting updates) and backer (browsing, pledging, cancelling eligible pledges, commenting).
- **Simulated Payment Gateway:** Deterministic mock payment gateway supporting forced approval or decline modes for automated testing and QA verification.
- **External Storage Resilience:** Built-in connection retry with exponential backoff and storage detection; reports degraded 503 states without crashing if the external SSD is detached.
- **Responsive Modern UI:** Complete React 18 + Tailwind CSS frontend with multi-step campaign wizards, real-time funding progress bars, countdown timers, and interactive Recharts analytical dashboards.

---

## 2. Architecture & Concurrency Design

### System Architecture
```
[ Frontend: React 18 / Vite / Tailwind ]
                   │
         REST API (Axios + JWT)
                   │
[ Backend: Node.js / Express / Layered Architecture ]
  Routes ──► Controllers ──► Services ──► DB Pool (mysql2)
                                              │
       Pessimistic Row Locks & Triggers       │
                                              ▼
[ Database: MySQL 8.4 InnoDB on External APFS Storage ]
  • Stored Procedures: make_pledge, cancel_pledge, process_expired_campaigns
  • Triggers: BEFORE INSERT (self-pledge & expiry guards), AFTER INSERT/UPDATE
  • Views: v_campaign_progress, v_creator_dashboard, v_backer_history, v_top_campaigns
  • Event Scheduler: evt_process_expired_campaigns (every 5 min)
```

### Pessimistic Concurrency in `make_pledge`
When a backer attempts to claim a limited reward tier:
1. `START TRANSACTION;`
2. `SELECT ... FROM campaigns WHERE id = p_campaign_id FOR UPDATE;` (locks campaign row)
3. `SELECT ... FROM reward_tiers WHERE id = p_tier_id FOR UPDATE;` (locks tier row)
4. Checks: `campaign.status = 'active'`, `UTC_TIMESTAMP() <= deadline`, `backer_id != creator_id`, `amount >= min_amount`, and `claimed_quantity < quantity`.
5. If payment fails: `ROLLBACK;` (no inventory consumed, no pledge saved).
6. If payment succeeds: `INSERT INTO pledges`, `INSERT INTO payments`, and `COMMIT;`. Triggers update `current_amount` and `claimed_quantity` atomically.

---

## 3. Project Directory Structure

```
CrowdFunding/
├── .env                          # Local environment secrets (git-ignored)
├── .env.example                  # Template configuration
├── package.json                  # Root runner scripts (concurrently)
├── backups/                      # SQL backup archives on internal disk
├── database/
│   ├── schema.sql                # 3NF InnoDB tables, check constraints, indexes
│   ├── triggers.sql              # BEFORE/AFTER insert/update triggers & audit log
│   ├── procedures.sql            # make_pledge, cancel_pledge, approve, reject, expire
│   ├── views.sql                 # Progress, creator dashboard, backer history, top rank
│   ├── events.sql                # 5-minute scheduled event runner
│   ├── users_and_grants.sql      # Restricted crowd_app & crowd_admin privilege grants
│   └── sample_data.sql           # Internally consistent demo data & seed fixtures
├── scripts/
│   ├── start-mysql.sh            # Safe macOS launchd / external SSD checker
│   ├── stop-mysql.sh             # Graceful buffer pool flush & safe shutdown
│   ├── init-db.js                # Database initialization runner
│   ├── check-db.js               # Comprehensive connection & health diagnostics
│   ├── backup-db.sh              # mysqldump export utility with --no-tablespaces
│   ├── start-mysql.bat           # Windows service launcher
│   ├── stop-mysql.bat            # Windows service stopper
│   └── backup-db.bat             # Windows backup utility
├── backend/
│   ├── server.js                 # Express server & graceful shutdown handler
│   ├── src/
│   │   ├── config/               # env.js configuration loader
│   │   ├── db/                   # pool.js (retry backoff), health.js
│   │   ├── middleware/           # auth.js, validation.js, errorHandler.js, rateLimiter.js
│   │   ├── routes/               # Modular Express API route definitions
│   │   ├── controllers/          # Request validation and controller layer
│   │   ├── services/             # Business logic and SQL execution layer
│   │   └── utils/                # logger.js, response.js, expireJob.js
│   └── tests/                    # 19 automated Jest integration tests
└── frontend/
    ├── index.html                # Vite HTML entry
    ├── vite.config.js            # Vite configuration with proxy to port 5001
    ├── tailwind.config.js        # Brand color palette and typography
    └── src/
        ├── api/                  # Axios client with JWT interceptor
        ├── context/              # AuthContext (user, token, session)
        ├── components/           # Reusable Navbar, Footer, CampaignCard, Modal, etc.
        └── pages/                # Home, Browse, Details, Login, Register, Dashboards
```

---

## 4. Prerequisites & Environment Setup

- **Operating System:** macOS (Apple Silicon ARM64 recommended) or Linux / Windows
- **Node.js:** v20.x or v22.x
- **MySQL:** 8.4.x Community Server with InnoDB
- **Storage:** Samsung T7 or external SSD mounted at `/Volumes/External drive` (formatted with **APFS**)

### Initial Setup
```bash
# 1. Install root, backend, and frontend dependencies
npm run install:all

# 2. Configure environment file (automatically done or copy example)
cp .env.example .env
cp .env.example backend/.env
```

---

## 5. External Drive & APFS Configuration

### Why APFS Matters for MySQL / InnoDB
On macOS, external SSD storage should always be formatted as **APFS** rather than exFAT or FAT32:
- **Torn Page Prevention:** InnoDB writes data in 16KB pages. exFAT lacks atomic sector guarantees; an unexpected drive disconnection or power loss causes partial writes (torn pages) that permanently corrupt tablespaces.
- **Crash Recovery & Journaling:** APFS provides metadata copy-on-write and journaling, allowing InnoDB to safely replay `ib_logfile` redo logs during crash recovery.
- **Sparse File Support:** APFS supports sparse files and punch-hole operations (`fallocate`), essential for reclaiming freed tablespace in `ibdata1`.

### Safe Drive Disconnection Policy
> [!CAUTION]
> Never disconnect or eject the external SSD while MySQL is running. Always run:
> ```bash
> npm run db:stop
> ```
> Wait for the clean shutdown confirmation before ejecting the drive in macOS Finder.

---

## 6. Database Setup & Order of Execution

The database initialization script (`npm run db:init`) enforces this strict execution order:
1. **Database & Variables:** Creates `crowdfunding_platform` with `utf8mb4_unicode_ci` and sets `event_scheduler = ON`, `log_bin_trust_function_creators = 1`.
2. **Users & Grants:** Dynamically creates `crowd_app` (restricted DML & EXECUTE) and `crowd_admin` (DDL + DML scoped strictly to `crowdfunding_platform`).
3. **Schema (`schema.sql`):** 10 InnoDB tables with CHECK constraints, foreign keys, and indexes.
4. **Sample Data (`sample_data.sql`):** Seeds 6 categories, 12 users, 16 campaigns with varied states, reward tiers, updates, and comments.
5. **Triggers (`triggers.sql`):** Activates production constraints (rejects inactive campaigns, creator self-pledging, and logs status audits).
6. **Stored Procedures (`procedures.sql`):** Compiles `make_pledge`, `cancel_pledge`, `approve_campaign`, `reject_campaign`, `process_expired_campaigns`.
7. **Views & Events (`views.sql`, `events.sql`):** Registers analytical views and the 5-minute scheduled event.

```bash
# Run complete database initialization
npm run db:init

# Verify database health and objects
npm run db:check
```

---

## 7. Demo Accounts & Credentials

The seed data includes pre-configured demo accounts. Passwords are encrypted with bcrypt (cost factor 10):

| Role | Email | Password | Permissions / Capabilities |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@crowdfund.io` | `Admin123!` | Review pending campaigns, approve/reject with reason, view platform reports, moderate users |
| **Demo Creator** | `creator@crowdfund.io` | `User123!` | Create campaigns, edit drafts, configure reward tiers, submit for review, view backer list |
| **Demo Backer** | `backer@crowdfund.io` | `User123!` | Browse, pledge to active campaigns, test mock payment gateway, cancel eligible pledges |

These credentials are for the seeded demo database. Enter them manually on the login page; the login page does not include demo autofill buttons.

---

## 8. Running the Application

### Development Mode (Both Frontend & Backend)
```bash
npm run dev
```
- **Backend API:** `http://localhost:5001`
- **Frontend App:** `http://localhost:5173`
- **Health Check:** `http://localhost:5001/api/health`

### Starting Components Separately
```bash
# Backend only
npm --prefix backend run dev

# Frontend only
npm --prefix frontend run dev
```

### Manual Expiry Job Execution
To manually trigger the evaluation of expired campaigns:
```bash
npm run expire
```

---

## 9. Automated Testing Suite

The project includes 19 comprehensive automated integration tests across 5 Jest test suites, testing live database behavior:

```bash
npm test
```

### Tested Behaviors:
- ✅ **1. Registration and Login:** Issues valid JWT; hides password hashes.
- ✅ **2. Unauthorized API Access:** Rejects missing tokens (401) and non-admin access (403).
- ✅ **3. Creator-Only Actions:** Prevents non-owners from editing drafts or adding tiers.
- ✅ **4. Admin-Only Actions:** Only admins can approve or reject pending campaigns.
- ✅ **5. Campaign Submission & Approval Lifecycle:** `draft` ➔ `pending_approval` ➔ `active`.
- ✅ **6. Expired Campaign Pledging:** Rejects pledges when campaign deadline has passed.
- ✅ **7. Self-Pledging Rejection:** Procedure and trigger reject creator pledges to their own campaigns.
- ✅ **8. Insufficient Reward Tier Amount:** Rejects pledge amounts lower than tier `min_amount`.
- ✅ **9. Reward Stock Exhaustion:** Rejects pledges once limited tier quantity is claimed.
- ✅ **10. Concurrent Pledges Competing for Final Slot:** Exactly **one** competing pledge succeeds (201); the second is rejected (400) without overselling stock.
- ✅ **11. Payment Failure Rollback:** Simulated decline rolls back entire transaction; no pledge saved, stock untouched.
- ✅ **12 & 13. Pledge Cancellation & Stock Restoration:** Cancelling restores tier inventory and decrements campaign raised total.
- ✅ **14. Successful Deadline Resolution:** Campaigns reaching goal by deadline marked `successful`.
- ✅ **15. Failed Campaign Refund Flow:** Underfunded expired campaigns marked `failed` and all pledges marked `refunded`.
- ✅ **16. Duplicate Refund Prevention:** Re-running expiry job is idempotent and never creates duplicate refunds.
- ✅ **17. Resilience & Health Reporting:** Health endpoint reports latency, MySQL version, and storage mount status.
- ✅ **18. Database Constraints & Audit Triggers:** Negative goals and invalid deadlines rejected; status updates logged in `audit_log`.

---

## 10. API Endpoint Documentation

### Authentication
- `POST /api/auth/register` — Register a new account (`name`, `email`, `password`)
- `POST /api/auth/login` — Sign in and receive JWT token
- `GET /api/auth/me` — Retrieve current authenticated user profile

### Campaigns
- `GET /api/campaigns` — Browse campaigns (supports `search`, `category`, `status`, `sort`, `page`, `limit`)
- `GET /api/campaigns/:id` — Get full campaign details, reward tiers, and backer stats
- `POST /api/campaigns` — Create a new campaign draft (Creator only)
- `PUT /api/campaigns/:id` — Update campaign details (Draft/Pending only)
- `POST /api/campaigns/:id/submit` — Submit draft for admin review
- `POST /api/campaigns/:id/cancel` — Cancel draft or active campaign

### Reward Tiers
- `POST /api/campaigns/:id/tiers` — Add a reward tier
- `PUT /api/campaigns/:id/tiers/:tierId` — Update reward tier
- `DELETE /api/campaigns/:id/tiers/:tierId` — Remove reward tier (if no pledges exist)

### Pledges
- `POST /api/campaigns/:id/pledges` — Create pledge via `make_pledge` stored procedure (`amount`, `tierId`, `forcedPaymentOutcome`)
- `GET /api/pledges/mine` — Backer pledge history from `v_backer_history`
- `POST /api/pledges/:id/cancel` — Cancel eligible pledge via `cancel_pledge` stored procedure

### Community & Updates
- `GET /api/campaigns/:id/updates` — View creator updates
- `POST /api/campaigns/:id/updates` — Publish an update (Creator only)
- `GET /api/campaigns/:id/comments` — Read comments
- `POST /api/campaigns/:id/comments` — Post a comment (Authenticated users)

### Creator Studio
- `GET /api/creator/campaigns` — List all campaigns created by user (`v_creator_dashboard`)
- `GET /api/creator/campaigns/:id/pledges` — List individual backers for a campaign

### Admin Portal
- `GET /api/admin/campaigns/pending` — View campaigns awaiting review
- `POST /api/admin/campaigns/:id/approve` — Approve and activate campaign
- `POST /api/admin/campaigns/:id/reject` — Reject with required reason
- `GET /api/admin/reports/top-campaigns` — Top campaigns ranked via SQL `RANK()`
- `GET /api/admin/reports/category-success` — Success rate by category
- `GET /api/admin/reports/monthly-trend` — Monthly funding moving average via CTE
- `GET /api/admin/reports/repeat-backers` — Backers who supported > 1 campaign
- `GET /api/admin/users` — List platform users with activity stats
- `PATCH /api/admin/users/:id/status` — Suspend or reactivate user accounts

### Health & Diagnostics
- `GET /api/health` — Real-time connection latency, MySQL version, and storage mount state

---

## 11. Backup & Restore Procedures

### Creating a Backup
Backups are saved locally under `./backups` on the internal drive with UTC timestamps:
```bash
npm run db:backup
```
*Generates: `./backups/crowdfunding_platform_backup_YYYYMMDD_HHMMSSZ.sql`*

### Restoring from Backup
```bash
# Connect as crowd_admin or root and restore:
/usr/local/mysql/bin/mysql -u crowd_admin -p -h 127.0.0.1 crowdfunding_platform < backups/crowdfunding_platform_backup_YYYYMMDD_HHMMSSZ.sql
```

---

## 12. Troubleshooting Guide

### 1. Port 5000 Already in Use
- **Cause:** On macOS Monterey / Ventura / Sonoma / Sequoia, the ControlCenter AirPlay Receiver service listens on TCP port 5000 by default.
- **Solution:** The platform defaults to port **5001** for the Express backend. If needed, customize `PORT` in `.env` and `vite.config.js`.

### 2. External Drive Not Mounted
- **Symptom:** `check-db.js` reports missing mount or API returns `503 Service Unavailable`.
- **Solution:** Ensure Samsung T7 SSD is plugged in and unlocked. Verify mount path:
  ```bash
  ls "/Volumes/External drive"
  ```
  If the drive name differs, update `MYSQL_DATA_DIR` in `.env`.

### 3. MySQL Permission Denied on Datadir
- **Cause:** macOS MySQL datadirs are owned by `_mysql` with `700` permissions.
- **Solution:** Do not change datadir ownership. Run `npm run db:start`, which inspects the launchd service and uses the running daemon without requiring direct user filesystem access.

### 4. Event Scheduler Inactive
- **Verification:** `SELECT @@event_scheduler;`
- **Solution:** Re-enable via `npm run db:init` or execute in MySQL:
  ```sql
  SET GLOBAL event_scheduler = ON;
  ```

### 5. Protected Databases Untouched
- The initialization and test suites strictly target `crowdfunding_platform`. Protected databases (`smartdb_system`, `smartdb_ds_11`, `smartdb_ds_12`, `smartdb_ds_13`) are safeguarded and never modified.
