'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { Task, TaskStatus, TaskPriority, Domain } from '@/types';
import { StatCard, SkeletonCard } from '@/components/dashboard/StatCard';
import { useMemo } from 'react';

const STATUS_ORDER: TaskStatus[] = ['pending','in_progress','completed','overdue'];
const PRIORITY_ORDER: TaskPriority[] = ['low','medium','high','critical'];
const STATUS_COLORS: Record<TaskStatus, string> = {
  pending: 'var(--color-pending)',
  in_progress: 'var(--color-brand)',
  completed: 'var(--color-completed)',
  overdue: 'var(--color-overdue)',
};
const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: '#22c55e', medium: '#f59e0b', high: '#f97316', critical: '#ef4444',
};

function HorizontalBarChart({ data, total, colorMap }: { data: [string, number][]; total: number; colorMap: Record<string, string> }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {data.map(([key, count]) => (
        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '90px', fontSize: '12px', color: 'var(--color-text-secondary)', textTransform: 'capitalize', textAlign: 'right' }}>
            {key.replace('_', ' ')}
          </div>
          <div style={{ flex: 1, height: '20px', background: 'var(--color-surface-raised)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: total > 0 ? `${Math.round((count / total) * 100)}%` : '0%',
              background: colorMap[key] ?? 'var(--color-brand)',
              borderRadius: '4px',
              transition: 'width 0.5s ease',
            }} />
          </div>
          <div style={{ width: '24px', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)', textAlign: 'right' }}>
            {count}
          </div>
        </div>
      ))}
    </div>
  );
}

export function MemberAnalytics() {
  const { user } = useAppStore();

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'me'],
    queryFn: () => api.get('/tasks/analytics/me').then(r => r.data),
    enabled: !!user,
  });

  const { data: domains = [] } = useQuery<Domain[]>({
    queryKey: ['all-domains'],
    queryFn: () => api.get('/domains').then(r => r.data),
  });

  if (isLoading) {
    return <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>{[0,1,2].map(i => <SkeletonCard key={i} />)}</div>;
  }

  const stats = data || {
    total: 0, completed: 0, overdue: 0, completion_rate: 0,
    by_status: {}, by_priority: {}, submissions: []
  };

  const byStatus = STATUS_ORDER.map(s => [s, stats.by_status[s] || 0] as [string, number]);
  const byPriority = PRIORITY_ORDER.map(p => [p, stats.by_priority[p] || 0] as [string, number]);

  // Project breakdown from submissions / tasks.
  // We can't do project breakdown effectively from /analytics/me unless we fetch all projects or tasks.
  // Wait, /analytics/me doesn't return tasks? Oh, we might need all tasks.
  // Instead of querying tasks again, let's use the 'submissions' list for Row 5.
  // Row 4 asks for Project breakdown table: Project | Domain | Assigned | Completed | Overdue | Status.
  // To do this, we need the raw tasks. Let's just fetch /tasks/my for member.
  return <MemberAnalyticsFull />;
}

function MemberAnalyticsFull() {
  const { user } = useAppStore();

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['my-tasks'],
    queryFn: () => api.get('/tasks/my').then(r => r.data),
    enabled: !!user,
  });

  const { data: domains = [] } = useQuery<Domain[]>({
    queryKey: ['all-domains'],
    queryFn: () => api.get('/domains').then(r => r.data),
  });

  if (isLoading) {
    return <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>{[0,1,2].map(i => <SkeletonCard key={i} />)}</div>;
  }

  const byStatus = STATUS_ORDER.map(s => [s, tasks.filter(t => t.status === s).length] as [string, number]);
  const byPriority = PRIORITY_ORDER.map(p => [p, tasks.filter(t => t.priority === p).length] as [string, number]);
  const completionRate = tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0;

  // Project breakdown
  const projectsMap: Record<string, any> = {};
  tasks.forEach(t => {
    if (!t.project) return;
    if (!projectsMap[t.project_id]) {
      projectsMap[t.project_id] = {
        name: t.project.name,
        domain_id: t.project.domain_id,
        assigned: 0, completed: 0, overdue: 0
      };
    }
    projectsMap[t.project_id].assigned += 1;
    if (t.status === 'completed') projectsMap[t.project_id].completed += 1;
    if (t.status === 'overdue' || t.is_overdue) projectsMap[t.project_id].overdue += 1;
  });
  const projectStats = Object.values(projectsMap);

  // Recent Activity from tasks (since submissions endpoint is task specific, we can just use recently completed tasks)
  // Wait, MOD-017 asked to add submissions to /analytics/me.
  // Let's use the analytics/me endpoint just for submissions.
  return <MemberAnalyticsDisplay 
    tasks={tasks} projectStats={projectStats} 
    byStatus={byStatus} byPriority={byPriority} 
    completionRate={completionRate} domains={domains} 
  />;
}

