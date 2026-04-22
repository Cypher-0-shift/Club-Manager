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

-- Helper functions to prevent infinite recursion
CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS text AS $$
  SELECT role::text FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_auth_user_domain()
RETURNS uuid AS $$
  SELECT domain_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Users: leads see only their domain; members see only themselves
CREATE POLICY "users_select" ON public.users FOR SELECT
  USING (
    id = auth.uid()
    OR public.get_auth_user_role() IN ('president','vp','secretary')
    OR (
      public.get_auth_user_role() = 'lead'
      AND domain_id = public.get_auth_user_domain()
    )
  );

CREATE POLICY "users_update_self" ON public.users FOR UPDATE
  USING (
    id = auth.uid()
    OR public.get_auth_user_role() IN ('president','vp','secretary')
  )
  WITH CHECK (
    id = auth.uid()
    OR public.get_auth_user_role() IN ('president','vp','secretary')
  );

CREATE POLICY "users_insert" ON public.users FOR INSERT WITH CHECK (
    id = auth.uid() 
    OR public.get_auth_user_role() IN ('president','vp','secretary')
);

-- Domains
CREATE POLICY "domains_select" ON public.domains FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "domains_insert" ON public.domains FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('president','vp','secretary')));
CREATE POLICY "domains_update" ON public.domains FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('president','vp','secretary')));
CREATE POLICY "domains_delete" ON public.domains FOR DELETE USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('president','vp','secretary')));

-- Projects
CREATE POLICY "projects_select" ON public.projects FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "projects_insert" ON public.projects FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('president','vp','secretary','lead')));
CREATE POLICY "projects_update" ON public.projects FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('president','vp','secretary','lead')));
CREATE POLICY "projects_delete" ON public.projects FOR DELETE USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('president','vp','secretary','lead')));

-- Tasks: members see only their assigned tasks
CREATE POLICY "tasks_select" ON public.tasks FOR SELECT
  USING (
    -- Executives: see all
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('president','vp','secretary'))
    OR
    -- Leads: see tasks in their domain
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.projects p ON p.domain_id = u.domain_id
      WHERE u.id = auth.uid() AND u.role = 'lead' AND p.id = tasks.project_id
    )
    OR
    -- Members: only their own tasks
    assignee_id = auth.uid()
  );

-- Tasks: members can only update their own tasks
CREATE POLICY "tasks_update" ON public.tasks FOR UPDATE
  USING (
    assignee_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('president','vp','secretary','lead'))
  );

CREATE POLICY "tasks_insert" ON public.tasks FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('president','vp','secretary','lead')));

-- Submissions
CREATE POLICY "submissions_select" ON public.submissions FOR SELECT USING (
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
CREATE POLICY "submissions_insert" ON public.submissions FOR INSERT WITH CHECK (submitted_by = auth.uid());

-- Messages
CREATE POLICY "messages_select" ON public.messages FOR SELECT USING (
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
CREATE POLICY "messages_insert" ON public.messages FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Audit logs
CREATE POLICY "audit_select" ON public.audit_logs FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('president','vp','secretary')));
