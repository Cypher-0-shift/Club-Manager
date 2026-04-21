import { User } from '@/types';

// Mock users for demo mode (no Supabase needed)
export const MOCK_ADMIN: User = {
  id: 'd06561ad-3d88-4f47-a764-2d25d2be5b3c',
  email: 'admin@clubmanager.demo',
  full_name: 'Admin User',
  role: 'president',
  domain_id: null,
  is_approved: true,
  avatar_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const MOCK_MEMBER: User = {
  id: '192af975-7bb3-48dd-9631-ed8ccc1a3344',
  email: 'member@clubmanager.demo',
  full_name: 'Alex Member',
  role: 'member',
  domain_id: null,
  is_approved: true,
  avatar_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};
