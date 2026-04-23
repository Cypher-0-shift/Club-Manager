-- ══════════════════════════════════════════════
-- CLUB TASK MANAGER — Safe Migration (re-runnable)
-- ══════════════════════════════════════════════

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Safe ENUM type creation (won't fail if already exists)
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('president', 'vp', 'secretary', 'lead', 'member');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'overdue');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE submission_type AS ENUM ('file', 'url', 'text');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tables
CREATE TABLE IF NOT EXISTS public.domains (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  color_hex   TEXT NOT NULL DEFAULT '#6366f1',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  full_name     TEXT NOT NULL,
  role          user_role NOT NULL DEFAULT 'member',
  domain_id     UUID REFERENCES public.domains(id) ON DELETE SET NULL,
  is_approved   BOOLEAN NOT NULL DEFAULT FALSE,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  domain_id   UUID NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
  created_by  UUID NOT NULL REFERENCES public.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL CHECK (char_length(title) <= 120),
  description  TEXT,
  status       task_status   NOT NULL DEFAULT 'pending',
  priority     task_priority NOT NULL DEFAULT 'medium',
  deadline     TIMESTAMPTZ,
  is_overdue   BOOLEAN NOT NULL DEFAULT FALSE,
  is_pinned    BOOLEAN NOT NULL DEFAULT FALSE,
  project_id   UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  assignee_id  UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_by   UUID NOT NULL REFERENCES public.users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES public.users(id),
  content     TEXT NOT NULL CHECK (char_length(content) <= 2000),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   UUID,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers (drop first to avoid duplicate errors)
DROP TRIGGER IF EXISTS set_updated_at_domains  ON public.domains;
DROP TRIGGER IF EXISTS set_updated_at_users    ON public.users;
DROP TRIGGER IF EXISTS set_updated_at_projects ON public.projects;
DROP TRIGGER IF EXISTS set_updated_at_tasks    ON public.tasks;

CREATE TRIGGER set_updated_at_domains   BEFORE UPDATE ON public.domains   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_users     BEFORE UPDATE ON public.users     FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_projects  BEFORE UPDATE ON public.projects  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_tasks     BEFORE UPDATE ON public.tasks     FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_assignee  ON public.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project   ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status    ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_messages_task   ON public.messages(task_id);
CREATE INDEX IF NOT EXISTS idx_projects_domain ON public.projects(domain_id);
CREATE INDEX IF NOT EXISTS idx_users_domain    ON public.users(domain_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor     ON public.audit_logs(actor_id);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('submissions', 'submissions', false)
ON CONFLICT DO NOTHING;
