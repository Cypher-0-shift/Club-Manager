'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/components/ui/Toast';
import { User } from '@/types';
import { StatsRow, SkeletonCard } from '@/components/dashboard/StatCard';
import { DomainCardGrid } from '@/components/dashboard/DomainCard';
import { useState } from 'react';

export function DashboardPresident() {
  const { user } = useAppStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dismissedBanner, setDismissedBanner] = useState(false);

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['all-tasks'],
    queryFn: () => api.get('/tasks').then(r => r.data),
  });

  const { data: domains = [], isLoading: domainsLoading } = useQuery({
    queryKey: ['domains'],
    queryFn: () => api.get('/domains').then(r => r.data),
  });

  const { data: pendingUsers = [] } = useQuery<User[]>({
    queryKey: ['pending-users'],
    queryFn: () => api.get('/users?is_approved=false').then(r => r.data),
  });

  const approveMutation = useMutation({
    mutationFn: (userId: string) => api.patch(`/users/${userId}`, { is_approved: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-users'] });
      toast('User approved!', 'success');
    },
    onError: (err: Error) => toast(err.message, 'error'),
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Pending approvals banner */}
      {!dismissedBanner && pendingUsers.length > 0 && (
        <div style={{
          background: 'rgba(245,158,11,0.1)',
          border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <span style={{ fontSize: '13px', flex: 1, color: 'var(--color-pending)' }}>
            ⚠ {pendingUsers.length} member{pendingUsers.length > 1 ? 's' : ''} awaiting approval
          </span>
          <button className="btn btn-sm" style={{
            background: 'rgba(245,158,11,0.2)', color: '#fbbf24', border: 'none',
          }} onClick={() => window.location.href = '/users'}>
            Review
          </button>
          <button onClick={() => setDismissedBanner(true)} style={{ color: 'var(--color-text-muted)', fontSize: '16px' }}>×</button>
        </div>
      )}

      {/* Stats */}
      {tasksLoading
        ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
            {[0,1,2,3].map(i => <SkeletonCard key={i} />)}
          </div>
        : <StatsRow tasks={tasks} />
      }

      {/* Pending approvals quick list */}
      {pendingUsers.length > 0 && (
        <div>
          <h2 className="section-title" style={{ marginBottom: '12px' }}>Pending Approvals</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pendingUsers.slice(0, 5).map(u => (
              <div key={u.id} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 14px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-sm)',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>{u.full_name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{u.email} · {u.role}</div>
                </div>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => approveMutation.mutate(u.id)}
                  disabled={approveMutation.isPending}
                >
                  Approve
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Domains */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h2 className="section-title">Domains</h2>
          <a href="/workspace/new" className="btn btn-sm btn-primary">+ New Domain</a>
        </div>
        {domainsLoading
          ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px' }}>
              {[0,1,2].map(i => <SkeletonCard key={i} />)}
            </div>
          : domains.length > 0
            ? <DomainCardGrid domains={domains} />
            : <div className="card" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '32px' }}>
                No domains yet. Create the first one!
              </div>
        }
      </div>
    </div>
  );
}

export function DashboardMember() {
  const { user } = useAppStore();

  const { data: myTasks = [], isLoading } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: () => api.get('/tasks/my').then(r => r.data),
    enabled: !!user,
  });

  const urgent = [...myTasks]
    .filter(t => t.status !== 'completed')
    .sort((a, b) => {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    })
    .slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Welcome */}
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 700 }}>
          Welcome, {user?.full_name.split(' ')[0]} 👋
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
          {user?.role}
        </p>
      </div>

      {/* Personal stats */}
      {isLoading
        ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px' }}>
            {[0,1,2].map(i => <SkeletonCard key={i} />)}
          </div>
        : <StatsRow tasks={myTasks} />
      }

      {/* Urgent tasks */}
      <div>
        <h2 className="section-title" style={{ marginBottom: '12px' }}>Urgent Tasks</h2>
        {urgent.length === 0
          ? <div className="card" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '24px' }}>
              🎉 No urgent tasks right now
            </div>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {urgent.map(t => (
                <a key={t.id} href="/board" style={{ textDecoration: 'none' }}>
                  <div className={`task-card ${t.is_overdue ? 'task-card-overdue' : ''}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span className={`priority-dot priority-dot-${t.priority}`} />
                      <span className="task-card-title">{t.title}</span>
                    </div>
                    <div className="task-card-footer">
                      <span className="task-card-due">
                        {t.deadline ? `Due ${new Date(t.deadline).toLocaleDateString()}` : 'No deadline'}
                      </span>
                      <span className={`badge badge-${t.status}`}>{t.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
        }
      </div>

      <div>
        <a href="/board" className="btn btn-primary">
          Open My Board →
        </a>
      </div>
    </div>
  );
}

export function DashboardLead() {
  const { domainId } = useAppStore();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['domain-tasks', domainId],
    queryFn: () => api.get(`/tasks?domain_id=${domainId}`).then(r => r.data),
    enabled: !!domainId,
  });

  const { data: domains = [] } = useQuery({
    queryKey: ['domains'],
    queryFn: () => api.get('/domains').then(r => r.data),
  });

  const myDomain = domains.find((d: { id: string }) => d.id === domainId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 700 }}>
          {myDomain?.name ?? 'Your Domain'}
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Domain Lead overview</p>
      </div>

      {isLoading
        ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
            {[0,1,2,3].map(i => <SkeletonCard key={i} />)}
          </div>
        : <StatsRow tasks={tasks} />
      }

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 className="section-title">Domain Board</h2>
          <a href={`/workspace/${domainId}`} className="btn btn-sm btn-secondary">View Full Workspace →</a>
        </div>
        <a href="/board" className="btn btn-primary">Open Kanban Board</a>
      </div>
    </div>
  );
}
