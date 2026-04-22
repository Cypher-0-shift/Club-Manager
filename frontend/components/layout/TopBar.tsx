'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Project } from '@/types';

export function TopBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project_id');
  const { user, role } = useAppStore();

  const { data: activeProject } = useQuery<Project>({
    queryKey: ['project', projectId],
    queryFn: () => api.get(`/projects/${projectId}`).then(r => r.data),
    enabled: !!projectId,
  });

  function getBreadcrumb(): string {
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length === 0) return 'Home';

    const map: Record<string, string> = {
      dashboard: 'Dashboard',
      board: projectId ? (activeProject?.name ? `${activeProject.name} Board` : 'Project Board') : 'My Board',
      workspace: 'Workspace',
      analytics: 'Analytics',
      users: 'Users',
      settings: 'Settings',
    };

    return parts.map(p => map[p] ?? p).join(' / ');
  }

  return (
    <header style={{
      height: 'var(--topbar-height)',
      borderBottom: '1px solid var(--color-border-subtle)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      gap: '16px',
      position: 'sticky',
      top: 0,
      background: 'var(--color-bg)',
      zIndex: 10,
      flexShrink: 0,
    }}>
      {/* Breadcrumb */}
      <div style={{ flex: 1, fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
        {getBreadcrumb()}
      </div>

      {/* Role badge */}
      {role && (
        <span style={{
          fontSize: '11px',
          fontWeight: 600,
          textTransform: 'capitalize',
          padding: '3px 10px',
          borderRadius: '999px',
          background: 'var(--color-brand-subtle)',
          color: 'var(--color-brand)',
        }}>
          {role}
        </span>
      )}

      {/* User name */}
      {user && (
        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          {user.full_name}
        </span>
      )}
    </header>
  );
}
