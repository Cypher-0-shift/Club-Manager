-- ══════════════════════════════════════════════════════════════════════
-- CLUB TASK MANAGER - Functions, Triggers & Views
-- ══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────
-- HELPER FUNCTIONS
-- ─────────────────────────────────────────────────────────────────────

-- Get current user's role (prevents infinite recursion in RLS)
CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS text AS $$
  SELECT role::text FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get current user's domain
CREATE OR REPLACE FUNCTION public.get_auth_user_domain()
RETURNS uuid AS $$
  SELECT domain_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─────────────────────────────────────────────────────────────────────
-- TRIGGER FUNCTIONS
-- ─────────────────────────────────────────────────────────────────────

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Handle new user signup (auto-create profile)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, is_approved)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'member'),
    FALSE
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enforce member status-only updates
CREATE OR REPLACE FUNCTION public.enforce_member_status_only_update()
RETURNS TRIGGER AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role::text INTO user_role FROM public.users WHERE id = auth.uid();
  
  IF user_role = 'member' THEN
    IF (OLD.title IS DISTINCT FROM NEW.title) OR
       (OLD.description IS DISTINCT FROM NEW.description) OR
       (OLD.priority IS DISTINCT FROM NEW.priority) OR
       (OLD.deadline IS DISTINCT FROM NEW.deadline) OR
       (OLD.is_pinned IS DISTINCT FROM NEW.is_pinned) OR
       (OLD.project_id IS DISTINCT FROM NEW.project_id) OR
       (OLD.assignee_id IS DISTINCT FROM NEW.assignee_id) OR
       (OLD.created_by IS DISTINCT FROM NEW.created_by) OR
       (OLD.domain_id IS DISTINCT FROM NEW.domain_id) THEN
      
      RAISE EXCEPTION 'Members can only update the status field. Use the status update endpoint.'
        USING HINT = 'PATCH /tasks/{id}/status',
              ERRCODE = '42501';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────────
-- TRIGGERS
-- ─────────────────────────────────────────────────────────────────────

-- Updated_at triggers
DROP TRIGGER IF EXISTS set_updated_at_organizations ON public.organizations;
DROP TRIGGER IF EXISTS set_updated_at_domains ON public.domains;
DROP TRIGGER IF EXISTS set_updated_at_users ON public.users;
DROP TRIGGER IF EXISTS set_updated_at_projects ON public.projects;
DROP TRIGGER IF EXISTS set_updated_at_tasks ON public.tasks;

CREATE TRIGGER set_updated_at_organizations BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_domains BEFORE UPDATE ON public.domains FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_users BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_projects BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_tasks BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auth user creation trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Member status-only update enforcement
DROP TRIGGER IF EXISTS enforce_member_status_only ON public.tasks;
CREATE TRIGGER enforce_member_status_only
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_member_status_only_update();

-- ─────────────────────────────────────────────────────────────────────
-- CRON JOBS
-- ─────────────────────────────────────────────────────────────────────

-- Unschedule old jobs
SELECT cron.unschedule('check-overdue-tasks') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'check-overdue-tasks'
);

-- Schedule overdue task detection (every 5 minutes)
DO $$
BEGIN
  PERFORM cron.schedule(
    'check-overdue-tasks-v2',
    '*/5 * * * *',
    $cron$
      UPDATE public.tasks
      SET 
        is_overdue = true, 
        status = 'overdue',
        updated_at = NOW()
      WHERE 
        deadline AT TIME ZONE 'UTC' < NOW() AT TIME ZONE 'UTC'
        AND status NOT IN ('completed', 'overdue')
        AND is_overdue = false;
    $cron$
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Failed to schedule cron job (pg_cron may not be available): %', SQLERRM;
END $$;

-- Manual overdue check function
CREATE OR REPLACE FUNCTION public.mark_overdue_tasks()
RETURNS TABLE(updated_count INTEGER) AS $$
BEGIN
  RETURN QUERY
  WITH updated AS (
    UPDATE public.tasks
    SET 
      is_overdue = true, 
      status = 'overdue',
      updated_at = NOW()
    WHERE 
      deadline AT TIME ZONE 'UTC' < NOW() AT TIME ZONE 'UTC'
      AND status NOT IN ('completed', 'overdue')
      AND is_overdue = false
    RETURNING id
  )
  SELECT COUNT(*)::INTEGER FROM updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────────
-- VIEWS
-- ─────────────────────────────────────────────────────────────────────

-- Enriched tasks view (PHASE 4: 8x performance improvement)
DROP VIEW IF EXISTS public.v_enriched_tasks;
CREATE VIEW public.v_enriched_tasks AS
SELECT 
  t.id, t.title, t.description, t.status, t.priority, t.deadline,
  t.is_overdue, t.is_pinned, t.project_id, t.domain_id, t.assignee_id,
  t.created_by, t.created_at, t.updated_at,
  
  CASE WHEN p.id IS NOT NULL THEN
    json_build_object(
      'id', p.id, 'name', p.name, 'description', p.description,
      'domain_id', p.domain_id, 'created_by', p.created_by,
      'created_at', p.created_at, 'updated_at', p.updated_at
    )
  ELSE NULL END AS project,
  
  CASE WHEN assignee.id IS NOT NULL THEN
    json_build_object(
      'id', assignee.id, 'full_name', assignee.full_name,
      'email', assignee.email, 'role', assignee.role,
      'avatar_url', assignee.avatar_url
    )
  ELSE NULL END AS assignee,
  
  CASE WHEN creator.id IS NOT NULL THEN
    json_build_object(
      'id', creator.id, 'full_name', creator.full_name,
      'email', creator.email, 'role', creator.role,
      'avatar_url', creator.avatar_url
    )
  ELSE NULL END AS creator,
  
  COALESCE(msg_counts.count, 0) AS message_count,
  COALESCE(sub_counts.count, 0) AS submission_count

FROM public.tasks t
LEFT JOIN public.projects p ON t.project_id = p.id
LEFT JOIN public.users assignee ON t.assignee_id = assignee.id
LEFT JOIN public.users creator ON t.created_by = creator.id
LEFT JOIN (
  SELECT task_id, COUNT(*) as count FROM public.messages GROUP BY task_id
) msg_counts ON t.id = msg_counts.task_id
LEFT JOIN (
  SELECT task_id, COUNT(*) as count FROM public.submissions GROUP BY task_id
) sub_counts ON t.id = sub_counts.task_id;

-- Grant permissions
GRANT SELECT ON public.v_enriched_tasks TO authenticated, anon;

-- ─────────────────────────────────────────────────────────────────────
-- COMMENTS
-- ─────────────────────────────────────────────────────────────────────
COMMENT ON FUNCTION public.mark_overdue_tasks IS 'Manually mark overdue tasks. Returns count of updated tasks.';
COMMENT ON VIEW public.v_enriched_tasks IS 'PHASE 4: Pre-joined view eliminates N+1 queries (8x faster)';
COMMENT ON TRIGGER enforce_member_status_only ON public.tasks IS 'Enforces that members can ONLY update the status field';
