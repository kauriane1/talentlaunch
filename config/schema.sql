-- ═══════════════════════════════════════════════════
--  TalentLaunch Rwanda — PostgreSQL Database Schema
--  Run this file once to set up all tables in Postgres:
--    psql $DATABASE_URL -f Back-end/config/schema.sql
-- ═══════════════════════════════════════════════════

-- Create database manually if required; Render/Neon typically provides the DB.

-- ─────────────────────────────────────
--  USERS
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  email        VARCHAR(150) NOT NULL UNIQUE,
  password     VARCHAR(255) NOT NULL,
  role         VARCHAR(10)  NOT NULL DEFAULT 'youth' CHECK (role IN ('youth','admin')),
  location     VARCHAR(100),
  bio          TEXT,
  avatar_url   VARCHAR(255),
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ─────────────────────────────────────
--  MENTORS
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS mentors (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  email        VARCHAR(150) NOT NULL UNIQUE,
  specialty    VARCHAR(150) NOT NULL,
  bio          TEXT,
  avatar_url   VARCHAR(255),
  contact_info VARCHAR(255),
  is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────
--  WORKSHOPS
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS workshops (
  id           SERIAL PRIMARY KEY,
  title        VARCHAR(200) NOT NULL,
  description  TEXT         NOT NULL,
  mentor_id    INT,
  date         TIMESTAMP    NOT NULL,
  location     VARCHAR(200),
  capacity     INT          NOT NULL DEFAULT 30,
  status       VARCHAR(20)  NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming','live','completed','cancelled')),
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mentor_id) REFERENCES mentors(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────
--  WORKSHOP ENROLLMENTS
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS workshop_enrollments (
  id           SERIAL PRIMARY KEY,
  user_id      INT       NOT NULL,
  workshop_id  INT       NOT NULL,
  enrolled_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, workshop_id),
  FOREIGN KEY (user_id)     REFERENCES users(id)     ON DELETE CASCADE,
  FOREIGN KEY (workshop_id) REFERENCES workshops(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────
--  TALENT SHOWCASE
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS talents (
  id           SERIAL PRIMARY KEY,
  user_id      INT          NOT NULL,
  title        VARCHAR(200) NOT NULL,
  description  TEXT         NOT NULL,
  category     VARCHAR(100) NOT NULL,
  file_url     VARCHAR(255),
  file_type    VARCHAR(50),
  views        INT          NOT NULL DEFAULT 0,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_talents_category ON talents(category);
CREATE INDEX IF NOT EXISTS idx_talents_user ON talents(user_id);