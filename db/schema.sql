-- Job_Tracker schema — MySQL 8, InnoDB, utf8mb4
-- Source of truth for the database. Future changes go in numbered files (db/002_*.sql).
-- ENUM vocabularies are closed sets; to add a value: ALTER TABLE ... MODIFY COLUMN.

CREATE DATABASE IF NOT EXISTS job_tracker
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE job_tracker;

-- ---------- companies ----------
CREATE TABLE companies (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(200) NOT NULL,
  industry      VARCHAR(100) NULL,
  website       VARCHAR(255) NULL,
  company_size  VARCHAR(50)  NULL,            -- free text: '50-200', 'BPO ~10k'
  notes         TEXT         NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_companies_name (name)               -- type-ahead quick-add lookup
) ENGINE=InnoDB;

-- ---------- company_branches ----------
CREATE TABLE company_branches (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id    INT UNSIGNED NOT NULL,
  label         VARCHAR(100) NOT NULL DEFAULT 'Main',  -- 'HQ Makati', 'Cebu IT Park'
  address_line  VARCHAR(255) NULL,
  city          VARCHAR(100) NULL,
  province      VARCHAR(100) NULL,
  region        VARCHAR(100) NULL,            -- 'NCR', 'Region VII'
  postal_code   VARCHAR(10)  NULL,
  is_primary    TINYINT(1)   NOT NULL DEFAULT 0,
  notes         TEXT         NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_branches_company (company_id),
  CONSTRAINT fk_branches_company FOREIGN KEY (company_id)
    REFERENCES companies (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------- contact_persons (recruiters / HR) ----------
CREATE TABLE contact_persons (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id    INT UNSIGNED NOT NULL,
  branch_id     INT UNSIGNED NULL,
  full_name     VARCHAR(150) NOT NULL,
  job_title     VARCHAR(150) NULL,            -- 'Talent Acquisition Specialist'
  email         VARCHAR(255) NULL,
  phone         VARCHAR(50)  NULL,            -- '+63 917 ...'
  preferred_channel ENUM('email','call','sms','chat') NULL,
  is_primary    TINYINT(1) NOT NULL DEFAULT 0,
  notes         TEXT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_contacts_company (company_id),
  KEY idx_contacts_email (email),
  CONSTRAINT fk_contacts_company FOREIGN KEY (company_id)
    REFERENCES companies (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_contacts_branch FOREIGN KEY (branch_id)
    REFERENCES company_branches (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------- applications ----------
-- Current status lives here (fast kanban/list queries); every change is
-- mirrored into application_status_history by the service layer.
CREATE TABLE applications (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id        INT UNSIGNED NOT NULL,
  branch_id         INT UNSIGNED NULL,        -- which branch/location applied to
  job_title         VARCHAR(200) NOT NULL,    -- 'Service Desk Analyst', 'Data Encoder'
  role_category     ENUM('it','service_desk','data','other') NOT NULL DEFAULT 'it',
  source            VARCHAR(100) NULL,        -- where you found it: 'LinkedIn','JobStreet','referral','walk-in'
  posting_url       VARCHAR(500) NULL,        -- if any posting exists at all
  status            ENUM('submitted','assessment','interview','offer',
                         'hired','rejected','withdrawn','ghosted')
                    NOT NULL DEFAULT 'submitted',
  status_changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  applied_at        DATE NOT NULL,            -- DATE on purpose: day granularity, faster to type
  salary_asked      DECIMAL(10,2) NULL,
  salary_offered    DECIMAL(10,2) NULL,
  priority          TINYINT UNSIGNED NOT NULL DEFAULT 2,  -- 1=hot, 2=normal, 3=low
  notes             TEXT NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_apps_company (company_id),
  KEY idx_apps_status (status),               -- kanban grouping / pipeline counts
  KEY idx_apps_applied (applied_at),          -- recency sorting
  KEY idx_apps_status_changed (status_changed_at), -- 'stale application' nagging
  CONSTRAINT fk_apps_company FOREIGN KEY (company_id)
    REFERENCES companies (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_apps_branch FOREIGN KEY (branch_id)
    REFERENCES company_branches (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------- application_status_history (append-only) ----------
CREATE TABLE application_status_history (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  application_id INT UNSIGNED NOT NULL,
  old_status     ENUM('submitted','assessment','interview','offer',
                      'hired','rejected','withdrawn','ghosted') NULL, -- NULL on creation
  new_status     ENUM('submitted','assessment','interview','offer',
                      'hired','rejected','withdrawn','ghosted') NOT NULL,
  note           VARCHAR(500) NULL,           -- 'moved after 2nd call with HR'
  changed_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_hist_app_time (application_id, changed_at),
  CONSTRAINT fk_hist_app FOREIGN KEY (application_id)
    REFERENCES applications (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------- submissions (where/how it was actually sent) ----------
-- One application can have several: emailed hr@x.ph AND applied on their portal.
CREATE TABLE submissions (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  application_id   INT UNSIGNED NOT NULL,
  contact_person_id INT UNSIGNED NULL,        -- if sent to a specific recruiter
  channel          ENUM('email','portal','walk_in','referral','phone',
                        'job_board','other') NOT NULL,
  destination      VARCHAR(300) NOT NULL,     -- exact 'careers@company.ph' / portal URL / 'walked in at Makati branch'
  submitted_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  confirmation_ref VARCHAR(100) NULL,         -- 'Application ID: 458821' from portal
  attachment_name  VARCHAR(255) NULL,         -- which resume version was sent
  notes            TEXT NULL,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_subs_app (application_id),
  KEY idx_subs_destination (destination),     -- 'have I used this email before?' lookup
  CONSTRAINT fk_subs_app FOREIGN KEY (application_id)
    REFERENCES applications (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_subs_contact FOREIGN KEY (contact_person_id)
    REFERENCES contact_persons (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------- assessments (pre-employment tests) ----------
CREATE TABLE assessments (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  application_id  INT UNSIGNED NOT NULL,
  type            ENUM('technical','buplas','language','personality',
                       'skills_test','interview_task','medical','other')
                  NOT NULL DEFAULT 'technical',
  name            VARCHAR(200) NULL,          -- 'Service Desk situational exam', 'Kenexa English'
  status          ENUM('scheduled','pending','in_progress','completed',
                       'passed','failed','no_show','cancelled')
                  NOT NULL DEFAULT 'scheduled',
  location        VARCHAR(300) NULL,          -- physical address or meeting/portal link
  scheduled_at    DATETIME NULL,
  completed_at    DATETIME NULL,
  score           DECIMAL(6,2) NULL,
  max_score       DECIMAL(6,2) NULL,          -- BUPLAS-style: 119/150
  result_notes    TEXT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_assess_app (application_id),
  KEY idx_assess_scheduled (status, scheduled_at), -- 'upcoming tests' widget
  CONSTRAINT fk_assess_app FOREIGN KEY (application_id)
    REFERENCES applications (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------- communications (calls/emails/SMS + folded-in follow-ups) ----------
-- follow_up_due_at NULL = no follow-up needed; follow_up_completed_at NULL while still open.
CREATE TABLE communications (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  application_id    INT UNSIGNED NOT NULL,
  contact_person_id INT UNSIGNED NULL,
  method            ENUM('email','call','sms','chat','in_person','note') NOT NULL,
  direction         ENUM('inbound','outbound') NOT NULL DEFAULT 'outbound',
  summary           VARCHAR(255) NOT NULL,    -- one-line 'what happened' — required, keeps the log scannable
  details           TEXT NULL,                -- full notes / email body excerpt
  occurred_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  follow_up_due_at       DATETIME NULL,
  follow_up_completed_at DATETIME NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_comm_app (application_id, occurred_at),
  KEY idx_comm_followup (follow_up_due_at, follow_up_completed_at), -- 'due' query
  CONSTRAINT fk_comm_app FOREIGN KEY (application_id)
    REFERENCES applications (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_comm_contact FOREIGN KEY (contact_person_id)
    REFERENCES contact_persons (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;
