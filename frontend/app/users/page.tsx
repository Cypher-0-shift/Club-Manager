'use client';

import { AppShell } from '@/components/layout/AppShell';
import { useAppStore } from '@/lib/store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { User } from '@/types';
import { SkeletonCard } from '@/components/dashboard/StatCard';

const ROLE_OPTIONS = ['president','vp','secretary','lead','member'];

export default function UsersPage() {
  const { role } = useAppStore();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['all-users'],
    queryFn: () => api.get('/users').then(r => r.data),
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

  if (!['president','vp','secretary'].includes(role ?? '')) {
    return <AppShell><div style={{ color: 'var(--color-text-muted)' }}>Access denied</div></AppShell>;
  }

  const pending  = users.filter(u => !u.is_approved);
  const approved = users.filter(u => u.is_approved);

  return (
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h1 className="section-title" style={{ fontSize: '18px' }}>User Management</h1>
          <p className="section-subtitle">{users.length} total users</p>
        </div>

        {/* Pending */}
        {pending.length > 0 && (
          <div>
            <h2 className="section-title" style={{ fontSize: '15px', marginBottom: '12px', color: 'var(--color-pending)' }}>
              ⏳ Pending Approval ({pending.length})
            </h2>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Name</th><th>Email</th><th>Role</th><th>Signed Up</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map(u => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 500 }}>{u.full_name}</td>
                      <td style={{ color: 'var(--color-text-muted)' }}>{u.email}</td>
                      <td><span style={{ textTransform: 'capitalize' }}>{u.role}</span></td>
                      <td style={{ color: 'var(--color-text-muted)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => approveMutation.mutate(u.id)}
                          disabled={approveMutation.isPending}
                          id={`approve-${u.id}`}
                        >
                          Approve
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Approved users */}
        <div>
          <h2 className="section-title" style={{ fontSize: '15px', marginBottom: '12px' }}>
            Members ({approved.length})
          </h2>
          {isLoading
            ? <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>{[0,1,2].map(i => <SkeletonCard key={i} />)}</div>
            : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th><th>Email</th><th>Role</th><th>Domain</th><th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approved.map(u => (
                      <tr key={u.id}>
                        <td style={{ fontWeight: 500 }}>{u.full_name}</td>
                        <td style={{ color: 'var(--color-text-muted)' }}>{u.email}</td>
                        <td>
                          <select
                            value={u.role}
                            className="form-input"
                            style={{ padding: '4px 8px', fontSize: '12px', width: 'auto' }}
                            onChange={e => roleMutation.mutate({ id: u.id, newRole: e.target.value })}
                          >
                            {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </td>
                        <td style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>
                          {u.domain_id ?? '—'}
                        </td>
                        <td style={{ color: 'var(--color-text-muted)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </div>
      </div>
    </AppShell>
  );
}
