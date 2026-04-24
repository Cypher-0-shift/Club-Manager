-- ══════════════════════════════════════════════════════════════════════
-- CLUB TASK MANAGER - Row Level Security Policies
-- ══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────
-- ENABLE RLS
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────
-- DROP EXISTING POLICIES (for clean re-run)
-- ─────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "organizations_select" ON public.organizations;
DROP POLICY IF EXISTS "organizations_insert" ON public.organizations;
DROP POLICY IF EXISTS "organizations_update" ON public.organizations;
DROP POLICY IF EXISTS "organizations_delete" ON public.organizations;
DROP POLICY IF EXISTS "users_select" ON public.users;
DROP POLICY IF EXISTS "users_update_self" ON public.users;
DROP POLICY IF EXISTS "users_insert" ON public.users;
DROP POLICY IF EXISTS "domains_select" ON public.domains;
DROP POLICY IF EXISTS "domains_insert" ON public.domains;
DROP POLICY IF EXISTS "domains_update" ON public.domains;
DROP POLICY IF EXISTS "domains_delete" ON public.domains;
DROP POLICY IF EXISTS "projects_select" ON public.projects;
DROP POLICY IF EXISTS "projects_insert" ON public.projects;
DROP POLICY IF EXISTS "projects_update" ON public.projects;
DROP POLICY IF EXISTS "projects_delete" ON public.projects;
DROP POLICY IF EXISTS "tasks_select" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update" ON public.tasks;
DROP POLICY IF EXISTS "submissions_select" ON public.submissions;
DROP POLICY IF EXISTS "submissions_insert" ON public.submissions;
DROP POLICY IF EXISTS "messages_select" ON public.messages;
DROP POLICY IF EXISTS "messages_insert" ON public.messages;
DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete" ON public.notifications;
DROP POLICY IF EXISTS "audit_select" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_insert" ON public.audit_logs;

-- ─────────────────────────────────────────────────────────────────────
-- ORGANIZATIONS
-- ─────────────────────────────────────────────────────────────────────
CREATE POLICY "organizations_select" ON public.organizations
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "organizations_insert" ON public.organizations
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "organizations_update" ON public.organizations
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "organizations_delete" ON public.organizations
  FOR DELETE TO authenticated
  USING (true);

-- ─────────────────────────────────────────────────────────────────────
-- USERS (Global visibility within org)
-- ─────────────────────────────────────────────────────────────────────
CREATE POLICY "users_select" ON public.users
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "users_update_self" ON public.users
  FOR UPDATE
  USING (
    id = auth.uid()
    OR public.get_auth_user_role() IN ('president','vp','secretary')
  )
  WITH CHECK (
    id = auth.uid()
    OR public.get_auth_user_role() IN ('president','vp','secretary')
  );

CREATE POLICY "users_insert" ON public.users
  FOR INSERT
  WITH CHECK (
    id = auth.uid() 
    OR public.get_auth_user_role() IN ('president','vp','secretary')
  );

-- ─────────────────────────────────────────────────────────────────────
-- DOMAINS (Global visibility)
-- ─────────────────────────────────────────────────────────────────────
CREATE POLICY "domains_select" ON public.domains
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "domains_insert" ON public.domains
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('president','vp','secretary'))
  );

CREATE POLICY "domains_update" ON public.domains
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('president','vp','secretary'))
  );

CREATE POLICY "domains_delete" ON public.domains
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('president','vp','secretary'))
  );

-- ─────────────────────────────────────────────────────────────────────
-- PROJECTS (Global visibility)
-- ─────────────────────────────────────────────────────────────────────
CREATE POLICY "projects_select" ON public.projects
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "projects_insert" ON public.projects
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('president','vp','secretary','lead'))
  );

CREATE POLICY "projects_update" ON public.projects
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('president','vp','secretary','lead'))
  );

CREATE POLICY "projects_delete" ON public.projects
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('president','vp','secretary','lead'))
  );

-- ─────────────────────────────────────────────────────────────────────
-- TASKS (Global visibility)
-- ─────────────────────────────────────────────────────────────────────
CREATE POLICY "tasks_select" ON public.tasks
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "tasks_insert" ON public.tasks
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('president','vp','secretary','lead'))
  );

CREATE POLICY "tasks_update" ON public.tasks
  FOR UPDATE
  USING (
    (assignee_id = auth.uid() AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'member'))
    OR
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() 
      AND u.role IN ('president','vp','secretary','lead')
      AND (u.role IN ('president','vp','secretary') OR u.domain_id = tasks.domain_id)
    )
  )
  WITH CHECK (
    (assignee_id = auth.uid() AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'member'))
    OR
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() 
      AND u.role IN ('president','vp','secretary','lead')
      AND (u.role IN ('president','vp','secretary') OR u.domain_id = tasks.domain_id)
    )
  );

-- ─────────────────────────────────────────────────────────────────────
-- SUBMISSIONS
-- ─────────────────────────────────────────────────────────────────────
CREATE POLICY "submissions_select" ON public.submissions
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('president','vp','secretary'))
    OR
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.projects p ON p.domain_id = u.domain_id
      JOIN public.tasks t ON t.project_id = p.id
      WHERE u.id = auth.uid() AND u.role = 'lead' AND t.id = submissions.task_id
    )
    OR
    submitted_by = auth.uid()
  );

CREATE POLICY "submissions_insert" ON public.submissions
  FOR INSERT
  WITH CHECK (submitted_by = auth.uid());

-- ─────────────────────────────────────────────────────────────────────
-- MESSAGES
-- ─────────────────────────────────────────────────────────────────────
CREATE POLICY "messages_select" ON public.messages
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('president','vp','secretary'))
    OR
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.projects p ON p.domain_id = u.domain_id
      JOIN public.tasks t ON t.project_id = p.id
      WHERE u.id = auth.uid() AND u.role = 'lead' AND t.id = messages.task_id
    )
    OR
    EXISTS (
      SELECT 1 FROM public.tasks t WHERE t.id = messages.task_id AND t.assignee_id = auth.uid()
    )
  );

CREATE POLICY "messages_insert" ON public.messages
  FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────────────
CREATE POLICY "notifications_select" ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notifications_update" ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notifications_insert" ON public.notifications
  FOR INSERT
  WITH CHECK (
    auth.jwt()->>'role' = 'service_role'
    OR auth.uid() = user_id
  );

CREATE POLICY "notifications_delete" ON public.notifications
  FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('president','vp','secretary'))
  );

-- ─────────────────────────────────────────────────────────────────────
-- AUDIT LOGS
-- ─────────────────────────────────────────────────────────────────────
CREATE POLICY "audit_select" ON public.audit_logs
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('president','vp','secretary'))
  );

CREATE POLICY "audit_insert" ON public.audit_logs
  FOR INSERT
  WITH CHECK (
    auth.jwt()->>'role' = 'service_role'
    OR actor_id = auth.uid()
  );

-- ─────────────────────────────────────────────────────────────────────
-- GRANT PERMISSIONS
-- ─────────────────────────────────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.organizations TO authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.domains TO authenticated;
GRANT ALL ON public.projects TO authenticated;
GRANT ALL ON public.tasks TO authenticated;
GRANT ALL ON public.submissions TO authenticated;
GRANT ALL ON public.messages TO authenticated;
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.audit_logs TO authenticated;

COMMENT ON SCHEMA public IS 'RLS policies enforce RBAC: President > VP/Secretary > Lead > Member';
