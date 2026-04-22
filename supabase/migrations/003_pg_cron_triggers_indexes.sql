-- supabase/migrations/003_pg_cron_triggers_indexes.sql

-- 1. Unique constraint for President (fixes genesis race condition)
CREATE UNIQUE INDEX IF NOT EXISTS unique_president
  ON public.users (role)
  WHERE role = 'president';

-- 2. Unique constraint for submissions
ALTER TABLE public.submissions DROP CONSTRAINT IF EXISTS unique_task_submission;
ALTER TABLE public.submissions ADD CONSTRAINT unique_task_submission UNIQUE (task_id);

-- 3. pg_cron job for overdue tasks
-- Enable the pg_cron extension
CREATE EXTENSION IF NOT EXISTS "pg_cron" SCHEMA pg_catalog;

DO $$
BEGIN
  -- Schedule the job to run every 5 minutes
  PERFORM cron.schedule(
    'check-overdue-tasks',
    '*/5 * * * *',
    $cron$
      UPDATE public.tasks
      SET is_overdue = true, status = 'overdue'
      WHERE deadline < now()
        AND status NOT IN ('completed', 'overdue');
    $cron$
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Failed to schedule cron job (pg_cron may not be available): %', SQLERRM;
END $$;

-- 4. Triggers for updated_at (in case they were truncated in 001)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_users_updated_at ON public.users;
CREATE TRIGGER set_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_tasks_updated_at ON public.tasks;
CREATE TRIGGER set_tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_projects_updated_at ON public.projects;
CREATE TRIGGER set_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_domains_updated_at ON public.domains;
CREATE TRIGGER set_domains_updated_at BEFORE UPDATE ON public.domains
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON public.tasks (assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks (project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_is_overdue ON public.tasks (is_overdue) WHERE is_overdue = true;
CREATE INDEX IF NOT EXISTS idx_projects_domain_id ON public.projects (domain_id);
CREATE INDEX IF NOT EXISTS idx_users_domain_approved ON public.users (domain_id, is_approved);
