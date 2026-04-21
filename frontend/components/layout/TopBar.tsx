'use client';

import { usePathname } from 'next/navigation';
import { useAppStore } from '@/lib/store';

function getBreadcrumb(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return 'Home';
  const map: Record<string, string> = {
    dashboard: 'Dashboard',
    board: 'My Board',
    workspace: 'Workspace',
    analytics: 'Analytics',
    users: 'Users',
    settings: 'Settings',
  };
  return parts.map(p => map[p] ?? p).join(' / ');
}

export function TopBar() {
  const pathname = usePathname();
  const { user, role } = useAppStore();

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
      <div style={{ flex: 1, fontSize: '13px', color: 'var(--color-text-secondary)' }}>
        {getBreadcrumb(pathname)}
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
