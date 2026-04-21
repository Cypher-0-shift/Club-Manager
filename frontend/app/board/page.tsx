'use client';

import { AppShell } from '@/components/layout/AppShell';
import { BoardProvider } from '@/components/board/BoardProvider';
import { useAppStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function BoardPage() {
  const { role } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    if (!role) router.push('/');
  }, [role]);

  if (!role) return null;

  return (
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="section-title" style={{ fontSize: '18px' }}>Task Board</h1>
            <p className="section-subtitle">Drag tasks between columns to update their status</p>
          </div>
        </div>
        <BoardProvider />
      </div>
    </AppShell>
  );
}
