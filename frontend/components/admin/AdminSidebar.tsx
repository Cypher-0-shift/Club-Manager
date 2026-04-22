'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Domain, Project } from '@/types';
import { 
  LayoutDashboard, FolderKanban, KanbanSquare as Kanban, 
  BarChart3, Settings, Users, LogOut, ChevronDown, ChevronRight, ChevronLeft
} from 'lucide-react';

const MIN_WIDTH = 220;
const MAX_WIDTH = 480;

export function AdminSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project_id');
  const router = useRouter();
  const { user, role, clearUser } = useAppStore();
  
  const [domainsOpen, setDomainsOpen] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [width, setWidth] = useState(260);
  const [isResizing, setIsResizing] = useState(false);
  
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-width');
    if (saved) setWidth(parseInt(saved, 10));
  }, []);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => setIsResizing(false), []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const newWidth = e.clientX;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setWidth(newWidth); localStorage.setItem('sidebar-width', newWidth.toString());
      }
    }
  }, [isResizing]);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => { window.removeEventListener('mousemove', resize); window.removeEventListener('mouseup', stopResizing); };
  }, [resize, stopResizing]);

  const { data: domains } = useQuery<Domain[]>({
    queryKey: ['domains'],
    queryFn: () => api.get('/domains').then(r => r.data),
    enabled: !!user,
  });

  const { data: activeProject } = useQuery<Project>({
    queryKey: ['project', projectId],
    queryFn: () => api.get(`/projects/${projectId}`).then(r => r.data),
    enabled: !!projectId,
  });

  const activeDomainId = activeProject?.domain_id;
  const isActive = (path: string) => pathname.startsWith(path);
  const isBoardActive = pathname === '/board' && !projectId;

  async function handleLogout() {
    await supabase.auth.signOut();
    clearUser();
    router.push('/login');
  }

  function getInitials(name: string) { return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2); }
  function getAvatarColor(id: string) { return ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444'][id.charCodeAt(0) % 6]; }

  return (
    <aside 
      ref={sidebarRef}
      style={{
        width: collapsed ? '72px' : `${width}px`, minWidth: collapsed ? '72px' : `${width}px`,
        background: 'var(--color-surface)', borderRight: '1px solid var(--color-border-subtle)',
        display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0,
        overflowY: 'auto', transition: isResizing ? 'none' : 'width 0.3s ease, min-width 0.3s ease',
        userSelect: isResizing ? 'none' : 'auto',
      }}
    >
      {!collapsed && (
        <div onMouseDown={startResizing} style={{ position: 'absolute', right: '-2px', top: 0, bottom: 0, width: '4px', cursor: 'col-resize', zIndex: 100, background: isResizing ? 'var(--color-brand)' : 'transparent', transition: 'background 0.2s' }} />
      )}

      <div style={{ height: '56px', borderBottom: '1px solid var(--color-border-subtle)', display: 'flex', alignItems: 'center', padding: collapsed ? '0 12px' : '0 16px', justifyContent: collapsed ? 'center' : 'space-between', gap: '10px', flexShrink: 0 }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div style={{ width: '28px', height: '28px', minWidth: '28px', background: 'var(--color-brand)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: '#fff' }}>C</div>
            <span style={{ fontWeight: 700, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Club Manager</span>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="btn-icon btn-ghost" style={{ padding: '6px', color: 'var(--color-text-secondary)' }} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav style={{ flex: 1, padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ padding: collapsed ? '0 8px' : '0 16px', marginBottom: '8px', textAlign: collapsed ? 'center' : 'left' }}>
          <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{collapsed ? '•••' : 'Menu'}</span>
        </div>
        
        <a href="/dashboard" className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`} style={{ justifyContent: collapsed ? 'center' : 'flex-start' }} title={collapsed ? "Dashboard" : undefined}>
          <LayoutDashboard size={16} /> {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Dashboard</span>}
        </a>

        <div>
          <div className={`nav-item ${isActive('/workspace') || !!projectId ? 'active' : ''}`} style={{ width: '100%', justifyContent: collapsed ? 'center' : 'space-between', borderRadius: 0, paddingRight: collapsed ? '0' : '8px' }} title={collapsed ? "Workspace" : undefined}>
            <a href="/workspace" style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, textDecoration: 'none', color: 'inherit', minWidth: 0 }}>
              <FolderKanban size={16} /> {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Workspace</span>}
            </a>
            {!collapsed && (
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDomainsOpen(o => !o); }} className="btn-ghost btn-icon btn-sm" style={{ padding: '2px', marginLeft: '4px' }}>
                {domainsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            )}
          </div>
          {!collapsed && domainsOpen && domains && (
            <div style={{ paddingLeft: '24px', marginTop: '2px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {domains.map((d: Domain) => (
                <a key={d.id} href={`/workspace/${d.id}`} className={`nav-item ${isActive(`/workspace/${d.id}`) || activeDomainId === d.id ? 'active' : ''}`} style={{ padding: '6px 12px', fontSize: '12px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: d.color_hex, flexShrink: 0, display: 'inline-block' }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
                </a>
              ))}
            </div>
          )}
        </div>

        <a href="/board" className={`nav-item ${isBoardActive ? 'active' : ''}`} style={{ justifyContent: collapsed ? 'center' : 'flex-start' }} title={collapsed ? "Board" : undefined}>
          <Kanban size={16} /> {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Board</span>}
        </a>

        <a href="/analytics" className={`nav-item ${isActive('/analytics') ? 'active' : ''}`} style={{ justifyContent: collapsed ? 'center' : 'flex-start' }} title={collapsed ? "Analytics" : undefined}>
          <BarChart3 size={16} /> {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Analytics</span>}
        </a>

        {role !== 'lead' && (
          <a href="/users" className={`nav-item ${isActive('/users') ? 'active' : ''}`} style={{ justifyContent: collapsed ? 'center' : 'flex-start' }} title={collapsed ? "Users" : undefined}>
            <Users size={16} /> {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Users</span>}
          </a>
        )}

        <div style={{ padding: collapsed ? '16px 8px 8px' : '16px 16px 8px', marginTop: 'auto', textAlign: collapsed ? 'center' : 'left' }}>
           <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{collapsed ? '•••' : 'System'}</span>
        </div>

        <a href="/settings" className={`nav-item ${isActive('/settings') ? 'active' : ''}`} style={{ justifyContent: collapsed ? 'center' : 'flex-start' }} title={collapsed ? "Settings" : undefined}>
          <Settings size={16} /> {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Settings</span>}
        </a>
      </nav>

      {/* User section */}
      <div style={{ padding: '12px', borderTop: '1px solid var(--color-border-subtle)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: collapsed ? 'center' : 'flex-start' }}>
            <div className="avatar" style={{ background: getAvatarColor(user.id), color: '#fff', flexShrink: 0 }} title={collapsed ? `${user.full_name} (${role})` : undefined}>
              {getInitials(user.full_name)}
            </div>
            {!collapsed && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user.full_name}</div>
                <div style={{ fontSize: '11px', color: 'var(--color-brand)', fontWeight: 600, padding: '2px 6px', background: 'var(--color-brand-subtle)', borderRadius: '4px', display: 'inline-block', marginTop: '2px', textTransform: 'capitalize' }}>
                  {role}
                </div>
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
      <style jsx>{`
        .nav-item {
          display: flex; alignItems: center; gap: 10px; padding: 8px 16px; margin: 0 8px; border-radius: var(--radius-sm); color: var(--color-text-secondary); text-decoration: none; font-size: 13px; font-weight: 500; transition: background 0.15s, color 0.15s; cursor: pointer;
        }
        .nav-item:hover { background: var(--color-surface-hover); color: var(--color-text-primary); }
        .nav-item.active { background: var(--color-brand-subtle); color: var(--color-brand); border-left: 3px solid var(--color-brand); padding-left: 13px; }
      `}</style>
    </aside>
  );
}
