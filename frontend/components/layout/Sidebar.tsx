'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Domain } from '@/types';

import { 
  LayoutDashboard, 
  FolderKanban, 
  KanbanSquare, 
  BarChart3, 
  Settings, 
  Users, 
  LogOut,
  ChevronDown,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

const EXEC_ROLES = ['president', 'vp', 'secretary'];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, clearUser } = useAppStore();
  const { toast } = useToast();
  const [domainsOpen, setDomainsOpen] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

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
      width: collapsed ? '72px' : 'var(--sidebar-width)',
      minWidth: collapsed ? '72px' : 'var(--sidebar-width)',
      background: 'var(--color-surface)',
      borderRight: '1px solid var(--color-border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      overflowY: 'auto',
      transition: 'width 0.3s ease, min-width 0.3s ease',
    }}>
      {/* Logo */}
      <div style={{
        height: '56px',
        borderBottom: '1px solid var(--color-border-subtle)',
        display: 'flex',
        alignItems: 'center',
        padding: collapsed ? '0 12px' : '0 16px',
        justifyContent: collapsed ? 'center' : 'space-between',
        gap: '10px',
        flexShrink: 0,
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div style={{
              width: '28px', height: '28px', minWidth: '28px',
              background: 'var(--color-brand)',
              borderRadius: '6px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', fontWeight: 700, color: '#fff',
            }}>C</div>
            <span style={{ fontWeight: 700, fontSize: '14px', whiteSpace: 'nowrap' }}>Club Manager</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="btn-icon btn-ghost"
          style={{ padding: '6px', color: 'var(--color-text-secondary)' }}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ padding: collapsed ? '0 8px' : '0 16px', marginBottom: '8px', textAlign: collapsed ? 'center' : 'left' }}>
          <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {collapsed ? '•••' : 'Menu'}
          </span>
        </div>
        
        <a href="/dashboard" className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`} style={{ justifyContent: collapsed ? 'center' : 'flex-start' }} title={collapsed ? "Dashboard" : undefined}>
          <LayoutDashboard size={16} /> {!collapsed && "Dashboard"}
        </a>

        {/* Domains section */}
        <div>
          <button
            className={`nav-item ${isActive('/workspace') ? 'active' : ''}`}
            style={{ width: '100%', justifyContent: collapsed ? 'center' : 'space-between', borderRadius: 0 }}
            onClick={() => {
               if (collapsed) setCollapsed(false);
               else setDomainsOpen(o => !o);
            }}
            title={collapsed ? "Domains" : undefined}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: collapsed ? 'center' : 'flex-start' }}>
              <FolderKanban size={16} /> {!collapsed && "Domains"}
            </span>
            {!collapsed && (domainsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
          </button>

          {!collapsed && domainsOpen && domains && (
            <div style={{ paddingLeft: '24px', marginTop: '2px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {domains.map((d: Domain) => (
                <a
                  key={d.id}
                  href={`/workspace/${d.id}`}
                  className={`nav-item ${isActive(`/workspace/${d.id}`) ? 'active' : ''}`}
                  style={{ padding: '6px 12px', fontSize: '12px' }}
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

        <a href="/board" className={`nav-item ${isActive('/board') ? 'active' : ''}`} style={{ justifyContent: collapsed ? 'center' : 'flex-start' }} title={collapsed ? "My Board" : undefined}>
          <KanbanSquare size={16} /> {!collapsed && "My Board"}
        </a>

        {EXEC_ROLES.includes(role ?? '') && (
          <>
            <div style={{ padding: collapsed ? '16px 8px 8px' : '16px 16px 8px', marginTop: '8px', textAlign: collapsed ? 'center' : 'left' }}>
               <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                 {collapsed ? '•••' : 'Admin'}
               </span>
            </div>
            <a href="/analytics" className={`nav-item ${isActive('/analytics') ? 'active' : ''}`} style={{ justifyContent: collapsed ? 'center' : 'flex-start' }} title={collapsed ? "Analytics" : undefined}>
              <BarChart3 size={16} /> {!collapsed && "Analytics"}
            </a>
            <a href="/users" className={`nav-item ${isActive('/users') ? 'active' : ''}`} style={{ justifyContent: collapsed ? 'center' : 'flex-start' }} title={collapsed ? "Directory" : undefined}>
              <Users size={16} /> {!collapsed && "Directory"}
            </a>
          </>
        )}

        <div style={{ padding: collapsed ? '16px 8px 8px' : '16px 16px 8px', marginTop: 'auto', textAlign: collapsed ? 'center' : 'left' }}>
           <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
             {collapsed ? '•••' : 'System'}
           </span>
        </div>

        <a href="/settings" className={`nav-item ${isActive('/settings') ? 'active' : ''}`} style={{ justifyContent: collapsed ? 'center' : 'flex-start' }} title={collapsed ? "Settings" : undefined}>
          <Settings size={16} /> {!collapsed && "Settings"}
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
                <div style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {user.full_name}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
                  {user.role}
                </div>
              </div>
            )}
            {!collapsed && (
              <button
                className="btn-icon btn-ghost"
                onClick={handleLogout}
                title="Sign out"
                style={{ padding: '6px', color: 'var(--color-text-secondary)' }}
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        )}
        {user && collapsed && (
          <button
            className="btn-icon btn-ghost"
            onClick={handleLogout}
            title="Sign out"
            style={{ padding: '6px', color: 'var(--color-text-secondary)', alignSelf: 'center' }}
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </aside>
  );
}
