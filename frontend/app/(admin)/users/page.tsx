'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAppStore } from '@/lib/store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { User, Domain } from '@/types';
import { SkeletonCard } from '@/components/dashboard/StatCard';
import { useAuthHydration } from '@/hooks/useAuthHydration';
import { Search } from 'lucide-react';

const ROLE_OPTIONS = ['president','vp','secretary','lead','member'];

export default function UsersPage() {
  const { hydrated } = useAuthHydration();
  const { role, user } = useAppStore();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<'pending'|'members'|'roles'>('pending');
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState('all');

  const isAdmin = ['president','vp','secretary','lead'].includes(role ?? '');
  const isPresident = role === 'president';

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['all-users'],
    queryFn: () => api.get('/users').then(r => r.data),
    enabled: hydrated && isAdmin,
  });

  const { data: domains = [] } = useQuery<Domain[]>({
    queryKey: ['all-domains'],
    queryFn: () => api.get('/domains').then(r => r.data),
    enabled: hydrated && isAdmin,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/users/${id}`, { is_approved: true }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['all-users'] }); toast('User approved', 'success'); },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, newRole }: { id: string; newRole: string }) => api.patch(`/users/${id}`, { role: newRole }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['all-users'] }); toast('Role updated', 'success'); },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  if (!hydrated) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--color-bg)' }}><div className="spinner" /></div>;
  }

  if (!isAdmin) {
    return <AppShell><div style={{ color: 'var(--color-text-muted)', padding: '24px' }}>Access denied</div></AppShell>;
  }

  const domainMap = Object.fromEntries(domains.map(d => [d.id, d.name]));
  const domainColorMap = Object.fromEntries(domains.map(d => [d.id, d.color_hex]));

  const pending = users.filter(u => !u.is_approved);
  const approved = users.filter(u => u.is_approved && 
    (search === '' || u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())) &&
    (domainFilter === 'all' || u.domain_id === domainFilter)
  );

  return (
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#e5e5e5' }}>User Management</h1>
          <p className="section-subtitle">Manage organization access and roles</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <button 
            className={`btn btn-ghost ${activeTab === 'pending' ? 'btn-primary' : ''}`} 
            onClick={() => setActiveTab('pending')}
            style={{ borderRadius: '4px 4px 0 0', paddingBottom: '12px', borderBottom: activeTab === 'pending' ? '2px solid rgba(255,255,255,0.4)' : 'none', color: activeTab === 'pending' ? '#e5e5e5' : undefined }}
          >
            Pending Approval {pending.length > 0 && <span className="badge badge-pending" style={{ marginLeft: '6px' }}>{pending.length}</span>}
          </button>
          <button 
            className={`btn btn-ghost ${activeTab === 'members' ? 'btn-primary' : ''}`} 
            onClick={() => setActiveTab('members')}
            style={{ borderRadius: '4px 4px 0 0', paddingBottom: '12px', borderBottom: activeTab === 'members' ? '2px solid rgba(255,255,255,0.4)' : 'none', color: activeTab === 'members' ? '#e5e5e5' : undefined }}
          >
            All Members
          </button>
          {isPresident && (
            <button 
              className={`btn btn-ghost ${activeTab === 'roles' ? 'btn-primary' : ''}`} 
              onClick={() => setActiveTab('roles')}
              style={{ borderRadius: '4px 4px 0 0', paddingBottom: '12px', borderBottom: activeTab === 'roles' ? '2px solid rgba(255,255,255,0.4)' : 'none', color: activeTab === 'roles' ? '#e5e5e5' : undefined }}
            >
              Roles & Permissions
            </button>
          )}
        </div>

        {/* Pending Approval Tab */}
        {activeTab === 'pending' && (
          <div>
            {pending.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-muted)' }}>
                No pending users to approve.
              </div>
            ) : (
              <div style={{ padding: 0, overflow: 'hidden', background: '#262626', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px' }}>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr><th>Name</th><th>Email</th><th>Requested Role</th><th>Domain</th><th>Signed Up</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {pending.map(u => {
                        const canApprove = isPresident || user?.domain_id === u.domain_id;
                        return (
                          <tr key={u.id}>
                            <td style={{ fontWeight: 500 }}>{u.full_name}</td>
                            <td style={{ color: 'var(--color-text-muted)' }}>{u.email}</td>
                            <td><span style={{ background: 'rgba(255,255,255,0.06)', color: '#a3a3a3', fontSize: '11px', padding: '2px 8px', borderRadius: '5px', textTransform: 'capitalize', display: 'inline-flex' }}>{u.role}</span></td>
                            <td>{domainMap[u.domain_id || ''] || '—'}</td>
                            <td style={{ color: 'var(--color-text-muted)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                            <td>
                              {canApprove ? (
                                <button
                                  className="btn btn-sm btn-primary"
                                  onClick={() => approveMutation.mutate(u.id)}
                                  disabled={approveMutation.isPending}
                                >
                                  Approve
                                </button>
                              ) : (
                                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>No access</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* All Members Tab */}
        {activeTab === 'members' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input className="form-input" placeholder="Search members..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '36px' }} />
              </div>
              <select className="form-input" value={domainFilter} onChange={e => setDomainFilter(e.target.value)} style={{ width: 'auto' }}>
                <option value="all">All Domains</option>
                {domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>{[0,1,2].map(i => <SkeletonCard key={i} />)}</div>
            ) : (
              <div style={{ padding: 0, overflow: 'hidden', background: '#262626', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px' }}>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr><th>Member</th><th>Email</th><th>Role</th><th>Domain</th><th>Status</th><th>Joined</th></tr>
                    </thead>
                    <tbody>
                      {approved.map(u => (
                        <tr key={u.id}>
                          <td style={{ fontWeight: 500 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div className="avatar avatar-xs" style={{ background: domainColorMap[u.domain_id || ''] }}>{u.full_name[0]}</div>
                              {u.full_name}
                            </div>
                          </td>
                          <td style={{ color: 'var(--color-text-muted)' }}>{u.email}</td>
                          <td>
                            {isPresident ? (
                              <select
                                value={u.role}
                                className="form-input"
                                style={{ padding: '4px 8px', fontSize: '12px', width: 'auto' }}
                                onChange={e => roleMutation.mutate({ id: u.id, newRole: e.target.value })}
                                disabled={u.id === user?.id}
                              >
                                {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                              </select>
                            ) : (
                              <span style={{ background: 'rgba(255,255,255,0.06)', color: '#a3a3a3', fontSize: '11px', padding: '2px 8px', borderRadius: '5px', textTransform: 'capitalize', display: 'inline-flex' }}>{u.role}</span>
                            )}
                          </td>
                          <td style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>
                            {domainMap[u.domain_id || ''] || '—'}
                          </td>
                          <td><span style={{ background: 'rgba(255,255,255,0.04)', color: '#525252', border: '1px solid rgba(255,255,255,0.07)', fontSize: '11px', padding: '2px 8px', borderRadius: '5px' }}>Active</span></td>
                          <td style={{ color: 'var(--color-text-muted)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                      {approved.length === 0 && (
                        <tr><td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No members match your search.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Roles & Permissions Tab */}
        {activeTab === 'roles' && isPresident && (
          <div style={{ padding: 0, overflow: 'hidden', background: '#262626', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px' }}>
            <div className="table-wrapper">
              <table style={{ textAlign: 'center' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Action</th>
                    <th>President</th><th>VP / Secretary</th><th>Lead</th><th>Member</th>
                  </tr>
                </thead>
                <tbody style={{ color: 'var(--color-text-secondary)' }}>
                  <tr><td style={{ textAlign: 'left', fontWeight: 500, color: 'var(--color-text-primary)' }}>Manage Domains</td><td>✓</td><td>—</td><td>—</td><td>—</td></tr>
                  <tr><td style={{ textAlign: 'left', fontWeight: 500, color: 'var(--color-text-primary)' }}>Manage Org-wide Users</td><td>✓</td><td>—</td><td>—</td><td>—</td></tr>
                  <tr><td style={{ textAlign: 'left', fontWeight: 500, color: 'var(--color-text-primary)' }}>Approve Domain Users</td><td>✓</td><td>✓</td><td>✓</td><td>—</td></tr>
                  <tr><td style={{ textAlign: 'left', fontWeight: 500, color: 'var(--color-text-primary)' }}>Create/Edit Projects</td><td>✓</td><td>✓</td><td>◑ (Own Domain)</td><td>—</td></tr>
                  <tr><td style={{ textAlign: 'left', fontWeight: 500, color: 'var(--color-text-primary)' }}>Create/Edit Tasks</td><td>✓</td><td>◑ (Own Domain)</td><td>◑ (Own Domain)</td><td>—</td></tr>
                  <tr><td style={{ textAlign: 'left', fontWeight: 500, color: 'var(--color-text-primary)' }}>Update Own Task Status</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td></tr>
                </tbody>
              </table>
            </div>
            <div style={{ padding: '16px', fontSize: '12px', color: 'var(--color-text-muted)', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--color-border-subtle)' }}>
              <strong>Legend:</strong> ✓ Full Access &nbsp;&nbsp;|&nbsp;&nbsp; ◑ Limited/Domain Access &nbsp;&nbsp;|&nbsp;&nbsp; — No Access
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
