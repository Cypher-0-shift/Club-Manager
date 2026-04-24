'use client';

import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Project, Domain, Task } from '@/types';
import { Bell, LogOut, User as UserIcon, X, Check } from 'lucide-react';
import { useState } from 'react';

export function TopBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project_id');
  const { user, role, clearUser } = useAppStore();
  const router = useRouter();
  const qc = useQueryClient();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

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

  // Notifications
  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data),
    enabled: !!user,
    refetchInterval: 30000, // Poll every 30s
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const readMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const readAllMutation = useMutation({
    mutationFn: () => api.post('/notifications/read-all', {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

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

  const handleLogout = async () => {
    const { supabase } = await import('@/lib/supabase');
    await supabase.auth.signOut();
    localStorage.removeItem('ctm-auth');
    clearUser();
    router.push('/');
  };

  return (
    <header style={{
      height: 'var(--topbar-height)',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      gap: '16px',
      position: 'sticky',
      top: 0,
      background: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(12px)',
      zIndex: 50,
      flexShrink: 0,
    }}>
      {/* Breadcrumb */}
      <div style={{ flex: 1, fontSize: '13px', color: '#a3a3a3', fontWeight: 500, fontFamily: 'Satoshi, sans-serif', letterSpacing: '0.02em' }}>
        {getBreadcrumb()}
      </div>

      {/* Right Side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        
        <div style={{ position: 'relative' }}>
          <button 
            className="btn-icon btn-ghost" 
            title="Notifications"
            onClick={() => setNotifOpen(!notifOpen)}
            style={{ position: 'relative' }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span 
                style={{ 
                  position: 'absolute', top: '8px', right: '8px', 
                  width: '8px', height: '8px', borderRadius: '50%', 
                  background: 'var(--color-critical)',
                  border: '2px solid #000',
                }} 
              />
            )}
          </button>

          {notifOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setNotifOpen(false)} />
              <div style={{ 
                position: 'absolute', top: '100%', right: 0, marginTop: '8px', 
                width: '320px', maxHeight: '400px', padding: '16px', zIndex: 100,
                display: 'flex', flexDirection: 'column', gap: '12px',
                background: '#111',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '20px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                overflowY: 'auto'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700 }}>Notifications</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {unreadCount > 0 && (
                      <button 
                        style={{ fontSize: '11px', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer' }}
                        onClick={() => readAllMutation.mutate()}
                      >
                        Mark all read
                      </button>
                    )}
                    <button className="btn-icon btn-ghost btn-sm" onClick={() => setNotifOpen(false)}>
                      <X size={14} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#525252', fontSize: '13px' }}>
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div 
                        key={n.id} 
                        style={{ 
                          padding: '12px', borderRadius: '12px', 
                          background: n.is_read ? 'transparent' : 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.05)',
                          display: 'flex', flexDirection: 'column', gap: '4px',
                          cursor: 'pointer', position: 'relative'
                        }}
                        onClick={() => !n.is_read && readMutation.mutate(n.id)}
                      >
                        {!n.is_read && (
                          <div style={{ position: 'absolute', left: '4px', top: '16px', width: '4px', height: '4px', borderRadius: '50%', background: 'var(--color-primary)' }} />
                        )}
                        <div style={{ fontSize: '13px', fontWeight: 600, color: n.is_read ? '#a3a3a3' : '#fff' }}>{n.title}</div>
                        <div style={{ fontSize: '12px', color: '#737373', lineHeight: 1.4 }}>{n.message}</div>
                        <div style={{ fontSize: '10px', color: '#404040', marginTop: '4px' }}>
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {role && (
          <span style={{
            fontSize: '10px',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            padding: '4px 14px',
            borderRadius: '999px',
            background: 'rgba(255,255,255,0.06)',
            color: '#a3a3a3',
            border: '1px solid rgba(255,255,255,0.08)',
            fontFamily: 'Satoshi, sans-serif',
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
              <div className="avatar avatar-sm" style={{ background: '#2a2a2a', color: '#e5e5e5' }}>
                {user.full_name[0]}
              </div>
              <span style={{ fontSize: '13px', fontWeight: 500 }}>{user.full_name}</span>
            </button>

            {dropdownOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setDropdownOpen(false)} />
                <div style={{ 
                  position: 'absolute', top: '100%', right: 0, marginTop: '8px', 
                  width: '200px', padding: '6px', zIndex: 100,
                  display: 'flex', flexDirection: 'column', gap: '2px',
                  background: '#171717',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '16px',
                }}>
                  <button className="btn btn-ghost" style={{ justifyContent: 'flex-start', padding: '8px 12px' }} onClick={() => { setDropdownOpen(false); router.push('/settings'); }}>
                    <UserIcon size={14} /> Profile & Settings
                  </button>
                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '4px 0' }} />
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
