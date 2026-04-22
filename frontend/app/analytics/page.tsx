'use client';

import { AppShell } from '@/components/layout/AppShell';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { Task, TaskStatus, TaskPriority, User, Domain } from '@/types';
import { StatCard } from '@/components/dashboard/StatCard';
import { useAuthHydration } from '@/hooks/useAuthHydration';
import { useMemo } from 'react';
import { format, subWeeks, startOfWeek, isAfter, isBefore } from 'date-fns';
import { MemberAnalytics } from '@/components/member/MemberAnalytics';

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

function BarChart({ data, total, colorMap }: { data: [string, number][]; total: number; colorMap: Record<string, string> }) {
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

export default function AnalyticsPage() {
  const { hydrated } = useAuthHydration();
  const { role } = useAppStore();

  const isAdmin = ['president', 'vp', 'secretary', 'lead'].includes(role ?? '');
  const isExec = ['president', 'vp', 'secretary'].includes(role ?? '');

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['all-tasks'],
    queryFn: () => api.get('/tasks?limit=2000').then(r => r.data),
    enabled: hydrated && isAdmin,
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['all-users'],
    queryFn: () => api.get('/users?limit=2000').then(r => r.data),
    enabled: hydrated && isAdmin,
  });

  const { data: domains = [] } = useQuery<Domain[]>({
    queryKey: ['all-domains'],
    queryFn: () => api.get('/domains').then(r => r.data),
    enabled: hydrated && isAdmin,
  });

  const byStatus = useMemo(() => STATUS_ORDER.map(s => [s, tasks.filter(t => t.status === s).length] as [string, number]), [tasks]);
  const byPriority = useMemo(() => PRIORITY_ORDER.map(p => [p, tasks.filter(t => t.priority === p).length] as [string, number]), [tasks]);
  const completionRate = tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0;

  // Domain Performance
  const domainStats = useMemo(() => {
    return domains.map(d => {
      const dTasks = tasks.filter(t => t.project?.domain_id === d.id);
      const completed = dTasks.filter(t => t.status === 'completed').length;
      const overdue = dTasks.filter(t => t.status === 'overdue' || t.is_overdue).length;
      const compRate = dTasks.length > 0 ? Math.round((completed / dTasks.length) * 100) : 0;
      return { domain: d, total: dTasks.length, completed, overdue, compRate };
    }).sort((a, b) => b.total - a.total);
  }, [domains, tasks]);

  // Member Workload
  const memberStats = useMemo(() => {
    return users.map(u => {
      const uTasks = tasks.filter(t => t.assignee_id === u.id);
      const completed = uTasks.filter(t => t.status === 'completed').length;
      const overdue = uTasks.filter(t => t.status === 'overdue' || t.is_overdue).length;
      const compRate = uTasks.length > 0 ? Math.round((completed / uTasks.length) * 100) : 0;
      const domainName = domains.find(d => d.id === u.domain_id)?.name || '—';
      return { user: u, domainName, assigned: uTasks.length, completed, overdue, compRate };
    }).sort((a, b) => b.assigned - a.assigned);
  }, [users, tasks, domains]);

  // Activity Timeline
  const timelineStats = useMemo(() => {
    const last8Weeks = Array.from({ length: 8 }).map((_, i) => startOfWeek(subWeeks(new Date(), 7 - i)));
    const counts = last8Weeks.map(weekStart => {
      const count = tasks.filter(t => 
        t.status === 'completed' && 
        isAfter(new Date(t.updated_at), weekStart) && 
        isBefore(new Date(t.updated_at), subWeeks(weekStart, -1))
      ).length;
      return { label: format(weekStart, 'MMM d'), count };
    });
    const maxCount = Math.max(...counts.map(c => c.count), 1);
    return { counts, maxCount };
  }, [tasks]);

  if (!hydrated) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--color-bg)' }}><div className="spinner" /></div>;
  }

  if (role === 'member') {
    return <AppShell><MemberAnalytics /></AppShell>;
  }

  if (!isAdmin) {
    return <AppShell><div style={{ color: 'var(--color-text-muted)', padding: '24px' }}>Access denied — Admin only</div></AppShell>;
  }

  return (
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h1 className="section-title" style={{ fontSize: '18px' }}>Analytics</h1>
          <p className="section-subtitle">Club-wide task metrics</p>
        </div>

        {/* Row 1: Key stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
          <StatCard label="Total Org Tasks" value={tasks.length} />
          <StatCard label="Completion Rate" value={`${completionRate}%`} accent="var(--color-completed)" />
          <StatCard label="Total Overdue" value={tasks.filter(t => t.is_overdue || t.status === 'overdue').length} accent="var(--color-overdue)" />
          <StatCard label="Critical Priority" value={tasks.filter(t => t.priority === 'critical').length} accent="#ef4444" />
        </div>

        {/* Row 2: Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          <div className="card">
            <h2 className="section-title" style={{ marginBottom: '16px', fontSize: '15px' }}>Tasks by Status</h2>
            <BarChart data={byStatus} total={tasks.length} colorMap={STATUS_COLORS as Record<string, string>} />
          </div>
          <div className="card">
            <h2 className="section-title" style={{ marginBottom: '16px', fontSize: '15px' }}>Tasks by Priority</h2>
            <BarChart data={byPriority} total={tasks.length} colorMap={PRIORITY_COLORS as Record<string, string>} />
          </div>
        </div>

        {/* Row 3: Domain Performance */}
        <div className="card glass-subtle" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border-subtle)' }}>
            <h2 className="section-title" style={{ fontSize: '15px', margin: 0 }}>Domain Performance</h2>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Domain</th><th>Total Tasks</th><th>Completed</th><th>Overdue</th><th>Completion %</th></tr>
              </thead>
              <tbody>
                {domainStats.map(s => (
                  <tr key={s.domain.id}>
                    <td style={{ fontWeight: 500 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.domain.color_hex }} />
                        {s.domain.name}
                      </div>
                    </td>
                    <td>{s.total}</td>
                    <td style={{ color: 'var(--color-completed)' }}>{s.completed}</td>
                    <td style={{ color: s.overdue > 0 ? 'var(--color-overdue)' : 'inherit' }}>{s.overdue}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '32px', fontSize: '12px' }}>{s.compRate}%</span>
                        <div style={{ flex: 1, height: '6px', background: 'var(--color-surface-raised)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${s.compRate}%`, background: 'var(--color-brand)', borderRadius: '3px' }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Row 4: Member Workload */}
        {isExec && (
          <div className="card glass-subtle" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border-subtle)' }}>
              <h2 className="section-title" style={{ fontSize: '15px', margin: 0 }}>Member Workload</h2>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Member</th><th>Domain</th><th>Assigned</th><th>Completed</th><th>Overdue</th><th>Completion %</th></tr>
                </thead>
                <tbody>
                  {memberStats.slice(0, 10).map(s => ( // Show top 10
                    <tr key={s.user.id}>
                      <td style={{ fontWeight: 500 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div className="avatar avatar-xs" style={{ fontSize: '10px' }}>{s.user.full_name[0]}</div>
                          {s.user.full_name}
                        </div>
                      </td>
                      <td style={{ color: 'var(--color-text-muted)' }}>{s.domainName}</td>
                      <td>{s.assigned}</td>
                      <td style={{ color: 'var(--color-completed)' }}>{s.completed}</td>
                      <td style={{ color: s.overdue > 0 ? 'var(--color-overdue)' : 'inherit' }}>{s.overdue}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '32px', fontSize: '12px' }}>{s.compRate}%</span>
                          <div style={{ flex: 1, height: '6px', background: 'var(--color-surface-raised)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${s.compRate}%`, background: 'var(--color-brand)', borderRadius: '3px' }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Row 5: Activity Timeline */}
        <div className="card">
          <h2 className="section-title" style={{ marginBottom: '16px', fontSize: '15px' }}>Tasks Completed (Last 8 Weeks)</h2>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '160px', paddingTop: '20px' }}>
            {timelineStats.counts.map(c => (
              <div key={c.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: '100%' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                  <div style={{ 
                    width: '100%', 
                    height: `${(c.count / timelineStats.maxCount) * 100}%`, 
                    background: 'var(--color-brand)', 
                    borderRadius: '4px 4px 0 0',
                    opacity: 0.8,
                    transition: 'height 0.5s ease'
                  }} />
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{c.label}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </AppShell>
  );
}
