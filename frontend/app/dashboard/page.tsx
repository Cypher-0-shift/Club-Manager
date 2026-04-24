'use client';

import { AppShell } from '@/components/layout/AppShell';
import { useAppStore } from '@/lib/store';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { MemberDashboard } from '@/components/member/MemberDashboard';
import { useAuthHydration } from '@/hooks/useAuthHydration';

export default function DashboardPage() {
  const { hydrated } = useAuthHydration();
  const { role } = useAppStore();

  if (!hydrated) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--color-bg)',
      }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!role) return null;

  const renderDashboard = () => {
    switch (role) {
      case 'president':
      case 'vp':
      case 'secretary':
      case 'lead':
        return <AdminDashboard />;
      default:
        return <MemberDashboard />;
    }
  };

  return <AppShell>{renderDashboard()}</AppShell>;
}
