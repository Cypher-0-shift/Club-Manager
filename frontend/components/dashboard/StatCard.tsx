'use client';

import { Task, TaskStatus } from '@/types';

interface StatCardProps {
  label: string;
  value: number | string;
  sub?: string;
  accent?: string;
}

export function StatCard({ label, value, sub, accent }: StatCardProps) {
  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      <span className="stat-value" style={accent ? { color: accent } : undefined}>{value}</span>
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  );
}

export function StatsRow({ tasks }: { tasks: Task[] }) {
  const total     = tasks.length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const overdue   = tasks.filter(t => t.status === 'overdue' || t.is_overdue).length;
  const inprogress = tasks.filter(t => t.status === 'in_progress').length;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
      gap: '16px',
    }}>
      <StatCard label="Total Tasks" value={total} />
      <StatCard label="In Progress" value={inprogress} accent="var(--color-brand)" />
      <StatCard label="Completed" value={completed} accent="var(--color-completed)" />
      <StatCard label="Overdue" value={overdue} accent="var(--color-overdue)" />
    </div>
  );
}

interface StatusBadgeProps { status: TaskStatus; }
export function StatusBadge({ status }: StatusBadgeProps) {
  const labels: Record<TaskStatus, string> = {
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed',
    overdue: 'Overdue',
  };
  return <span className={`badge badge-${status}`}>{labels[status]}</span>;
}

export function SkeletonCard() {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div className="skeleton" style={{ height: '16px', width: '60%' }} />
      <div className="skeleton" style={{ height: '12px', width: '40%' }} />
      <div className="skeleton" style={{ height: '12px', width: '80%' }} />
    </div>
  );
}
