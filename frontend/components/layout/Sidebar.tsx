'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Domain, Project } from '@/types';

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
  ChevronLeft,
  GripVertical
} from 'lucide-react';

const EXEC_ROLES = ['president', 'vp', 'secretary'];
const MIN_WIDTH = 220;
const MAX_WIDTH = 480;

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project_id');
  const router = useRouter();
  const { user, role, clearUser } = useAppStore();
  const { toast } = useToast();
  
  const [domainsOpen, setDomainsOpen] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [width, setWidth] = useState(260);
  const [isResizing, setIsResizing] = useState(false);
  
  const sidebarRef = useRef<HTMLElement>(null);

  // Load width from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-width');
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
        localStorage.setItem('sidebar-width', newWidth.toString());
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
    router.push('/');
    toast('Logged out successfully', 'info');
  }

  function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  function getAvatarColor(id: string) {
    const colors = ['#3a3a3a','#444444','#3d3d3d','#424242','#404040','#3e3e3e'];
    return colors[id.charCodeAt(0) % colors.length];
  }

  return (
    <aside 
      ref={sidebarRef}
      style={{
        width: collapsed ? '72px' : `${width}px`,
        minWidth: collapsed ? '72px' : `${width}px`,
        background: '#000000',
        borderRight: '1px solid rgba(255,255,255,0.07)',
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
            position: 'absolute',
            right: '-2px',
            top: 0,
            bottom: 0,
            width: '4px',
            cursor: 'col-resize',
            zIndex: 100,
            background: isResizing ? 'rgba(255,255,255,0.2)' : 'transparent',
            transition: 'background 0.2s',
          }}
          title="Drag to resize"
        />
      )}

      {/* Logo */}
      <div style={{
        height: '56px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
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
              background: '#fff', borderRadius: '6px',
              display: 'grid', placeItems: 'center',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="font-display" style={{ fontWeight: 700, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Club Manager</span>
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
          <span style={{ fontSize: '10px', fontWeight: 600, color: '#525252', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
            {collapsed ? '•••' : 'Menu'}
          </span>
        </div>
        
        <a href="/dashboard" className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`} style={{ justifyContent: collapsed ? 'center' : 'flex-start' }} title={collapsed ? "Dashboard" : undefined}>
          <LayoutDashboard size={16} /> {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Dashboard</span>}
        </a>

        {/* Domains section */}
        <div>
          <div 
            className={`nav-item ${isActive('/workspace') || !!projectId ? 'active' : ''}`}
            style={{ 
              width: '100%', 
              justifyContent: collapsed ? 'center' : 'space-between', 
              borderRadius: 0,
              paddingRight: collapsed ? '0' : '12px'
            }}
            title={collapsed ? "Domains" : undefined}
          >
            <a 
              href="/workspace" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                flex: 1,
                textDecoration: 'none',
                color: 'inherit',
                minWidth: 0
              }}
            >
              <FolderKanban size={16} /> {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Domains</span>}
            </a>
            {!collapsed && (
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDomainsOpen(o => !o); }}
                className="btn-ghost btn-icon btn-sm"
                style={{ padding: '2px', marginLeft: '4px' }}
              >
                {domainsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            )}
          </div>

          {!collapsed && domainsOpen && domains && (
            <div style={{ paddingLeft: '24px', marginTop: '2px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {domains.map((d: Domain) => (
                <a
                  key={d.id}
                  href={`/workspace/${d.id}`}
                  className={`nav-item ${isActive(`/workspace/${d.id}`) || activeDomainId === d.id ? 'active' : ''}`}
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  <span style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: d.color_hex, flexShrink: 0,
                    display: 'inline-block',
                  }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
                </a>
              ))}
            </div>
          )}
        </div>

        <a href="/board" className={`nav-item ${isBoardActive ? 'active' : ''}`} style={{ justifyContent: collapsed ? 'center' : 'flex-start' }} title={collapsed ? "My Board" : undefined}>
          <KanbanSquare size={16} /> {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>My Board</span>}
        </a>

        <a href="/analytics" className={`nav-item ${isActive('/analytics') ? 'active' : ''}`} style={{ justifyContent: collapsed ? 'center' : 'flex-start' }} title={collapsed ? "Analytics" : undefined}>
          <BarChart3 size={16} /> {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Analytics</span>}
        </a>

        {['president', 'vp', 'secretary', 'lead'].includes(role ?? '') && (
          <>
            <div style={{ padding: collapsed ? '16px 8px 8px' : '16px 16px 8px', marginTop: '8px', textAlign: collapsed ? 'center' : 'left' }}>
               <span style={{ fontSize: '10px', fontWeight: 600, color: '#525252', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                 {collapsed ? '•••' : 'Admin'}
               </span>
            </div>
            <a href="/users" className={`nav-item ${isActive('/users') ? 'active' : ''}`} style={{ justifyContent: collapsed ? 'center' : 'flex-start' }} title={collapsed ? "Directory" : undefined}>
              <Users size={16} /> {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Directory</span>}
            </a>
          </>
        )}

        <div style={{ padding: collapsed ? '16px 8px 8px' : '16px 16px 8px', marginTop: 'auto', textAlign: collapsed ? 'center' : 'left' }}>
           <span style={{ fontSize: '10px', fontWeight: 600, color: '#525252', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
             {collapsed ? '•••' : 'System'}
           </span>
        </div>

        <a href="/settings" className={`nav-item ${isActive('/settings') ? 'active' : ''}`} style={{ justifyContent: collapsed ? 'center' : 'flex-start' }} title={collapsed ? "Settings" : undefined}>
          <Settings size={16} /> {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Settings</span>}
        </a>
      </nav>

      {/* User section — pinned to bottom */}
      <div style={{
        padding: '12px',
        borderTop: '1px solid rgba(255,255,255,0.07)',
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
