'use client';

import { AppShell } from '@/components/layout/AppShell';
import { AdminBoard } from '@/components/admin/AdminBoard';
import { MemberBoard } from '@/components/member/MemberBoard';
import { useAppStore } from '@/lib/store';
import { useAuthHydration } from '@/hooks/useAuthHydration';

export default function UnifiedBoardPage() {
  const { hydrated } = useAuthHydration();
  const { role } = useAppStore();

  if (!hydrated) return null;

  return (
    <AppShell>
      {role === 'member' ? <MemberBoard /> : <AdminBoard />}
    </AppShell>
  );
}
