# Job Tracker — Personal ATS Roadmap

A single-user Applicant Tracking System for a local (PH) job search: entry-level IT, Service Desk, and Data roles. No web scraping — optimized for **fast manual data entry** (quick-add a company inline while logging an application).

**Stack:** React (Vite) · Node.js/Express REST API · MySQL 8 (raw SQL via `mysql2/promise`, no ORM) · localhost-only, no auth (API binds to 127.0.0.1).

## Layout

```
Job_Tracker/
├── db/          schema.sql (source of truth), seed.sql (demo data)
├── server/      Express API — routes → controllers → services → models → config/db.js
├── client/      Vite React app
└── scripts/     dev utilities (MySQL password reset — gitignored; backups still TODO)
```

## Data model (8 tables)

```
companies 1─N company_branches
companies 1─N contact_persons        (recruiters/HR, optional branch)
companies 1─N applications           (FK RESTRICT — never lose history)
applications 1─N application_status_history  (append-only audit trail)
applications 1─N submissions         (exact email/portal/walk-in destination)
applications 1─N assessments         (technical, BUPLAS, language… with scores)
applications 1─N communications      (calls/emails/SMS + folded-in follow-ups)
```

Design decisions:
- **Status pipeline:** ENUM on `applications` (`submitted → assessment → interview → offer`, plus `hired/rejected/withdrawn/ghosted`) for fast kanban reads; every change also writes an `application_status_history` row **transactionally** (`server/src/services/applications.service.js`).
- **Follow-ups live on `communications`** (`follow_up_due_at` / `follow_up_completed_at`) — a follow-up always exists because of a conversation; no orphaned reminders, one entry form.
- **`submissions.destination` is free text** — stores `careers@company.ph`, a portal URL, or "walked in at Eastwood branch".
- ENUMs for closed vocabularies; adding a value = `ALTER TABLE ... MODIFY COLUMN` (fine at single-user scale).

## API surface (base `http://127.0.0.1:4000/api`)

| Area | Endpoints |
|---|---|
| Health | `GET /health` |
| Companies | `GET/POST /companies` (POST needs only `name` — quick-add), `GET/PUT/DELETE /companies/:id`, detail includes branches+contacts+applications |
| Branches | `GET/POST /companies/:id/branches`, `PUT/DELETE /branches/:id` |
| Contacts | `GET/POST /companies/:id/contacts`, `PUT/DELETE /contacts/:id` |
| Applications | `GET /applications?status=&company_id=&q=&sort=`, `POST /applications`, `GET/PUT/DELETE /applications/:id`, **`PATCH /applications/:id/status`** (transactional), `GET /applications/:id/history` |
| Submissions | `GET/POST /applications/:id/submissions`, `PUT/DELETE /submissions/:id` |
| Assessments | `GET/POST /applications/:id/assessments`, `PUT/DELETE /assessments/:id`, `PATCH /assessments/:id/status` |
| Communications | `GET/POST /applications/:id/communications`, `PUT/DELETE /communications/:id`, `PATCH /communications/:id/follow-up` (complete/snooze) |
| Follow-ups | `GET /follow-ups/due` |
| Dashboard | `GET /dashboard/stats`, `GET /dashboard/pipeline` |

Errors are JSON: `{ error: { message, code } }` — 400 validation, 404 missing, 409 FK/duplicate conflicts.

## Build phases

| # | Phase | Verify | Status |
|---|-------|--------|--------|
| 0 | Scaffold server + client + db dirs, `.env` | `GET /health` → `{db:'ok'}` | done |
| 1 | `db/schema.sql` + `db/seed.sql` applied | `SHOW TABLES` = 8; company with applications can't be deleted | done |
| 2 | Backend core (config, middleware, error handling) | Malformed POST → clean 400 JSON; unknown route → 404 | done |
| 3 | Companies/branches/contacts API | curl CRUD; `POST /companies {"name"}` only | done |
| 4 | Applications + transactional status + submissions | 2 status changes → 3 history rows | done |
| 5 | Assessments + communications + follow-ups | Past-due follow-up appears in `/follow-ups/due`; complete → gone | done |
| 6 | Dashboard API | Stats match direct SQL | done |
| 7 | Frontend shell (router, react-query, axios, Tailwind) | Navigation + API calls in network tab | done |
| 8 | Companies UI (list/detail, branch+contact forms) | Create company/branch/contact from UI | partial — company list/create/detail + branch & contact **display** done; branch/contact add/edit UI missing (API is ready) |
| 9 | Applications UI + **CompanyCombobox** quick-add | Blank DB → company + application + submission in <30s | partial — list, filters, new-application form with submission, detail CRUD done; company is a plain `<select>`, no inline quick-add |
| 10 | Pipeline kanban (drag = `PATCH /status`, optimistic) | Drag → refresh → persisted; history shows move | pending — columns render, no drag handlers |
| 11 | Comms/follow-ups UI + nav badge | Snooze pushes date; badge matches | done — badge + complete/snooze on `/follow-ups`, add-assessment and log-communication forms on the application detail page |
| 12 | Dashboard UI + polish + mysqldump backup script | Dump restores into fresh schema | partial — dashboard stats + follow-ups view done; **no backup script exists** |

## Running locally

```bash
# 1. Database (once)
mysql -u root -p < db/schema.sql
mysql -u root -p < db/seed.sql        # optional demo data

# 2. API
cd server && npm install && cp .env.example .env   # fill in DB password
npm run dev                                        # http://127.0.0.1:4000/api

# 3. Frontend
cd client && npm install && npm run dev            # http://localhost:5173
```

## Frontend plan (phases 7–12)

Pages: Dashboard (stats, follow-ups due, upcoming assessments) · Pipeline (kanban) · Applications (table + fast-entry form) · Application Detail (Overview / Submissions / Assessments / Communications tabs) · Companies list + detail.

Keystone component: `CompanyCombobox` — type-ahead with inline "Add '<typed>' as new company" so the application form never navigates away. Libraries: react-router-dom, @tanstack/react-query, axios, @hello-pangea/dnd, Tailwind CSS, react-hook-form + zod.
