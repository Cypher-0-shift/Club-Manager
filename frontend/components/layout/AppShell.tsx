'use client';

import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { MemberSidebar } from '@/components/member/MemberSidebar';
import { TopBar } from './TopBar';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { useAppStore } from '@/lib/store';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { role } = useAppStore();
  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      background: '#000000',
    }}>
      <OfflineBanner />
      {role === 'member' ? <MemberSidebar /> : <AdminSidebar />}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        overflow: 'hidden',
        background: '#000000',
      }}>
        <TopBar />
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '24px',
        }}>
          {children}
        </div>
      </main>
    </div>
  );
}
