'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
  const pathname = usePathname();
  const isWorkspace = pathname.startsWith('/workspace');
  const isSettings = pathname.startsWith('/settings');
  const isAllowed = !!role && (ADMIN_ROLES.includes(role) || (role === 'member' && (isWorkspace || isSettings)));

  useEffect(() => {
    if (!hydrated) return;
    if (!isAllowed) {
      // Members and unapproved users get redirected to the member board
      router.replace('/board');
    }
  }, [hydrated, isAllowed, router]);

  // Show nothing while checking auth / redirecting
  if (!hydrated || !isAllowed) {
    return null;
  }

  return <AdminShell>{children}</AdminShell>;
}
