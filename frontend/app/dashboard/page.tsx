'use client';

import { AppShell } from '@/components/layout/AppShell';
import { useAppStore } from '@/lib/store';
import { DashboardPresident, DashboardMember, DashboardLead } from '@/components/dashboard/DashboardViews';
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
        return <DashboardPresident />;
      case 'lead':
        return <DashboardLead />;
      default:
        return <DashboardMember />;
    }
  };

  return <AppShell>{renderDashboard()}</AppShell>;
}
