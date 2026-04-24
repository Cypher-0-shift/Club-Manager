-- ══════════════════════════════════════════════════════════════════════
-- CLUB TASK MANAGER - Complete Database Schema
-- ══════════════════════════════════════════════════════════════════════
-- Consolidated from migrations 001-018
-- This migration is idempotent and can be run multiple times safely

-- ─────────────────────────────────────────────────────────────────────
-- EXTENSIONS
-- ─────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_cron" SCHEMA pg_catalog;

-- ─────────────────────────────────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('president', 'vp', 'secretary', 'lead', 'member');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'overdue');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE submission_type AS ENUM ('file', 'url', 'text');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────────
-- TABLES
-- ─────────────────────────────────────────────────────────────────────

-- Organizations (Multi-tenant support)
CREATE TABLE IF NOT EXISTS public.organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  join_code   TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Domains
CREATE TABLE IF NOT EXISTS public.domains (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  color_hex   TEXT NOT NULL DEFAULT '#6366f1',
  org_id      UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users
CREATE TABLE IF NOT EXISTS public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  role          user_role NOT NULL DEFAULT 'member',
  domain_id     UUID REFERENCES public.domains(id) ON DELETE SET NULL,
  org_id        UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  is_approved   BOOLEAN NOT NULL DEFAULT FALSE,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Projects
CREATE TABLE IF NOT EXISTS public.projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  domain_id   UUID NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
  org_id      UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by  UUID NOT NULL REFERENCES public.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tasks
CREATE TABLE IF NOT EXISTS public.tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL CHECK (char_length(title) <= 120),
  description  TEXT,
  status       task_status   NOT NULL DEFAULT 'pending',
  priority     task_priority NOT NULL DEFAULT 'medium',
  deadline     TIMESTAMPTZ,
  is_overdue   BOOLEAN NOT NULL DEFAULT FALSE,
  is_pinned    BOOLEAN NOT NULL DEFAULT FALSE,
  project_id   UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  domain_id    UUID NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
  org_id       UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  assignee_id  UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_by   UUID NOT NULL REFERENCES public.users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Submissions
CREATE TABLE IF NOT EXISTS public.submissions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id        UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  submitted_by   UUID NOT NULL REFERENCES public.users(id),
  type           submission_type NOT NULL,
  file_url       TEXT,
  url            TEXT,
  text_content   TEXT,
  file_name      TEXT,
  file_size      BIGINT,
  org_id         UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Messages
CREATE TABLE IF NOT EXISTS public.messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES public.users(id),
  content     TEXT NOT NULL CHECK (char_length(content) <= 2000),
  org_id      UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  type        TEXT NOT NULL,
  related_id  UUID,
  is_read     BOOLEAN DEFAULT FALSE,
  org_id      UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   UUID,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────
-- CONSTRAINTS
-- ─────────────────────────────────────────────────────────────────────

-- Unique president per organization
DROP INDEX IF EXISTS public.unique_president;
DROP INDEX IF EXISTS public.unique_president_per_org;
CREATE UNIQUE INDEX IF NOT EXISTS unique_president_per_org
  ON public.users (org_id, role)
  WHERE role = 'president';

-- President must have org_id
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS president_must_have_org;
ALTER TABLE public.users ADD CONSTRAINT president_must_have_org 
  CHECK (role != 'president' OR org_id IS NOT NULL);

-- Prevent duplicate submissions within 1 second (double-click protection)
DROP INDEX IF EXISTS idx_submissions_dedup;
CREATE UNIQUE INDEX IF NOT EXISTS idx_submissions_dedup 
ON public.submissions(task_id, submitted_by, floor(extract(epoch from (created_at AT TIME ZONE 'UTC'))));

-- ─────────────────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────────────────

-- Basic indexes
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON public.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_domain_id ON public.tasks(domain_id);
CREATE INDEX IF NOT EXISTS idx_messages_task ON public.messages(task_id);
CREATE INDEX IF NOT EXISTS idx_projects_domain ON public.projects(domain_id);
CREATE INDEX IF NOT EXISTS idx_users_domain ON public.users(domain_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Composite indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_domain_status ON public.tasks(domain_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_status_deadline ON public.tasks(status, deadline) WHERE status NOT IN ('completed', 'overdue');
CREATE INDEX IF NOT EXISTS idx_tasks_deadline_status ON public.tasks(deadline, status) WHERE deadline IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_role_approved ON public.users(role, is_approved);
CREATE INDEX IF NOT EXISTS idx_users_approved_domain ON public.users(is_approved, domain_id) WHERE is_approved = true;
CREATE INDEX IF NOT EXISTS idx_projects_domain_created ON public.projects(domain_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_status ON public.tasks(assignee_id, status) WHERE assignee_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON public.tasks(project_id, status);
CREATE INDEX IF NOT EXISTS idx_submissions_task_created ON public.submissions(task_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_task_id_count ON public.messages(task_id);
CREATE INDEX IF NOT EXISTS idx_submissions_task_id_count ON public.submissions(task_id);

-- Covering index for task list queries
CREATE INDEX IF NOT EXISTS idx_tasks_list_covering 
ON public.tasks(domain_id, status, is_pinned, created_at DESC) 
INCLUDE (title, priority, deadline, assignee_id);

-- ─────────────────────────────────────────────────────────────────────
-- STORAGE
-- ─────────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('submissions', 'submissions', false)
ON CONFLICT DO NOTHING;

COMMENT ON SCHEMA public IS 'Club Task Manager - Complete database schema with multi-tenant support';
