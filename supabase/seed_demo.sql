-- SQL Seed for Club Manager Demo Data
-- Fixed UUID Pattern: aaaaaaaa-0000-0000-0000-00000000000X

-- 1. Create Organization
INSERT INTO public.organizations (id, name, join_code)
VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 'Nexus Club', 'NEXUS001')
ON CONFLICT (id) DO NOTHING;

-- 2. Create Auth Users and Identities
-- Alex Rivera (President)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, raw_app_meta_data, aud, role)
VALUES ('aaaaaaaa-0000-0000-0000-000000000010', 'president@nexus.com', crypt('Demo@1234', gen_salt('bf')), now(), '{"full_name": "Alex Rivera"}'::jsonb, now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, provider_id)
VALUES ('aaaaaaaa-0000-0000-0000-000000000010', 'aaaaaaaa-0000-0000-0000-000000000010', '{"sub":"aaaaaaaa-0000-0000-0000-000000000010","email":"president@nexus.com"}'::jsonb, 'email', now(), now(), now(), 'aaaaaaaa-0000-0000-0000-000000000010')
ON CONFLICT (id) DO NOTHING;

-- Sam Chen (Tech Lead)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, raw_app_meta_data, aud, role)
VALUES ('aaaaaaaa-0000-0000-0000-000000000020', 'sam@nexus.com', crypt('Demo@1234', gen_salt('bf')), now(), '{"full_name": "Sam Chen"}'::jsonb, now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, provider_id)
VALUES ('aaaaaaaa-0000-0000-0000-000000000020', 'aaaaaaaa-0000-0000-0000-000000000020', '{"sub":"aaaaaaaa-0000-0000-0000-000000000020","email":"sam@nexus.com"}'::jsonb, 'email', now(), now(), now(), 'aaaaaaaa-0000-0000-0000-000000000020')
ON CONFLICT (id) DO NOTHING;

-- Priya Patel (Design Lead)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, raw_app_meta_data, aud, role)
VALUES ('aaaaaaaa-0000-0000-0000-000000000021', 'priya@nexus.com', crypt('Demo@1234', gen_salt('bf')), now(), '{"full_name": "Priya Patel"}'::jsonb, now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, provider_id)
VALUES ('aaaaaaaa-0000-0000-0000-000000000021', 'aaaaaaaa-0000-0000-0000-000000000021', '{"sub":"aaaaaaaa-0000-0000-0000-000000000021","email":"priya@nexus.com"}'::jsonb, 'email', now(), now(), now(), 'aaaaaaaa-0000-0000-0000-000000000021')
ON CONFLICT (id) DO NOTHING;

-- Jordan Smith (Marketing Lead)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, raw_app_meta_data, aud, role)
VALUES ('aaaaaaaa-0000-0000-0000-000000000022', 'jordan@nexus.com', crypt('Demo@1234', gen_salt('bf')), now(), '{"full_name": "Jordan Smith"}'::jsonb, now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, provider_id)
VALUES ('aaaaaaaa-0000-0000-0000-000000000022', 'aaaaaaaa-0000-0000-0000-000000000022', '{"sub":"aaaaaaaa-0000-0000-0000-000000000022","email":"jordan@nexus.com"}'::jsonb, 'email', now(), now(), now(), 'aaaaaaaa-0000-0000-0000-000000000022')
ON CONFLICT (id) DO NOTHING;

-- Morgan Lee (Events Lead)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, raw_app_meta_data, aud, role)
VALUES ('aaaaaaaa-0000-0000-0000-000000000023', 'morgan@nexus.com', crypt('Demo@1234', gen_salt('bf')), now(), '{"full_name": "Morgan Lee"}'::jsonb, now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, provider_id)
VALUES ('aaaaaaaa-0000-0000-0000-000000000023', 'aaaaaaaa-0000-0000-0000-000000000023', '{"sub":"aaaaaaaa-0000-0000-0000-000000000023","email":"morgan@nexus.com"}'::jsonb, 'email', now(), now(), now(), 'aaaaaaaa-0000-0000-0000-000000000023')
ON CONFLICT (id) DO NOTHING;

