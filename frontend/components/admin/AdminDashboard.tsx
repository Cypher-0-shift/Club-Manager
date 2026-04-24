'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/components/ui/Toast';
import { User, Project, Task, Domain, Organization } from '@/types';
import { StatCard, SkeletonCard } from '@/components/dashboard/StatCard';
import { DomainCardGrid } from '@/components/dashboard/DomainCard';
import { QK } from '@/lib/queryKeys';
import { useState } from 'react';
import { motion } from 'framer-motion';

export function AdminDashboard() {
  const { role } = useAppStore();
  if (role === 'lead') return <DashboardLead />;
  return <DashboardAdmin />;
}

function DashboardAdmin() {
  const { user } = useAppStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dismissedBanner, setDismissedBanner] = useState(false);

  const { data: org } = useQuery<Organization>({
    queryKey: ['org'],
    queryFn: () => api.get('/users/org').then(r => r.data),
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: QK.tasks.all(),
    queryFn: () => api.get('/tasks?limit=5000').then(r => r.data),
  });

  const { data: domains = [], isLoading: domainsLoading } = useQuery<Domain[]>({
    queryKey: QK.domains.all(),
    queryFn: () => api.get('/domains').then(r => r.data),
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects?limit=5000').then(r => r.data),
  });

  const { data: pendingUsers = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['pending-users'],
    queryFn: () => api.get('/users?is_approved=false&limit=5000').then(r => r.data),
  });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t: Task) => t.status === 'completed').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const overdueTasks = tasks.filter((t: Task) => t.status === 'overdue' || t.is_overdue).length;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Welcome & Org Info */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '4px' }}>
            Hello, {user?.full_name?.split(' ')[0] ?? 'there'} 👋
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)', fontFamily: 'Satoshi, sans-serif' }}>
            Executive overview of {org?.name || 'the organization'}
          </p>
        </div>

        {org?.join_code && (
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Join Code</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--color-brand)' }}>{org.join_code}</span>
              <button 
                onClick={() => { navigator.clipboard.writeText(org.join_code); toast('Code copied!', 'success'); }}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', padding: '4px' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Analytics Strip */}
      <div>
        <h2 className="section-title" style={{ marginBottom: '16px' }}>Performance Overview</h2>
        {tasksLoading || usersLoading
          ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>{[0,1,2,3].map(i => <SkeletonCard key={i} />)}</div>
          : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
              <StatCard label="Total Tasks" value={totalTasks} />
              <StatCard label="Completion Rate" value={`${completionRate}%`} />
              <StatCard label="Overdue" value={overdueTasks} accent="var(--color-overdue)" />
              <StatCard label="Pending Approval" value={pendingUsers.length} accent="var(--color-pending)" />
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
            ⚠ {pendingUsers.length} member{pendingUsers.length > 1 ? 's' : ''} waiting for approval
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

function DashboardLead() {
  const { user } = useAppStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const domainId = user?.domain_id;

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ['tasks', 'domain', domainId],
    queryFn: () => api.get(`/tasks?domain_id=${domainId}&limit=5000`).then(r => r.data),
    enabled: !!domainId,
  });

  const { data: members = [], isLoading: membersLoading } = useQuery<User[]>({
    queryKey: ['users', 'domain', domainId],
    queryFn: () => api.get(`/users?domain_id=${domainId}&limit=5000`).then(r => r.data),
    enabled: !!domainId,
  });

  const { data: myDomain } = useQuery<Domain>({
    queryKey: ['domain', domainId],
    queryFn: () => api.get(`/domains/${domainId}`).then(r => r.data),
    enabled: !!domainId,
  });

  const pendingMembers = members.filter(m => !m.is_approved);
  const approvedMembers = members.filter(m => m.is_approved);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t: Task) => t.status === 'completed').length;
  const overdueTasks = tasks.filter((t: Task) => t.status === 'overdue' || t.is_overdue).length;

  const myActiveTasks = tasks.filter((t: Task) => t.created_by === user?.id && t.status !== 'completed');

  const approveMutation = useMutation({
    mutationFn: (userId: string) => api.patch(`/users/${userId}`, { is_approved: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'domain', domainId] });
      toast('User approved!', 'success');
    },
    onError: (err: Error) => toast(err.message, 'error'),
  });

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      <div>
        <h1 className="font-display" style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '4px' }}>
          Hello, {user?.full_name?.split(' ')[0] ?? 'there'} 👋
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)', fontFamily: 'Satoshi, sans-serif' }}>
          Lead • {myDomain?.name ?? 'Loading...'} · {totalTasks} active tasks
        </p>
      </div>

      {/* Domain Stats Strip */}
      <div>
        <h2 className="section-title" style={{ marginBottom: '16px' }}>Domain Overview</h2>
        {tasksLoading || membersLoading
          ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>{[0,1,2,3].map(i => <SkeletonCard key={i} />)}</div>
          : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
              <StatCard label="Tasks in Domain" value={totalTasks} />
              <StatCard label="Completed" value={completedTasks} accent="var(--color-completed)" />
              <StatCard label="Overdue" value={overdueTasks} accent="var(--color-overdue)" />
              <StatCard label="Members" value={approvedMembers.length} accent="var(--color-brand)" />
            </div>
          )
        }
      </div>

      {/* My Active Tasks */}
      <div>
        <h2 className="section-title" style={{ marginBottom: '16px' }}>My Active Tasks</h2>
        {tasksLoading
          ? <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>{[0,1,2].map(i => <SkeletonCard key={i} />)}</div>
          : myActiveTasks.length > 0 ? (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Title</th><th>Assignee</th><th>Priority</th><th>Deadline</th></tr>
                </thead>
                <tbody>
                  {myActiveTasks.map((t: Task) => (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 500 }}>
                        <a href="/board" style={{ color: 'inherit', textDecoration: 'none' }}>{t.title}</a>
                      </td>
                      <td style={{ color: 'var(--color-text-muted)' }}>{t.assignee?.full_name || 'Unassigned'}</td>
                      <td><span className={`badge badge-${t.priority}`}>{t.priority}</span></td>
                      <td style={{ color: t.is_overdue ? 'var(--color-overdue)' : 'var(--color-text-muted)' }}>
                        {t.deadline ? new Date(t.deadline).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '24px' }}>
              You don't have any active tasks created.
            </div>
          )
        }
      </div>

      {/* Pending Approvals */}
      {pendingMembers.length > 0 && (
        <div>
          <h2 className="section-title" style={{ marginBottom: '16px', color: 'var(--color-pending)' }}>Members Needing Approval</h2>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Action</th></tr>
              </thead>
              <tbody>
                {pendingMembers.map((m: User) => (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 500 }}>{m.full_name}</td>
                    <td style={{ color: 'var(--color-text-muted)' }}>{m.email}</td>
                    <td style={{ textTransform: 'capitalize' }}>{m.role}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => approveMutation.mutate(m.id)}
                        disabled={approveMutation.isPending}
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
    </motion.div>
  );
}
