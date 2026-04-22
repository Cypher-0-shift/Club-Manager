'use client';

import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Project, Domain, Task } from '@/types';
import { Search, Bell, LogOut, User as UserIcon } from 'lucide-react';
import { useState } from 'react';

export function TopBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project_id');
  const { user, role, clearUser } = useAppStore();
  const router = useRouter();

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { data: activeProject } = useQuery<Project>({
    queryKey: ['project', projectId],
    queryFn: () => api.get(`/projects/${projectId}`).then(r => r.data),
    enabled: !!projectId,
  });

  const domainId = activeProject?.domain_id || (pathname.startsWith('/workspace/') ? pathname.split('/').pop() : null);

  const { data: activeDomain } = useQuery<Domain>({
    queryKey: ['domain', domainId],
    queryFn: () => api.get(`/domains/${domainId}`).then(r => r.data),
    enabled: !!domainId && domainId !== 'workspace' && domainId !== 'new',
  });

  // Fetch overdue count
  const { data: myTasks = [] } = useQuery<Task[]>({
    queryKey: role === 'member' ? ['my-tasks'] : ['tasks', 'domain', user?.domain_id],
    queryFn: () => api.get(role === 'member' ? '/tasks/my' : (user?.domain_id ? `/tasks?domain_id=${user.domain_id}` : '/tasks?limit=200')).then(r => r.data),
    enabled: !!user,
  });

  const overdueCount = myTasks.filter((t: Task) => (t.is_overdue || t.status === 'overdue') && (role === 'member' ? true : t.status !== 'completed')).length;

  function getBreadcrumb(): string {
    if (pathname === '/dashboard') return 'Dashboard';
    if (pathname === '/workspace') return 'Workspace';
    if (pathname.startsWith('/workspace/') && activeDomain) return `Workspace / ${activeDomain.name}`;
    if (pathname === '/board') {
      if (projectId && activeProject && activeDomain) return `${activeDomain.name} / ${activeProject.name} / Board`;
      return 'My Board';
    }
    if (pathname === '/analytics') return 'Analytics';
    if (pathname === '/users') return 'User Management';
    if (pathname === '/settings') return 'Settings';
    
    const parts = pathname.split('/').filter(Boolean);
    return parts.length > 0 ? parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' / ') : 'Home';
  }

  const handleLogout = () => {
    localStorage.removeItem('ctm-auth');
    clearUser();
    router.push('/login');
  };

  const roleColors: Record<string, string> = {
    president: 'var(--color-critical)',
    vp: 'var(--color-brand)',
    secretary: 'var(--color-pending)',
    lead: 'var(--color-completed)',
    member: 'var(--color-text-secondary)',
  };

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
      background: 'rgba(15, 15, 19, 0.8)',
      backdropFilter: 'blur(12px)',
      zIndex: 50,
      flexShrink: 0,
    }}>
      {/* Breadcrumb */}
      <div style={{ flex: 1, fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
        {getBreadcrumb()}
      </div>

      {/* Right Side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button className="btn-icon btn-ghost" title="Search (Cmd+K)">
          <Search size={18} />
        </button>
        
        <div style={{ position: 'relative' }}>
          <button className="btn-icon btn-ghost" title="Notifications">
            <Bell size={18} />
          </button>
          {overdueCount > 0 && (
            <span 
              className="overdue-count-badge" 
              style={{ 
                position: 'absolute', top: '2px', right: '4px', 
                width: '8px', height: '8px', borderRadius: '50%', 
              }} 
            />
          )}
        </div>

        {role && (
          <span style={{
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'capitalize',
            padding: '4px 12px',
            borderRadius: '999px',
            background: `color-mix(in srgb, ${roleColors[role]} 15%, transparent)`,
            color: roleColors[role],
            border: `1px solid color-mix(in srgb, ${roleColors[role]} 30%, transparent)`,
          }}>
            {role}
          </span>
        )}

        {user && (
          <div style={{ position: 'relative' }}>
            <button 
              className="btn-ghost" 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px', borderRadius: 'var(--radius-sm)' }}
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <div className="avatar avatar-sm" style={{ background: 'var(--color-surface-hover)', color: 'var(--color-text-primary)' }}>
                {user.full_name[0]}
              </div>
              <span style={{ fontSize: '13px', fontWeight: 500 }}>{user.full_name}</span>
            </button>

            {dropdownOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setDropdownOpen(false)} />
                <div className="card glass" style={{ 
                  position: 'absolute', top: '100%', right: 0, marginTop: '8px', 
                  width: '200px', padding: '8px', zIndex: 100,
                  display: 'flex', flexDirection: 'column', gap: '4px'
                }}>
                  <button className="btn btn-ghost" style={{ justifyContent: 'flex-start', padding: '8px 12px' }} onClick={() => { setDropdownOpen(false); router.push('/settings'); }}>
                    <UserIcon size={14} /> Profile & Settings
                  </button>
                  <div style={{ height: '1px', background: 'var(--color-border-subtle)', margin: '4px 0' }} />
                  <button className="btn btn-ghost" style={{ justifyContent: 'flex-start', padding: '8px 12px', color: 'var(--color-overdue)' }} onClick={handleLogout}>
                    <LogOut size={14} /> Log out
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
