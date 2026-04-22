'use client';

import { AppShell } from '@/components/layout/AppShell';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { Task, TaskStatus, TaskPriority } from '@/types';
import { StatCard } from '@/components/dashboard/StatCard';
import { useAuthHydration } from '@/hooks/useAuthHydration';

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

  const isAdmin = ['president', 'vp', 'secretary'].includes(role ?? '');

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['all-tasks'],
    queryFn: () => api.get('/tasks').then(r => r.data),
    enabled: hydrated && isAdmin,
  });

  if (!hydrated) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--color-bg)',
      }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!isAdmin) {
    return <AppShell><div style={{ color: 'var(--color-text-muted)', padding: '24px' }}>Access denied — Admin only</div></AppShell>;
  }

  const byStatus = STATUS_ORDER.map(s => [s, tasks.filter(t => t.status === s).length] as [string, number]);
  const byPriority = PRIORITY_ORDER.map(p => [p, tasks.filter(t => t.priority === p).length] as [string, number]);
  const completionRate = tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0;

  return (
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h1 className="section-title" style={{ fontSize: '18px' }}>Analytics</h1>
          <p className="section-subtitle">Club-wide task metrics</p>
        </div>

        {/* Key stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
          <StatCard label="Total Tasks" value={tasks.length} />
          <StatCard label="Completion Rate" value={`${completionRate}%`} accent="var(--color-completed)" />
          <StatCard label="Overdue" value={tasks.filter(t => t.is_overdue || t.status === 'overdue').length} accent="var(--color-overdue)" />
          <StatCard label="Critical Priority" value={tasks.filter(t => t.priority === 'critical').length} accent="#ef4444" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* By status */}
          <div className="card">
            <h2 className="section-title" style={{ marginBottom: '16px', fontSize: '15px' }}>Tasks by Status</h2>
            <BarChart data={byStatus} total={tasks.length} colorMap={STATUS_COLORS as Record<string, string>} />
          </div>

          {/* By priority */}
          <div className="card">
            <h2 className="section-title" style={{ marginBottom: '16px', fontSize: '15px' }}>Tasks by Priority</h2>
            <BarChart data={byPriority} total={tasks.length} colorMap={PRIORITY_COLORS as Record<string, string>} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
