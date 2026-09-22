# Job Tracker — a personal ATS

A single-user Applicant Tracking System for one specific job hunt (entry-level IT, Service Desk and
Data roles in the Philippines). It is not a multi-tenant product and does not try to be one: no
accounts, no sharing, no scraping — just a fast place to log what you sent, to whom, when, and what
you owe yourself a reminder about.

**Stack:** React 19 (Vite 8, TanStack Query 5, Tailwind 4) · Express 4 REST API (zod for validation)
· MySQL 8 through raw `mysql2/promise` — deliberately **no ORM**. Runs entirely on localhost.

## Why everything is manual entry

Local PH postings are usually a Facebook screenshot or a careers portal with no API, so there is
nothing reliable to scrape. The design constraint that follows is that **every field must be
enterable in seconds**: date-granularity inputs, one form for "I contacted them" plus its follow-up,
add-what's-missing without leaving the page. Features that slow down entry lose. (Where the UI still
makes you detour — e.g. picking a company from a dropdown in the new-application form instead of
creating it there — `ROADMAP.md` marks it as open.)

## Layout

```
Job_Tracker/
├── db/          schema.sql (source of truth), seed.sql (demo data — see warning below)
├── server/      Express API — routes → controllers → services → models → config/db.js
├── client/      Vite + React app; talks to the API same-origin through the /api proxy
└── scripts/     local utilities — nothing tracked here (see .gitignore)
```

There is no root `package.json` — install and run `server/` and `client/` separately.

## Getting it running

