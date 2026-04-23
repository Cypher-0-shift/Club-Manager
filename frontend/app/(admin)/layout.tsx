'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthHydration } from '@/hooks/useAuthHydration';
import { useAppStore } from '@/lib/store';
import { AdminShell } from '@/components/admin/AdminShell';
import { EXEC_ROLES, LEAD_AND_ABOVE } from '@/types';

// Admin layout: wraps all admin routes (dashboard, workspace, analytics, users)
// Access: president, vp, secretary, lead
const ADMIN_ROLES = LEAD_AND_ABOVE;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { hydrated } = useAuthHydration();
  const { role } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    if (!role || !ADMIN_ROLES.includes(role)) {
      // Members and unapproved users get redirected to the member board
      router.replace('/board');
    }
  }, [hydrated, role, router]);

  // Show nothing while checking auth / redirecting
  if (!hydrated || !role || !ADMIN_ROLES.includes(role)) {
    return null;
  }

  return <AdminShell>{children}</AdminShell>;
}
