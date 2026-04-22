-- ==============================================================================
-- RBAC Seed Script for Organization Task Manager
-- ==============================================================================
-- Run this script in the Supabase SQL Editor.
-- Note: This uses predefined UUIDs to make the relations easier to manage.

-- 1. Insert Domains
INSERT INTO public.domains (id, name, description, color_hex) VALUES 
('dddddddd-0000-0000-0000-000000000001', 'Development', 'Engineering and Tech', '#3b82f6'),
('dddddddd-0000-0000-0000-000000000002', 'PR', 'Public Relations and Comms', '#10b981'),
('dddddddd-0000-0000-0000-000000000003', 'Marketing', 'Marketing and Strategy', '#f59e0b'),
('dddddddd-0000-0000-0000-000000000004', 'Design', 'UI/UX and Graphic Design', '#ec4899')
ON CONFLICT (name) DO NOTHING;

-- 2. Insert Users into auth.users (using pgcrypto for password hash)
-- Password for all users is: DemoPass123!
INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at) VALUES 
('bbbbbbbb-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'president@demo.com', crypt('DemoPass123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
('bbbbbbbb-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'dev.lead@demo.com', crypt('DemoPass123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
('bbbbbbbb-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'pr.lead@demo.com', crypt('DemoPass123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
('bbbbbbbb-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'mktg.lead@demo.com', crypt('DemoPass123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
('bbbbbbbb-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'design.lead@demo.com', crypt('DemoPass123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
('bbbbbbbb-0000-0000-0000-000000000006', 'authenticated', 'authenticated', 'dev.member1@demo.com', crypt('DemoPass123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
('bbbbbbbb-0000-0000-0000-000000000007', 'authenticated', 'authenticated', 'dev.member2@demo.com', crypt('DemoPass123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
('bbbbbbbb-0000-0000-0000-000000000008', 'authenticated', 'authenticated', 'design.member@demo.com', crypt('DemoPass123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now())
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Users into public.users
INSERT INTO public.users (id, email, full_name, role, domain_id, is_approved) VALUES 
('bbbbbbbb-0000-0000-0000-000000000001', 'president@demo.com', 'Genesis President', 'president', NULL, TRUE),
('bbbbbbbb-0000-0000-0000-000000000002', 'dev.lead@demo.com', 'Alice DevLead', 'lead', 'dddddddd-0000-0000-0000-000000000001', TRUE),
('bbbbbbbb-0000-0000-0000-000000000003', 'pr.lead@demo.com', 'Bob PRLead', 'lead', 'dddddddd-0000-0000-0000-000000000002', TRUE),
('bbbbbbbb-0000-0000-0000-000000000004', 'mktg.lead@demo.com', 'Charlie MktgLead', 'lead', 'dddddddd-0000-0000-0000-000000000003', TRUE),
('bbbbbbbb-0000-0000-0000-000000000005', 'design.lead@demo.com', 'Diana DesignLead', 'lead', 'dddddddd-0000-0000-0000-000000000004', TRUE),
('bbbbbbbb-0000-0000-0000-000000000006', 'dev.member1@demo.com', 'Eve Coder', 'member', 'dddddddd-0000-0000-0000-000000000001', TRUE),
('bbbbbbbb-0000-0000-0000-000000000007', 'dev.member2@demo.com', 'Frank Hacker', 'member', 'dddddddd-0000-0000-0000-000000000001', TRUE),
('bbbbbbbb-0000-0000-0000-000000000008', 'design.member@demo.com', 'Grace Artist', 'member', 'dddddddd-0000-0000-0000-000000000004', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Projects
INSERT INTO public.projects (id, name, description, domain_id, created_by) VALUES 
('cccccccc-0000-0000-0000-000000000001', 'Core API V2', 'Upgrading the legacy backend to FastAPI V2.', 'dddddddd-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000002'),
('cccccccc-0000-0000-0000-000000000002', 'Q3 Campaign Launch', 'Press releases and public announcements for Q3.', 'dddddddd-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000003'),
('cccccccc-0000-0000-0000-000000000003', 'Brand Refresh', 'New messaging and SEO strategy for the organization.', 'dddddddd-0000-0000-0000-000000000003', 'bbbbbbbb-0000-0000-0000-000000000004'),
('cccccccc-0000-0000-0000-000000000004', 'UI Kit Overhaul', 'Updating the primary component library and design tokens.', 'dddddddd-0000-0000-0000-000000000004', 'bbbbbbbb-0000-0000-0000-000000000005')
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Tasks
INSERT INTO public.tasks (id, title, description, status, priority, deadline, is_overdue, project_id, assignee_id, created_by) VALUES 
-- Dev Tasks
('aaaaaaaa-0000-0000-0000-000000000001', 'Fix Authentication Bug', 'Users are getting logged out randomly on token refresh.', 'in_progress', 'critical', NOW() - INTERVAL '2 days', TRUE, 'cccccccc-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000006', 'bbbbbbbb-0000-0000-0000-000000000002'),
('aaaaaaaa-0000-0000-0000-000000000002', 'Setup CI/CD Pipeline', 'Implement GitHub Actions for automated deployment to staging.', 'pending', 'high', NOW() + INTERVAL '3 days', FALSE, 'cccccccc-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000007', 'bbbbbbbb-0000-0000-0000-000000000002'),
('aaaaaaaa-0000-0000-0000-000000000003', 'Write Unit Tests for Router', 'Achieve 80% coverage on the new tasks router.', 'completed', 'medium', NOW() - INTERVAL '5 days', FALSE, 'cccccccc-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000007', 'bbbbbbbb-0000-0000-0000-000000000002'),

-- PR Tasks
('aaaaaaaa-0000-0000-0000-000000000004', 'Draft Press Release', 'Write the initial draft for the V2 launch announcement.', 'pending', 'medium', NOW() + INTERVAL '7 days', FALSE, 'cccccccc-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000003', 'bbbbbbbb-0000-0000-0000-000000000003'),

-- Marketing Tasks
('aaaaaaaa-0000-0000-0000-000000000005', 'SEO Audit', 'Run Lighthouse and SEMrush audits on the new landing page.', 'in_progress', 'high', NOW() + INTERVAL '2 days', FALSE, 'cccccccc-0000-0000-0000-000000000003', 'bbbbbbbb-0000-0000-0000-000000000004', 'bbbbbbbb-0000-0000-0000-000000000004'),

-- Design Tasks
('aaaaaaaa-0000-0000-0000-000000000006', 'Finalize Logo Concepts', 'Review the 3 options provided by the agency and select one.', 'pending', 'critical', NOW() - INTERVAL '1 day', TRUE, 'cccccccc-0000-0000-0000-000000000004', 'bbbbbbbb-0000-0000-0000-000000000008', 'bbbbbbbb-0000-0000-0000-000000000005'),
('aaaaaaaa-0000-0000-0000-000000000007', 'Create Dashboard Mockups', 'Figma mockups for the new analytics dashboard.', 'completed', 'medium', NOW() - INTERVAL '4 days', FALSE, 'cccccccc-0000-0000-0000-000000000004', 'bbbbbbbb-0000-0000-0000-000000000008', 'bbbbbbbb-0000-0000-0000-000000000005')
ON CONFLICT (id) DO NOTHING;
