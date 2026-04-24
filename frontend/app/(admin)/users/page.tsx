'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { User, Domain } from '@/types';
import { SkeletonCard } from '@/components/dashboard/StatCard';
import { useAuthHydration } from '@/hooks/useAuthHydration';
import { Search, Trash2, Edit3, Check, X, AlertTriangle } from 'lucide-react';

const ROLE_OPTIONS = ['president','vp','secretary','lead','member'];

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'info';
  isLoading?: boolean;
}

function CustomConfirmModal({ isOpen, title, message, onConfirm, onCancel, type = 'info', isLoading }: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', width: '100%', maxWidth: '400px', padding: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', position: 'relative', overflow: 'hidden' }}>
        {/* Accent line */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '2px', background: type === 'danger' ? 'var(--color-critical)' : 'var(--color-primary)' }} />
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: type === 'danger' ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: type === 'danger' ? '#ef4444' : '#fff' }}>
            {type === 'danger' ? <AlertTriangle size={24} /> : <Check size={24} />}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>{title}</h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{message}</p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '8px' }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onCancel} disabled={isLoading}>Cancel</button>
            <button 
              className={`btn ${type === 'danger' ? 'btn-danger' : 'btn-primary'}`} 
              style={{ flex: 1 }} 
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const { hydrated } = useAuthHydration();
  const { role, user } = useAppStore();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<'pending_requests'|'directory'>('pending_requests');
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState('all');
  const [isEditing, setIsEditing] = useState(false);

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'info'
  });

  const isAdmin = ['president','vp','secretary','lead'].includes(role ?? '');
  const isPresident = role === 'president';

  // Fetches
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

  const { data: matrix = [], isLoading: isMatrixLoading } = useQuery<any[]>({
    queryKey: ['role-permissions'],
    queryFn: () => api.get('/users/permissions').then(r => r.data),
    enabled: hydrated && isAdmin,
  });

  // Transform permissions data into matrix format for display
  const transformPermissionsToMatrix = (perms: any[]) => {
    if (!perms || perms.length === 0) return [];
    
    const actions = [
      { key: 'users.read', label: 'View Users' },
      { key: 'users.create', label: 'Create Users' },
      { key: 'users.update', label: 'Update Users' },
      { key: 'users.delete', label: 'Delete Users' },
      { key: 'users.approve', label: 'Approve Users' },
      { key: 'domains.read', label: 'View Domains' },
      { key: 'domains.create', label: 'Create Domains' },
      { key: 'domains.update', label: 'Update Domains' },
      { key: 'domains.delete', label: 'Delete Domains' },
      { key: 'projects.create', label: 'Create Projects' },
      { key: 'tasks.create', label: 'Create Tasks' },
      { key: 'tasks.assign', label: 'Assign Tasks' },
      { key: 'analytics.read', label: 'View Analytics' },
      { key: 'settings.update', label: 'Update Settings' },
    ];

    const roleMap: any = {};
    perms.forEach((p: any) => {
      roleMap[p.role] = p.permissions;
    });

    const getSymbol = (value: boolean) => value ? '✓' : '—';

    return actions.map(action => {
      const [resource, permission] = action.key.split('.');
      const president = roleMap['president']?.[resource]?.[permission];
      const vp = roleMap['vp']?.[resource]?.[permission];
      const sec = roleMap['secretary']?.[resource]?.[permission];
      const lead = roleMap['lead']?.[resource]?.[permission];
      const member = roleMap['member']?.[resource]?.[permission];

      // VP and Secretary usually have same permissions, so combine them
      const vpSec = vp === sec ? getSymbol(vp) : (vp && sec ? '✓' : vp || sec ? '◑' : '—');

      return {
        action: action.label,
        president: getSymbol(president),
        vp_sec: vpSec,
        lead: getSymbol(lead),
        member: getSymbol(member),
      };
    });
  };

  const [localMatrix, setLocalMatrix] = useState<any[]>([]);

  useEffect(() => {
    if (matrix.length > 0) {
      const transformed = transformPermissionsToMatrix(matrix);
      setLocalMatrix(transformed);
    }
  }, [matrix]);

  // Mutations
  const approveMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/users/${id}`, { is_approved: true }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['all-users'] }); toast('User approved', 'success'); },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, newRole }: { id: string; newRole: string }) => api.patch(`/users/${id}`, { role: newRole }),
    onSuccess: () => { 
        qc.invalidateQueries({ queryKey: ['all-users'] }); 
        toast('Role updated', 'success');
        setConfirmState(s => ({ ...s, isOpen: false }));
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const domainUpdateMutation = useMutation({
    mutationFn: ({ id, domainId }: { id: string; domainId: string | null }) => api.patch(`/users/${id}`, { domain_id: domainId === 'none' ? null : domainId }),
    onSuccess: () => {
        qc.invalidateQueries({ queryKey: ['all-users'] });
        toast('Domain assignment updated', 'success');
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-users'] });
      toast('Member removed successfully', 'success');
      setConfirmState(s => ({ ...s, isOpen: false }));
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const matrixMutation = useMutation({
    mutationFn: (newMatrix: any[]) => api.patch('/users/permissions', newMatrix),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['role-permissions'] });
      toast('Permissions updated', 'success');
      setConfirmState(s => ({ ...s, isOpen: false }));
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  // Handlers
  const handleDelete = (u: User) => {
    setConfirmState({
        isOpen: true,
        title: 'Remove Member',
        message: `Are you sure you want to remove ${u.full_name}? This will revoke their access to the organization immediately and permanently.`,
        type: 'danger',
        onConfirm: () => deleteMutation.mutate(u.id)
    });
  };

  const handleRoleChange = (id: string, newRole: string, name: string) => {
    setConfirmState({
        isOpen: true,
        title: 'Update Member Role',
        message: `Change ${name}'s role to ${newRole.toUpperCase()}? This will modify their permissions across all organizational domains.`,
        type: 'info',
        onConfirm: () => roleMutation.mutate({ id, newRole })
    });
  };

  const handleMatrixChange = (index: number, field: string, value: string) => {
    const updated = [...localMatrix];
    updated[index] = { ...updated[index], [field]: value };
    setLocalMatrix(updated);
  };

  const handleToggleEdit = () => {
    if (isEditing) {
      setConfirmState({
          isOpen: true,
          title: 'Save Permissions',
          message: 'Apply these changes to the global Role Permissions Matrix? This will redefine access levels for the entire organization.',
          type: 'info',
          onConfirm: () => {
              matrixMutation.mutate(localMatrix);
              setIsEditing(false);
          }
      });
      return; // Wait for confirmation
    }
    setIsEditing(true);
  };

  if (!hydrated) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--color-bg)' }}><div className="spinner" /></div>;
  }

  if (!isAdmin) {
    return <div style={{ color: 'var(--color-text-muted)', padding: '24px' }}>Access denied</div>;
  }

  const domainMap = Object.fromEntries(domains.map(d => [d.id, d.name]));
  const domainColorMap = Object.fromEntries(domains.map(d => [d.id, d.color_hex]));

  const pending = users.filter(u => !u.is_approved).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const approved = users.filter(u => u.is_approved && 
    (search === '' || u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())) &&
    (domainFilter === 'all' || u.domain_id === domainFilter)
  ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#e5e5e5' }}>Organization Directory</h1>
            <p className="section-subtitle">Manage organization access, roles, and permissions</p>
          </div>
          {isPresident && activeTab === 'directory' && (
            <button 
              className={`btn btn-sm ${isEditing ? 'btn-primary' : 'btn-secondary'}`}
              onClick={handleToggleEdit}
              style={{ gap: '8px' }}
              disabled={matrixMutation.isPending}
            >
              {isEditing ? <Check size={14} /> : <Edit3 size={14} />}
              {isEditing ? 'Save Changes' : 'Edit Directory'}
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '4px 4px 0' }}>
          <button 
            className="btn btn-ghost"
            onClick={() => setActiveTab('pending_requests')}
            style={{ 
              borderRadius: '6px 6px 0 0', 
              padding: '10px 20px',
              fontSize: '13px',
              background: activeTab === 'pending_requests' ? 'rgba(255,255,255,0.05)' : 'transparent',
              color: activeTab === 'pending_requests' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              borderBottom: activeTab === 'pending_requests' ? '2px solid #ffffff' : '2px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            Pending Requests {pending.length > 0 && <span className="badge badge-pending" style={{ marginLeft: '6px' }}>{pending.length}</span>}
          </button>
          <button 
            className="btn btn-ghost"
            onClick={() => setActiveTab('directory')}
            style={{ 
              borderRadius: '6px 6px 0 0', 
              padding: '10px 20px',
              fontSize: '13px',
              background: activeTab === 'directory' ? 'rgba(255,255,255,0.05)' : 'transparent',
              color: activeTab === 'directory' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              borderBottom: activeTab === 'directory' ? '2px solid #ffffff' : '2px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            Directory & Access
          </button>
        </div>

        {/* Pending Approval Tab */}
        {activeTab === 'pending_requests' && (
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
                              <div style={{ display: 'flex', gap: '8px' }}>
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
                                {isPresident && (
                                  <button className="btn btn-sm btn-ghost btn-icon" onClick={() => handleDelete(u)} style={{ color: 'var(--color-critical)' }}>
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
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

        {/* Directory Tab */}
        {activeTab === 'directory' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
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
                        <tr><th>Member</th><th>Email</th><th>Role</th><th>Domain</th><th>Status</th><th>Joined</th>{isPresident && isEditing && <th>Actions</th>}</tr>
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
                              {isPresident && isEditing ? (
                                <select
                                  value={u.role}
                                  className="form-input"
                                  style={{ padding: '4px 8px', fontSize: '12px', width: 'auto', background: '#1a1a1a', color: '#ffffff', border: '1px solid rgba(255,255,255,0.1)' }}
                                  onChange={e => handleRoleChange(u.id, e.target.value, u.full_name)}
                                  disabled={u.id === user?.id}
                                >
                                  {ROLE_OPTIONS.map(r => <option key={r} value={r} style={{ background: '#1a1a1a', color: '#ffffff' }}>{r}</option>)}
                                </select>
                              ) : (
                                <span style={{ background: 'rgba(255,255,255,0.06)', color: '#a3a3a3', fontSize: '11px', padding: '2px 8px', borderRadius: '5px', textTransform: 'capitalize', display: 'inline-flex' }}>{u.role}</span>
                              )}
                            </td>
                            <td style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>
                              {isPresident && isEditing ? (
                                <select
                                  value={u.domain_id || 'none'}
                                  className="form-input"
                                  style={{ padding: '4px 8px', fontSize: '12px', width: 'auto', background: '#1a1a1a', color: '#ffffff', border: '1px solid rgba(255,255,255,0.1)' }}
                                  onChange={e => domainUpdateMutation.mutate({ id: u.id, domainId: e.target.value })}
                                >
                                  <option value="none" style={{ background: '#1a1a1a', color: '#ffffff' }}>No Domain</option>
                                  {domains.map(d => <option key={d.id} value={d.id} style={{ background: '#1a1a1a', color: '#ffffff' }}>{d.name}</option>)}
                                </select>
                              ) : (
                                domainMap[u.domain_id || ''] || '—'
                              )}
                            </td>
                            <td><span style={{ background: 'rgba(255,255,255,0.04)', color: '#525252', border: '1px solid rgba(255,255,255,0.07)', fontSize: '11px', padding: '2px 8px', borderRadius: '5px' }}>Active</span></td>
                            <td style={{ color: 'var(--color-text-muted)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                            {isPresident && isEditing && (
                              <td>
                                {u.id !== user?.id && (
                                  <button className="btn btn-sm btn-ghost btn-icon" onClick={() => handleDelete(u)} style={{ color: 'var(--color-critical)' }} title="Remove member">
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </td>
                            )}
                          </tr>
                        ))}
                        {approved.length === 0 && (
                          <tr><td colSpan={isPresident && isEditing ? 7 : 6} style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No members match your search.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Role Permissions Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#e5e5e5' }}>Role Permissions Matrix</h3>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Reference for what each role is permitted to do within the organization.</p>
              </div>
              <div style={{ padding: 0, overflow: 'hidden', background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px' }}>
                <div className="table-wrapper">
                  <table style={{ textAlign: 'center' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left' }}>Action</th>
                        <th>President</th><th>VP / Secretary</th><th>Lead</th><th>Member</th>
                      </tr>
                    </thead>
                    <tbody style={{ color: 'var(--color-text-secondary)' }}>
                      {localMatrix.map((row, idx) => (
                        <tr key={idx}>
                          <td style={{ textAlign: 'left', fontWeight: 500, color: 'var(--color-text-primary)' }}>{row.action}</td>
                          {['president', 'vp_sec', 'lead', 'member'].map(col => (
                            <td key={col}>
                              {isPresident && isEditing && col !== 'president' ? (
                                <select 
                                  value={row[col]} 
                                  className="form-input" 
                                  style={{ padding: '2px 4px', fontSize: '12px', width: 'auto', background: '#1a1a1a', color: '#ffffff', border: '1px solid rgba(255,255,255,0.1)' }}
                                  onChange={(e) => handleMatrixChange(idx, col, e.target.value)}
                                >
                                  <option value="✓" style={{ background: '#1a1a1a', color: '#ffffff' }}>✓</option>
                                  <option value="◑" style={{ background: '#1a1a1a', color: '#ffffff' }}>◑</option>
                                  <option value="—" style={{ background: '#1a1a1a', color: '#ffffff' }}>—</option>
                                </select>
                              ) : (
                                row[col]
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ padding: '16px', fontSize: '12px', color: 'var(--color-text-muted)', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <strong>Legend:</strong> ✓ Full Access &nbsp;&nbsp;|&nbsp;&nbsp; ◑ Limited/Domain Access &nbsp;&nbsp;|&nbsp;&nbsp; — No Access
                </div>
              </div>
            </div>
          </div>
        )}

        <CustomConfirmModal 
          isOpen={confirmState.isOpen}
          title={confirmState.title}
          message={confirmState.message}
          type={confirmState.type}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(s => ({ ...s, isOpen: false }))}
          isLoading={deleteMutation.isPending || roleMutation.isPending || matrixMutation.isPending}
        />
      </div>
  );
}
