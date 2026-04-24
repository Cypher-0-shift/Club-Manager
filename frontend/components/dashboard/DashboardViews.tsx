'use client';
// ── Legacy exports (unchanged) ──
// New canonical split components live in:
//   @/components/admin/AdminDashboard
//   @/components/member/MemberDashboard

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/components/ui/Toast';
import { User, Project, Task, Domain } from '@/types';
import { StatsRow, StatCard, SkeletonCard } from '@/components/dashboard/StatCard';
import { DomainCardGrid } from '@/components/dashboard/DomainCard';
import { QK } from '@/lib/queryKeys';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Search, ArrowRight } from 'lucide-react';

export function DashboardPresident() {
  const { user } = useAppStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dismissedBanner, setDismissedBanner] = useState(false);

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: QK.tasks.all(),
    queryFn: () => api.get('/tasks').then(r => r.data),
  });

  const { data: domains = [], isLoading: domainsLoading } = useQuery<Domain[]>({
    queryKey: QK.domains.all(),
    queryFn: () => api.get('/domains').then(r => r.data),
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects').then(r => r.data),
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
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Welcome */}
      <div>
        <h1 className="font-display" style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '4px' }}>
          Hello, {user?.full_name?.split(' ')[0] ?? 'there'} 👋
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)', fontFamily: 'Satoshi, sans-serif' }}>
          Executive overview of the organization
        </p>
      </div>

      {/* Analytics Strip Top */}
      <div>
        <h2 className="section-title" style={{ marginBottom: '16px' }}>Performance Overview</h2>
        {tasksLoading
          ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>{[0,1,2,3].map(i => <SkeletonCard key={i} />)}</div>
          : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
              <StatCard label="Total Tasks" value={tasks.length} />
              <StatCard label="Pending Members" value={pendingUsers.length} accent="var(--color-pending)" />
              <StatCard label="Active Projects" value={projects.length} accent="var(--color-brand)" />
              <StatCard label="Completion Rate" value={`${tasks.length > 0 ? Math.round((tasks.filter((t: Task) => t.status === 'completed').length / tasks.length) * 100) : 0}%`} />
            </div>
          )
        }
      </div>

      {/* Pending approvals banner */}
      {!dismissedBanner && pendingUsers.length > 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} style={{
          background: 'rgba(217, 119, 6, 0.1)',
          border: '1px solid rgba(217, 119, 6, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '16px 20px',
          display: 'flex', alignItems: 'center', gap: '16px',
        }}>
          <span style={{ fontSize: '14px', flex: 1, color: 'var(--color-pending)', fontWeight: 500 }}>
            ⚠ {pendingUsers.length} member{pendingUsers.length > 1 ? 's' : ''} awaiting approval
          </span>
          <button className="btn btn-sm btn-primary" onClick={() => window.location.href = '/users'}>
            Review Now
          </button>
          <button onClick={() => setDismissedBanner(true)} style={{ color: 'var(--color-text-muted)', fontSize: '18px' }}>×</button>
        </motion.div>
      )}

      {/* Domains Map */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 className="section-title">Active Domains</h2>
          <a href="/workspace/new" className="btn btn-sm btn-primary">+ New Domain</a>
        </div>
        {domainsLoading || projectsLoading || tasksLoading
          ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px' }}>{[0,1,2].map(i => <SkeletonCard key={i} />)}</div>
          : domains.length > 0
            ? <DomainCardGrid domains={domains} tasks={tasks} projects={projects} />
            : <div className="card" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '32px' }}>
                No domains yet. Create the first one!
              </div>
        }
      </div>
    </motion.div>
  );
}

export function DashboardMember() {
  const { user } = useAppStore();

  const { data: myTasks = [], isLoading } = useQuery<Task[]>({
    queryKey: QK.tasks.mine(),
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
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Welcome */}
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>
          Hello, {user?.full_name?.split(' ')[0] ?? 'there'} 👋
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--color-text-muted)' }}>
          {myTasks.filter(t => t.status !== 'completed').length} active tasks on your plate
        </p>
      </div>

      {/* Urgent tasks priority section */}
      <div>
        <h2 className="section-title" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} color="var(--color-brand)" /> Your tasks today
        </h2>
        {isLoading 
          ? <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>{[0,1].map(i => <SkeletonCard key={i} />)}</div>
          : urgent.length === 0
            ? <div className="card" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '40px', border: '2px dashed var(--color-border)' }}>
                🎉 You're all caught up! No urgent tasks.
              </div>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {urgent.map((t, idx) => (
                  <motion.a 
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}
                    key={t.id} href="/board" style={{ textDecoration: 'none' }}
                  >
                    <div className={`task-card ${t.is_overdue ? 'task-card-overdue' : ''}`} style={{ borderLeft: `3px solid var(--color-${t.priority})`}}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span className="task-card-title">{t.title}</span>
                      </div>
                      <div className="task-card-footer">
                        <span className="task-card-due" style={{ color: t.is_overdue ? 'var(--color-overdue)' : undefined}}>
                          {t.deadline ? `Due ${new Date(t.deadline).toLocaleDateString()}` : 'No deadline'}
                        </span>
                        <span className={`badge badge-${t.status}`}>{t.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </motion.a>
                ))}
              </div>
        }
      </div>

      <div>
        <a href="/board" className="btn btn-primary">
          Enter Workspace <ArrowRight size={16} />
        </a>
      </div>
    </motion.div>
  );
}

export function DashboardLead() {
  const { domainId, user } = useAppStore();

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: QK.tasks.byDomain(domainId as string),
    queryFn: () => api.get(`/tasks?domain_id=${domainId}`).then(r => r.data),
    enabled: !!domainId,
  });

  const { data: domains = [] } = useQuery({
    queryKey: QK.domains.all(),
    queryFn: () => api.get('/domains').then(r => r.data),
  });

  const myDomain = domains.find((d: { id: string }) => d.id === domainId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 className="font-display" style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '4px' }}>
          Hello, {user?.full_name?.split(' ')[0] || 'there'} 👋
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)', fontFamily: 'Satoshi, sans-serif' }}>
          Lead • {myDomain?.name ?? 'Loading...'} · {tasks.length} active tasks
        </p>
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

// ── MOD-003: re-export the new split dashboard components ──
export { AdminDashboard } from '@/components/admin/AdminDashboard';
export { MemberDashboard } from '@/components/member/MemberDashboard';