Prerequisites: Node.js `^20.19 || >=22.12` (Vite 8's floor; developed on 24.x) and MySQL 8 running
locally.

```bash
# 1. Create the database and its 8 tables (schema.sql issues CREATE DATABASE + USE itself)
mysql -u root -p < db/schema.sql

# 2. (Optional) demo rows — read the warning below first
mysql -u root -p job_tracker < db/seed.sql

# 3. Configure the API
cd server && cp .env.example .env     # then put your MySQL password in it
npm install
npm run dev                           # API on http://127.0.0.1:4000/api

# 4. In a second terminal
cd client && npm install && npm run dev
```

Open **http://localhost:5173**. Sanity-check the API with `curl http://localhost:4000/api/health`
— it should return `{"db":"ok",...}`.

`server/.env` is gitignored, along with every other `.env*` variant; `server/.env.example` is the
tracked template.

### `db/seed.sql` is one-shot

It has no transaction and hardcodes child row ids. If the parent rows already exist, the first INSERT
fails and aborts the file mid-way; if you are unlucky, later statements attach demo submissions to your
*real* application ids. Do not re-run it against a database you are using.

## npm scripts

| Where | Script | Does |
|---|---|---|
| `server/` | `npm run dev` | `nodemon src/server.js` |
| `server/` | `npm start` | `node src/server.js` |
| `client/` | `npm run dev` | Vite dev server, proxying `/api` → `127.0.0.1:4000` |
| `client/` | `npm run build` | Production bundle to `client/dist/` |
| `client/` | `npm run lint` | `oxlint` |
| `client/` | `npm run preview` | Serve the built bundle |

## Data model

Eight tables. `application_status_history` is append-only; everything below `applications` cascades
from it, while a company with applications cannot be deleted at all:

```
companies 1─N company_branches            one is_primary per company (by convention)
companies 1─N contact_persons             recruiters/HR, optionally tied to a branch
companies 1─N applications                FK RESTRICT — never lose history on a company delete
applications 1─N application_status_history   every status change, written transactionally
applications 1─N submissions              where it actually went: careers@….ph, a portal URL, "walked in"
applications 1─N assessments              technical / BUPLAS / language / interview task, with scores
applications 1─N communications           calls, emails, SMS — with the follow-up folded in
```

Decisions worth knowing before you change anything:

- **Follow-ups live on `communications`,** not in their own table: `follow_up_due_at` /
  `follow_up_completed_at`. A reminder always exists *because of* a conversation, so there is no
  orphaned-reminder state and one entry form instead of two.
- **Status is an ENUM on `applications`** for cheap kanban reads. `PATCH /applications/:id/status`
  writes the new status and its history row in one transaction; status is not a writable field on
  `PUT /applications/:id`, so the audit trail cannot be bypassed.
- **`submissions.destination` is free text** on purpose — a mail address, a URL, and a branch name all
  need to fit.
- Closed vocabularies are ENUMs. Adding a value means `ALTER TABLE … MODIFY COLUMN`, plus the same
  list in `server/src/validators/index.js` and `client/src/lib/statuses.js` (three copies today — a
  known duplication, not an oversight).
- **Dates:** the connection sets `dateStrings: true` and the MySQL session runs on the machine's
  timezone, so timestamps round-trip as `YYYY-MM-DD HH:mm:ss` strings. Anything the client pre-fills
  uses *local* time (`todayLocalDate()` / `nowLocalDateTime()` in `client/src/lib/statuses.js`) —
  `toISOString()` would write yesterday before 08:00 local.

## API surface

Base URL `http://127.0.0.1:4000/api`.

| Area | Endpoints |
|---|---|
| Health | `GET /health` |
| Companies | `GET /companies?q=`, `POST /companies` (needs only `name`), `GET/PUT/DELETE /companies/:id` — detail includes branches, contacts and applications |
| Branches | `GET/POST /companies/:id/branches`, `PUT/DELETE /branches/:id` |
| Contacts | `GET/POST /companies/:id/contacts`, `PUT/DELETE /contacts/:id` |
| Applications | `GET /applications` with `status`, `company_id`, `q`, `sort` (recent / priority / status_changed), `POST /applications`, `GET/PUT/DELETE /applications/:id`, `PATCH /applications/:id/status`, `GET /applications/:id/history` |
| Submissions | `GET/POST /applications/:id/submissions`, `PUT/DELETE /submissions/:id` |
| Assessments | `GET/POST /applications/:id/assessments`, `PUT/DELETE /assessments/:id`, `PATCH /assessments/:id/status` |
| Communications | `GET/POST /applications/:id/communications`, `PUT/DELETE /communications/:id`, `PATCH /communications/:id/follow-up` with `{action:"complete"}` or `{action:"snooze", due_at}` (snooze requires the new date) |
| Follow-ups | `GET /follow-ups/due`, `GET /dashboard/follow-ups-due` (alias) |
| Dashboard | `GET /dashboard/stats`, `GET /dashboard/pipeline` |

Lists are capped server-side rather than paginated — the cap is 200 for most child collections, 500 for
application/dashboard reads and 50 for the company search. At personal-ATS volume that is a deliberate
trade, not a missing feature. Errors come back as `{"error":{"message","code"}}`, and validation
failures list every offending field in one 400.

## Screens

| Route | Page |
|---|---|
| `/` | Dashboard: total / applied-in-last-7-days / follow-ups-due / stale-over-14-days cards, upcoming assessments, and the due list |
| `/pipeline` | One column per status, each card carrying a status dropdown (that is how you move things today — no drag yet) |
| `/applications` | Filter/sort list + the new-application form: application details and its first submission (channel + destination) in one pass |
| `/applications/:id` | Everything about one application: submissions, assessments, communications, status history — each editable in place, with add forms |
| `/companies` | Company list + quick add |
| `/companies/:id` | Company detail: branches, contacts, its applications |
| `/follow-ups` | The due list, with complete/snooze and a nav badge that updates instantly |

The same pages render through the API with no auth layer, so mutations you see in DevTools are the
real thing.

## Security posture (read this before exposing it)

This app assumes **one trusted user on one machine**. There is no login, no session, no rate limiting,
and no second factor — by design, because adding auth to a personal tool was not worth the friction.

What *is* enforced:

- The API binds to `127.0.0.1` only, and pins the `Host` header to `localhost`/`127.0.0.1`/`[::1]`.
  That second check exists because without it DNS rebinding lets a remote webpage resolve to
  `127.0.0.1` and read this API. There is no CORS middleware at all: the client is same-origin through
  the Vite proxy, and a cross-origin allowance would only widen the attack surface.
- Every write goes through a zod schema — enums, ranges, length caps, a 256 KB body limit — and every
  query is parameterized. SQL text is never built from user values.
- Foreign-key-ish references (`branch_id`, `contact_person_id`) are validated as belonging to the same
  company, and deletes that would orphan or silently blank rows return 409/400 instead.

If you ever need this reachable from a network, stop and add authentication first.

## Backups

Nothing in-repo does this yet, and it is the one genuinely dangerous gap once you have real
applications logged:

```bash
mysqldump -u root -p --single-transaction job_tracker > backup-2026-09-22.sql
```

Bash can generate the date with `backup-$(date +%F).sql`; in PowerShell use
`backup-$(Get-Date -Format yyyy-MM-dd).sql`. Restore with `mysql -u root -p job_tracker < backup.sql`.

## Status and next steps

`ROADMAP.md` keeps the authoritative 12-phase build list with a current-status column. Short version:
API, dashboard and the entry/monitoring flow are done and audited; branch/contact **forms**, inline
company quick-add in the application form, drag-and-drop kanban, and a backup script are the open ones.

## Known rough edges

- No pagination UI; lists stop at the server-side cap.
- A failing query still renders its empty/"not found" state, with the error surfaced only as a toast.
- `companies.name` has no UNIQUE constraint, so duplicates are accepted on purpose — merging them is
  left to you.
- `PUT /applications/:id` ignores a `status` key and returns 200; use `PATCH /applications/:id/status`.
- The new-application form saves the application and then its first submission as **two** requests. If
  the second one fails (a network blip, a rejected destination) the form stays open so you don't lose
  the entry — but submitting again creates a second application. Check the list before retrying.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Blank page at `:5173`, and `/api/...` returns HTML | A stale Vite dev server started before `vite.config.js` had the proxy. Restart `npm run dev` in `client/`. |
| `curl 127.0.0.1:5173` refuses, but the browser works | Vite binds `[::1]`; use `http://localhost:5173`. |
| API exits with "Port 4000 is already in use" | Another API instance is running, or set `PORT` in `server/.env`. |
| "Missing required env vars: …" | `.env` is missing, or `npm run dev` was run from a directory other than `server/` (`dotenv` resolves relative to the working directory). |
| App is up but every list is empty | MySQL isn't reachable — check `GET /api/health`. |
