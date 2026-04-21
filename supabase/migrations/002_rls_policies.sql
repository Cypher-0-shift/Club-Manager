-- ══════════════════════════════════════════════
-- RLS POLICIES — Safe (re-runnable)
-- ══════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE public.users       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domains     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs  ENABLE ROW LEVEL SECURITY;

-- Drop all policies first (safe re-run)
DROP POLICY IF EXISTS "users_select"       ON public.users;
DROP POLICY IF EXISTS "users_update_self"  ON public.users;
DROP POLICY IF EXISTS "users_insert"       ON public.users;
DROP POLICY IF EXISTS "domains_select"     ON public.domains;
DROP POLICY IF EXISTS "domains_insert"     ON public.domains;
DROP POLICY IF EXISTS "domains_update"     ON public.domains;
DROP POLICY IF EXISTS "domains_delete"     ON public.domains;
DROP POLICY IF EXISTS "projects_select"    ON public.projects;
DROP POLICY IF EXISTS "projects_insert"    ON public.projects;
DROP POLICY IF EXISTS "projects_update"    ON public.projects;
DROP POLICY IF EXISTS "projects_delete"    ON public.projects;
DROP POLICY IF EXISTS "tasks_select"       ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert"       ON public.tasks;
DROP POLICY IF EXISTS "tasks_update"       ON public.tasks;
DROP POLICY IF EXISTS "submissions_select" ON public.submissions;
DROP POLICY IF EXISTS "submissions_insert" ON public.submissions;
DROP POLICY IF EXISTS "messages_select"    ON public.messages;
DROP POLICY IF EXISTS "messages_insert"    ON public.messages;
DROP POLICY IF EXISTS "audit_select"       ON public.audit_logs;

-- Users
CREATE POLICY "users_select"      ON public.users FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "users_update_self" ON public.users FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "users_insert"      ON public.users FOR INSERT WITH CHECK (id = auth.uid());

-- Domains
CREATE POLICY "domains_select" ON public.domains FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "domains_insert" ON public.domains FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "domains_update" ON public.domains FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "domains_delete" ON public.domains FOR DELETE USING (auth.uid() IS NOT NULL);

-- Projects
CREATE POLICY "projects_select" ON public.projects FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "projects_insert" ON public.projects FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "projects_update" ON public.projects FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "projects_delete" ON public.projects FOR DELETE USING (auth.uid() IS NOT NULL);

-- Tasks
CREATE POLICY "tasks_select" ON public.tasks FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "tasks_insert" ON public.tasks FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "tasks_update" ON public.tasks FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Submissions
CREATE POLICY "submissions_select" ON public.submissions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "submissions_insert" ON public.submissions FOR INSERT WITH CHECK (submitted_by = auth.uid());

-- Messages
CREATE POLICY "messages_select" ON public.messages FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "messages_insert" ON public.messages FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Audit logs
CREATE POLICY "audit_select" ON public.audit_logs FOR SELECT USING (auth.uid() IS NOT NULL);