-- Riley Kumar (Member Tech)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, raw_app_meta_data, aud, role)
VALUES ('aaaaaaaa-0000-0000-0000-000000000030', 'member1@nexus.com', crypt('Demo@1234', gen_salt('bf')), now(), '{"full_name": "Riley Kumar"}'::jsonb, now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, provider_id)
VALUES ('aaaaaaaa-0000-0000-0000-000000000030', 'aaaaaaaa-0000-0000-0000-000000000030', '{"sub":"aaaaaaaa-0000-0000-0000-000000000030","email":"member1@nexus.com"}'::jsonb, 'email', now(), now(), now(), 'aaaaaaaa-0000-0000-0000-000000000030')
ON CONFLICT (id) DO NOTHING;

-- Casey Wong (Member Design)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, raw_app_meta_data, aud, role)
VALUES ('aaaaaaaa-0000-0000-0000-000000000031', 'member2@nexus.com', crypt('Demo@1234', gen_salt('bf')), now(), '{"full_name": "Casey Wong"}'::jsonb, now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, provider_id)
VALUES ('aaaaaaaa-0000-0000-0000-000000000031', 'aaaaaaaa-0000-0000-0000-000000000031', '{"sub":"aaaaaaaa-0000-0000-0000-000000000031","email":"member2@nexus.com"}'::jsonb, 'email', now(), now(), now(), 'aaaaaaaa-0000-0000-0000-000000000031')
ON CONFLICT (id) DO NOTHING;

-- Drew Patel (Member Marketing)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, raw_app_meta_data, aud, role)
VALUES ('aaaaaaaa-0000-0000-0000-000000000032', 'member3@nexus.com', crypt('Demo@1234', gen_salt('bf')), now(), '{"full_name": "Drew Patel"}'::jsonb, now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, provider_id)
VALUES ('aaaaaaaa-0000-0000-0000-000000000032', 'aaaaaaaa-0000-0000-0000-000000000032', '{"sub":"aaaaaaaa-0000-0000-0000-000000000032","email":"member3@nexus.com"}'::jsonb, 'email', now(), now(), now(), 'aaaaaaaa-0000-0000-0000-000000000032')
ON CONFLICT (id) DO NOTHING;

-- 3. Create Domains
INSERT INTO public.domains (id, name, org_id, color_hex)
VALUES 
('aaaaaaaa-0000-0000-0000-000000000040', 'Tech', 'aaaaaaaa-0000-0000-0000-000000000001', '#0ea5e9'),
('aaaaaaaa-0000-0000-0000-000000000041', 'Design', 'aaaaaaaa-0000-0000-0000-000000000001', '#ec4899'),
('aaaaaaaa-0000-0000-0000-000000000042', 'Marketing', 'aaaaaaaa-0000-0000-0000-000000000001', '#f59e0b'),
('aaaaaaaa-0000-0000-0000-000000000043', 'Events', 'aaaaaaaa-0000-0000-0000-000000000001', '#10b981')
ON CONFLICT (id) DO NOTHING;

-- 4. Create Public Users (using INSERT ... ON CONFLICT to ensure rows exist)
-- Alex Rivera (President)
INSERT INTO public.users (id, email, full_name, role, org_id, is_approved)
VALUES ('aaaaaaaa-0000-0000-0000-000000000010', 'president@nexus.com', 'Alex Rivera', 'president', 'aaaaaaaa-0000-0000-0000-000000000001', true)
ON CONFLICT (id) DO UPDATE SET 
  role = EXCLUDED.role, org_id = EXCLUDED.org_id, is_approved = EXCLUDED.is_approved, full_name = EXCLUDED.full_name;

