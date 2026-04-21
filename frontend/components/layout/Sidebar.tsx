'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Domain } from '@/types';

const EXEC_ROLES = ['president', 'vp', 'secretary'];

function NavIcon({ name }: { name: string }) {
  const icons: Record<string, string> = {
    dashboard: '⊞',
    domains: '◈',
    board: '⊟',
    analytics: '◉',
    settings: '⚙',
    users: '◎',
    projects: '▦',
  };
  return <span style={{ fontSize: '15px', lineHeight: 1 }}>{icons[name] ?? '•'}</span>;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, clearUser } = useAppStore();
  const { toast } = useToast();
  const [domainsOpen, setDomainsOpen] = useState(true);

  const { data: domains } = useQuery<Domain[]>({
    queryKey: ['domains'],
    queryFn: () => api.get('/domains').then(r => r.data),
    enabled: !!user,
  });

  const isActive = (path: string) => pathname.startsWith(path);

  async function handleLogout() {
    await supabase.auth.signOut();
    clearUser();
    router.push('/login');
    toast('Logged out successfully', 'info');
  }

  function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  function getAvatarColor(id: string) {
    const colors = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444'];
    const i = id.charCodeAt(0) % colors.length;
    return colors[i];
  }

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      minWidth: 'var(--sidebar-width)',
      background: 'var(--color-surface)',
      borderRight: '1px solid var(--color-border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{
        height: '56px',
        borderBottom: '1px solid var(--color-border-subtle)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: '10px',
        flexShrink: 0,
      }}>
        <div style={{
          width: '28px', height: '28px',
          background: 'var(--color-brand)',
          borderRadius: '6px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', fontWeight: 700, color: '#fff',
        }}>C</div>
        <span style={{ fontWeight: 700, fontSize: '14px' }}>Club Manager</span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <a href="/dashboard" className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}>
          <NavIcon name="dashboard" /> Dashboard
        </a>

        {/* Domains section */}
        <div>
          <button
            className={`nav-item ${isActive('/workspace') ? 'active' : ''}`}
            style={{ width: '100%', justifyContent: 'space-between' }}
            onClick={() => setDomainsOpen(o => !o)}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <NavIcon name="domains" /> Domains
            </span>
            <span style={{ fontSize: '10px', opacity: 0.6 }}>{domainsOpen ? '▾' : '▸'}</span>
          </button>

          {domainsOpen && domains && (
            <div style={{ paddingLeft: '16px', marginTop: '2px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
              {domains.map(d => (
                <a
                  key={d.id}
                  href={`/workspace/${d.id}`}
                  className={`nav-item ${isActive(`/workspace/${d.id}`) ? 'active' : ''}`}
                  style={{ padding: '6px 10px', fontSize: '12px' }}
                >
                  <span style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: d.color_hex, flexShrink: 0,
                    display: 'inline-block',
                  }} />
                  {d.name}
                </a>
              ))}
            </div>
          )}
        </div>

        <a href="/board" className={`nav-item ${isActive('/board') ? 'active' : ''}`}>
          <NavIcon name="board" /> My Board
        </a>

        {EXEC_ROLES.includes(role ?? '') && (
          <>
            <a href="/analytics" className={`nav-item ${isActive('/analytics') ? 'active' : ''}`}>
              <NavIcon name="analytics" /> Analytics
            </a>
            <a href="/users" className={`nav-item ${isActive('/users') ? 'active' : ''}`}>
              <NavIcon name="users" /> Users
            </a>
          </>
        )}

        <div className="divider" style={{ margin: '8px 0' }} />

        <a href="/settings" className={`nav-item ${isActive('/settings') ? 'active' : ''}`}>
          <NavIcon name="settings" /> Settings
        </a>
      </nav>

      {/* User section — pinned to bottom */}
      <div style={{
        padding: '12px',
        borderTop: '1px solid var(--color-border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              className="avatar"
              style={{ background: getAvatarColor(user.id), color: '#fff' }}
            >
              {getInitials(user.full_name)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {user.full_name}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
                {user.role}
              </div>
            </div>
            <button
              className="btn-icon btn-ghost"
              onClick={handleLogout}
              title="Sign out"
              style={{ fontSize: '13px' }}
            >
              ⇥
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
