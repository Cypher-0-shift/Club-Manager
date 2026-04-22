'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { TopBar } from '@/components/layout/TopBar';

import {
  KanbanSquare,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

const MIN_WIDTH = 200;
const MAX_WIDTH = 360;

export function MemberShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearUser } = useAppStore();
  const { toast } = useToast();

  const [collapsed, setCollapsed] = useState(false);
  const [width, setWidth] = useState(240);
  const [isResizing, setIsResizing] = useState(false);

  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('member-sidebar-width');
    if (saved) setWidth(parseInt(saved, 10));
  }, []);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const newWidth = e.clientX;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setWidth(newWidth);
        localStorage.setItem('member-sidebar-width', newWidth.toString());
      }
    }
  }, [isResizing]);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

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
    const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
    return colors[id.charCodeAt(0) % colors.length];
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--color-bg)' }}>
      <OfflineBanner />

      {/* ── Member Sidebar ── */}
      <aside
        ref={sidebarRef}
        style={{
          width: collapsed ? '72px' : `${width}px`,
          minWidth: collapsed ? '72px' : `${width}px`,
          background: 'var(--color-surface)',
          borderRight: '1px solid var(--color-border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          position: 'sticky',
          top: 0,
          overflowY: 'auto',
          transition: isResizing ? 'none' : 'width 0.3s ease, min-width 0.3s ease',
          userSelect: isResizing ? 'none' : 'auto',
        }}
      >
        {/* Resize Handle */}
        {!collapsed && (
          <div
            onMouseDown={startResizing}
            style={{
              position: 'absolute', right: '-2px', top: 0, bottom: 0,
              width: '4px', cursor: 'col-resize', zIndex: 100,
              background: isResizing ? 'var(--color-brand)' : 'transparent',
              transition: 'background 0.2s',
            }}
            title="Drag to resize"
          />
        )}

        {/* Logo */}
        <div style={{
          height: '56px',
          borderBottom: '1px solid var(--color-border-subtle)',
          display: 'flex', alignItems: 'center',
          padding: collapsed ? '0 12px' : '0 16px',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: '10px', flexShrink: 0,
        }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <div style={{
                width: '28px', height: '28px', minWidth: '28px',
                background: 'var(--color-brand)', borderRadius: '6px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: 700, color: '#fff',
              }}>C</div>
              <span style={{ fontWeight: 700, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Club Manager</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="btn-icon btn-ghost"
            style={{ padding: '6px', color: 'var(--color-text-secondary)' }}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ padding: collapsed ? '0 8px' : '0 16px', marginBottom: '8px', textAlign: collapsed ? 'center' : 'left' }}>
            <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {collapsed ? '•••' : 'My Space'}
            </span>
          </div>

          <a href="/board" className={`nav-item ${pathname === '/board' ? 'active' : ''}`} style={{ justifyContent: collapsed ? 'center' : 'flex-start' }} title={collapsed ? 'My Board' : undefined}>
            <KanbanSquare size={16} /> {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>My Board</span>}
          </a>

          <a href="/analytics" className={`nav-item ${isActive('/analytics') ? 'active' : ''}`} style={{ justifyContent: collapsed ? 'center' : 'flex-start' }} title={collapsed ? 'My Analytics' : undefined}>
            <BarChart3 size={16} /> {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>My Analytics</span>}
          </a>

          {/* System */}
          <div style={{ padding: collapsed ? '16px 8px 8px' : '16px 16px 8px', marginTop: 'auto', textAlign: collapsed ? 'center' : 'left' }}>
            <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {collapsed ? '•••' : 'System'}
            </span>
          </div>

          <a href="/settings" className={`nav-item ${isActive('/settings') ? 'active' : ''}`} style={{ justifyContent: collapsed ? 'center' : 'flex-start' }} title={collapsed ? 'Settings' : undefined}>
            <Settings size={16} /> {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Settings</span>}
          </a>
        </nav>

        {/* User section */}
        <div style={{ padding: '12px', borderTop: '1px solid var(--color-border-subtle)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: collapsed ? 'center' : 'flex-start' }}>
              <div
                className="avatar"
                style={{ background: getAvatarColor(user.id), color: '#fff', flexShrink: 0 }}
                title={collapsed ? `${user.full_name} (${user.role})` : undefined}
              >
                {getInitials(user.full_name)}
              </div>
              {!collapsed && (
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user.full_name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>Member</div>
                </div>
              )}
              {!collapsed && (
                <button className="btn-icon btn-ghost" onClick={handleLogout} title="Sign out" style={{ padding: '6px', color: 'var(--color-text-secondary)' }}>
                  <LogOut size={16} />
                </button>
              )}
            </div>
          )}
          {user && collapsed && (
            <button className="btn-icon btn-ghost" onClick={handleLogout} title="Sign out" style={{ padding: '6px', color: 'var(--color-text-secondary)', alignSelf: 'center' }}>
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <TopBar />
        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
