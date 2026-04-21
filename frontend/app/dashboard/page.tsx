'use client';

import { AppShell } from '@/components/layout/AppShell';
import { useAppStore } from '@/lib/store';
import { DashboardPresident, DashboardMember, DashboardLead } from '@/components/dashboard/DashboardViews';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { user, role } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    // If no role set, redirect to landing page
    if (!role) router.push('/');
  }, [role]);

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

  if (!role) return null;

  return <AppShell>{renderDashboard()}</AppShell>;
}