-- Sam Chen (Tech Lead)
INSERT INTO public.users (id, email, full_name, role, org_id, domain_id, is_approved)
VALUES ('aaaaaaaa-0000-0000-0000-000000000020', 'sam@nexus.com', 'Sam Chen', 'lead', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000040', true)
ON CONFLICT (id) DO UPDATE SET 
  role = EXCLUDED.role, org_id = EXCLUDED.org_id, domain_id = EXCLUDED.domain_id, is_approved = EXCLUDED.is_approved, full_name = EXCLUDED.full_name;

-- Priya Patel (Design Lead)
INSERT INTO public.users (id, email, full_name, role, org_id, domain_id, is_approved)
VALUES ('aaaaaaaa-0000-0000-0000-000000000021', 'priya@nexus.com', 'Priya Patel', 'lead', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000041', true)
ON CONFLICT (id) DO UPDATE SET 
  role = EXCLUDED.role, org_id = EXCLUDED.org_id, domain_id = EXCLUDED.domain_id, is_approved = EXCLUDED.is_approved, full_name = EXCLUDED.full_name;

-- Jordan Smith (Marketing Lead)
INSERT INTO public.users (id, email, full_name, role, org_id, domain_id, is_approved)
VALUES ('aaaaaaaa-0000-0000-0000-000000000022', 'jordan@nexus.com', 'Jordan Smith', 'lead', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000042', true)
ON CONFLICT (id) DO UPDATE SET 
  role = EXCLUDED.role, org_id = EXCLUDED.org_id, domain_id = EXCLUDED.domain_id, is_approved = EXCLUDED.is_approved, full_name = EXCLUDED.full_name;

-- Morgan Lee (Events Lead)
INSERT INTO public.users (id, email, full_name, role, org_id, domain_id, is_approved)
VALUES ('aaaaaaaa-0000-0000-0000-000000000023', 'morgan@nexus.com', 'Morgan Lee', 'lead', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000043', true)
ON CONFLICT (id) DO UPDATE SET 
  role = EXCLUDED.role, org_id = EXCLUDED.org_id, domain_id = EXCLUDED.domain_id, is_approved = EXCLUDED.is_approved, full_name = EXCLUDED.full_name;

-- Riley Kumar (Member Tech)
INSERT INTO public.users (id, email, full_name, role, org_id, domain_id, is_approved)
VALUES ('aaaaaaaa-0000-0000-0000-000000000030', 'member1@nexus.com', 'Riley Kumar', 'member', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000040', true)
ON CONFLICT (id) DO UPDATE SET 
  role = EXCLUDED.role, org_id = EXCLUDED.org_id, domain_id = EXCLUDED.domain_id, is_approved = EXCLUDED.is_approved, full_name = EXCLUDED.full_name;

-- Casey Wong (Member Design)
INSERT INTO public.users (id, email, full_name, role, org_id, domain_id, is_approved)
VALUES ('aaaaaaaa-0000-0000-0000-000000000031', 'member2@nexus.com', 'Casey Wong', 'member', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000041', true)
ON CONFLICT (id) DO UPDATE SET 
  role = EXCLUDED.role, org_id = EXCLUDED.org_id, domain_id = EXCLUDED.domain_id, is_approved = EXCLUDED.is_approved, full_name = EXCLUDED.full_name;

-- Drew Patel (Member Marketing)
INSERT INTO public.users (id, email, full_name, role, org_id, domain_id, is_approved)
VALUES ('aaaaaaaa-0000-0000-0000-000000000032', 'member3@nexus.com', 'Drew Patel', 'member', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000042', true)
ON CONFLICT (id) DO UPDATE SET 
  role = EXCLUDED.role, org_id = EXCLUDED.org_id, domain_id = EXCLUDED.domain_id, is_approved = EXCLUDED.is_approved, full_name = EXCLUDED.full_name;

-- 5. Create Projects
INSERT INTO public.projects (id, name, description, domain_id, created_by, org_id)
VALUES 
('aaaaaaaa-0000-0000-0000-000000000050', 'Next-Gen Portal', 'Building the main club community platform', 'aaaaaaaa-0000-0000-0000-000000000040', 'aaaaaaaa-0000-0000-0000-000000000020', 'aaaaaaaa-0000-0000-0000-000000000001'),
('aaaaaaaa-0000-0000-0000-000000000051', 'Brand Identity 2024', 'Refreshing our visual assets and guidelines', 'aaaaaaaa-0000-0000-0000-000000000041', 'aaaaaaaa-0000-0000-0000-000000000021', 'aaaaaaaa-0000-0000-0000-000000000001'),
('aaaaaaaa-0000-0000-0000-000000000052', 'Spring Recruitment', 'Campaign to attract 50+ new active members', 'aaaaaaaa-0000-0000-0000-000000000042', 'aaaaaaaa-0000-0000-0000-000000000022', 'aaaaaaaa-0000-0000-0000-000000000001'),
('aaaaaaaa-0000-0000-0000-000000000053', 'Annual Hackathon', 'Planning the university-wide tech event', 'aaaaaaaa-0000-0000-0000-000000000043', 'aaaaaaaa-0000-0000-0000-000000000023', 'aaaaaaaa-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- 6. Create Tasks
-- Tech Tasks
INSERT INTO public.tasks (id, title, description, priority, status, project_id, domain_id, created_by, assignee_id, org_id)
VALUES 
('aaaaaaaa-0000-0000-0000-000000000060', 'Fix Supabase Auth Flow', 'Debug the 403 error on profile completion', 'critical', 'in_progress', 'aaaaaaaa-0000-0000-0000-000000000050', 'aaaaaaaa-0000-0000-0000-000000000040', 'aaaaaaaa-0000-0000-0000-000000000020', 'aaaaaaaa-0000-0000-0000-000000000020', 'aaaaaaaa-0000-0000-0000-000000000001'),
('aaaaaaaa-0000-0000-0000-000000000061', 'Landing Page Hero Section', 'Implement the new dark mode glassmorphism design', 'high', 'completed', 'aaaaaaaa-0000-0000-0000-000000000050', 'aaaaaaaa-0000-0000-0000-000000000040', 'aaaaaaaa-0000-0000-0000-000000000020', 'aaaaaaaa-0000-0000-0000-000000000030', 'aaaaaaaa-0000-0000-0000-000000000001'),
('aaaaaaaa-0000-0000-0000-000000000062', 'Database Schema Review', 'Audit the RLS policies for organizational isolation', 'medium', 'pending', 'aaaaaaaa-0000-0000-0000-000000000050', 'aaaaaaaa-0000-0000-0000-000000000040', 'aaaaaaaa-0000-0000-0000-000000000020', 'aaaaaaaa-0000-0000-0000-000000000020', 'aaaaaaaa-0000-0000-0000-000000000001'),
('aaaaaaaa-0000-0000-0000-000000000063', 'Setup Vercel Deployment', 'Configure environmental variables and CI/CD', 'low', 'completed', 'aaaaaaaa-0000-0000-0000-000000000050', 'aaaaaaaa-0000-0000-0000-000000000040', 'aaaaaaaa-0000-0000-0000-000000000020', 'aaaaaaaa-0000-0000-0000-000000000030', 'aaaaaaaa-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Design Tasks
INSERT INTO public.tasks (id, title, description, priority, status, project_id, domain_id, created_by, assignee_id, org_id)
VALUES 
('aaaaaaaa-0000-0000-0000-000000000070', 'Logo Vectorization', 'Convert the hand-drawn logo to SVG format', 'high', 'completed', 'aaaaaaaa-0000-0000-0000-000000000051', 'aaaaaaaa-0000-0000-0000-000000000041', 'aaaaaaaa-0000-0000-0000-000000000021', 'aaaaaaaa-0000-0000-0000-000000000031', 'aaaaaaaa-0000-0000-0000-000000000001'),
('aaaaaaaa-0000-0000-0000-000000000071', 'Design System Audit', 'Check for color consistency across all modules', 'medium', 'in_progress', 'aaaaaaaa-0000-0000-0000-000000000051', 'aaaaaaaa-0000-0000-0000-000000000041', 'aaaaaaaa-0000-0000-0000-000000000021', 'aaaaaaaa-0000-0000-0000-000000000021', 'aaaaaaaa-0000-0000-0000-000000000001'),
('aaaaaaaa-0000-0000-0000-000000000072', 'Recruitment Poster V1', 'Create first draft of recruitment posters', 'high', 'pending', 'aaaaaaaa-0000-0000-0000-000000000051', 'aaaaaaaa-0000-0000-0000-000000000041', 'aaaaaaaa-0000-0000-0000-000000000021', 'aaaaaaaa-0000-0000-0000-000000000031', 'aaaaaaaa-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Marketing Tasks
INSERT INTO public.tasks (id, title, description, priority, status, project_id, domain_id, created_by, assignee_id, org_id)
VALUES 
('aaaaaaaa-0000-0000-0000-000000000080', 'Instagram Launch Post', 'Draft and schedule the launch announcement', 'high', 'completed', 'aaaaaaaa-0000-0000-0000-000000000052', 'aaaaaaaa-0000-0000-0000-000000000042', 'aaaaaaaa-0000-0000-0000-000000000022', 'aaaaaaaa-0000-0000-0000-000000000032', 'aaaaaaaa-0000-0000-0000-000000000001'),
('aaaaaaaa-0000-0000-0000-000000000081', 'Email Newsletter Template', 'Design the weekly club update template', 'medium', 'pending', 'aaaaaaaa-0000-0000-0000-000000000052', 'aaaaaaaa-0000-0000-0000-000000000042', 'aaaaaaaa-0000-0000-0000-000000000022', 'aaaaaaaa-0000-0000-0000-000000000022', 'aaaaaaaa-0000-0000-0000-000000000001'),
('aaaaaaaa-0000-0000-0000-000000000082', 'Sponsorship Prospectus', 'Update the club sponsorship deck for 2024', 'critical', 'in_progress', 'aaaaaaaa-0000-0000-0000-000000000052', 'aaaaaaaa-0000-0000-0000-000000000042', 'aaaaaaaa-0000-0000-0000-000000000022', 'aaaaaaaa-0000-0000-0000-000000000032', 'aaaaaaaa-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Events Tasks
INSERT INTO public.tasks (id, title, description, priority, status, project_id, domain_id, created_by, assignee_id, org_id)
VALUES 
('aaaaaaaa-0000-0000-0000-000000000090', 'Venue Booking', 'Secure the Grand Hall for the Hackathon', 'critical', 'completed', 'aaaaaaaa-0000-0000-0000-000000000053', 'aaaaaaaa-0000-0000-0000-000000000043', 'aaaaaaaa-0000-0000-0000-000000000023', 'aaaaaaaa-0000-0000-0000-000000000023', 'aaaaaaaa-0000-0000-0000-000000000001'),
('aaaaaaaa-0000-0000-0000-000000000091', 'Catering Quotes', 'Get 3 quotes for the 24-hour event', 'medium', 'in_progress', 'aaaaaaaa-0000-0000-0000-000000000053', 'aaaaaaaa-0000-0000-0000-000000000043', 'aaaaaaaa-0000-0000-0000-000000000023', 'aaaaaaaa-0000-0000-0000-000000000023', 'aaaaaaaa-0000-0000-0000-000000000001'),
('aaaaaaaa-0000-0000-0000-000000000092', 'Speaker Outreach', 'Contact potential keynote speakers from industry', 'high', 'pending', 'aaaaaaaa-0000-0000-0000-000000000053', 'aaaaaaaa-0000-0000-0000-000000000043', 'aaaaaaaa-0000-0000-0000-000000000023', 'aaaaaaaa-0000-0000-0000-000000000023', 'aaaaaaaa-0000-0000-0000-000000000001'),
('aaaaaaaa-0000-0000-0000-000000000093', 'Prize Sourcing', 'Acquire prizes for hackathon winners', 'medium', 'pending', 'aaaaaaaa-0000-0000-0000-000000000053', 'aaaaaaaa-0000-0000-0000-000000000043', 'aaaaaaaa-0000-0000-0000-000000000023', 'aaaaaaaa-0000-0000-0000-000000000023', 'aaaaaaaa-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- 7. Verification
SELECT u.full_name, u.role, o.name as org, d.name as domain
FROM public.users u
LEFT JOIN public.organizations o ON u.org_id = o.id
LEFT JOIN public.domains d ON u.domain_id = d.id
WHERE u.org_id IS NOT NULL
ORDER BY u.role, u.full_name;