function MemberAnalyticsDisplay({ tasks, projectStats, byStatus, byPriority, completionRate, domains }: any) {
  const { data: analytics } = useQuery({
    queryKey: ['analytics', 'me'],
    queryFn: () => api.get('/tasks/analytics/me').then(r => r.data),
  });

  const submissions = analytics?.submissions || [];
  const domainMap = Object.fromEntries(domains.map((d: Domain) => [d.id, d.name]));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 className="section-title" style={{ fontSize: '20px' }}>My Performance</h1>
      </div>

      {/* Row 1: KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
        <StatCard label="Total Assigned" value={tasks.length} />
        <StatCard label="Completed" value={tasks.filter((t:Task) => t.status === 'completed').length} accent="var(--color-completed)" />
        <StatCard label="Overdue" value={tasks.filter((t:Task) => t.is_overdue || t.status === 'overdue').length} accent="var(--color-overdue)" />
        <StatCard label="Completion Rate" value={`${completionRate}%`} accent="var(--color-brand)" />
      </div>

      {/* Row 2 & 3: Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <div className="card">
          <h2 className="section-title" style={{ marginBottom: '16px', fontSize: '15px' }}>Status Breakdown</h2>
          <HorizontalBarChart data={byStatus} total={tasks.length} colorMap={STATUS_COLORS as Record<string, string>} />
        </div>
        <div className="card">
          <h2 className="section-title" style={{ marginBottom: '16px', fontSize: '15px' }}>Priority Distribution</h2>
          <HorizontalBarChart data={byPriority} total={tasks.length} colorMap={PRIORITY_COLORS as Record<string, string>} />
        </div>
      </div>

      {/* Row 4: Project breakdown */}
      <div className="card glass-subtle" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border-subtle)' }}>
          <h2 className="section-title" style={{ fontSize: '15px', margin: 0 }}>Project Breakdown</h2>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Project</th><th>Domain</th><th>Assigned</th><th>Completed</th><th>Overdue</th><th>Status</th></tr>
            </thead>
            <tbody>
              {projectStats.map((p: any, i: number) => {
                const isDone = p.completed === p.assigned && p.assigned > 0;
                return (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{p.name}</td>
                    <td style={{ color: 'var(--color-text-muted)' }}>{domainMap[p.domain_id] || '—'}</td>
                    <td>{p.assigned}</td>
                    <td style={{ color: 'var(--color-completed)' }}>{p.completed}</td>
                    <td style={{ color: p.overdue > 0 ? 'var(--color-overdue)' : 'inherit' }}>{p.overdue}</td>
                    <td>
                      {isDone ? <span className="badge badge-completed">Done</span> : <span className="badge badge-pending">Active</span>}
                    </td>
                  </tr>
                );
              })}
              {projectStats.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No projects assigned</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 5: Recent Activity */}
      <div className="card glass-subtle" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border-subtle)' }}>
          <h2 className="section-title" style={{ fontSize: '15px', margin: 0 }}>Recent Activity</h2>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Date</th><th>Task</th><th>Submission Type</th></tr>
            </thead>
            <tbody>
              {submissions.slice(0, 10).map((s: any) => (
                <tr key={s.id}>
                  <td style={{ color: 'var(--color-text-muted)' }}>{new Date(s.created_at).toLocaleDateString()}</td>
                  <td style={{ fontWeight: 500 }}>{s.task?.title || 'Unknown Task'}</td>
                  <td><span className="badge" style={{ background: 'var(--color-surface-hover)' }}>{s.type}</span></td>
                </tr>
              ))}
              {submissions.length === 0 && (
                <tr><td colSpan={3} style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No recent submissions</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
