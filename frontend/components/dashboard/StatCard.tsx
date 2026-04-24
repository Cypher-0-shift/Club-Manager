'use client';

import { Task, TaskStatus } from '@/types';

import { CountUp } from '@/components/ui/CountUp';
import { motion } from 'framer-motion';

interface StatCardProps {
  label: string;
  value: number | string;
  sub?: string;
  accent?: string;
}

export function StatCard({ label, value, sub, accent }: StatCardProps) {
  return (
    <motion.div 
      className="stat-card"
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      <span className="stat-label">{label}</span>
      <span className="stat-value font-display" style={accent ? { color: accent } : undefined}>
        {typeof value === 'number' ? <CountUp to={value} /> : value}
      </span>
      {sub && <span className="stat-sub">{sub}</span>}
    </motion.div>
  );
}

export function StatsRow({ tasks, customStats }: { tasks?: Task[]; customStats?: { label: string; value: number | string; trend?: string; accent?: string }[] }) {
  if (customStats) {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '16px',
      }}>
        {customStats.map((s, i) => (
          <StatCard key={i} label={s.label} value={s.value} accent={s.accent} />
        ))}
      </div>
    );
  }

  const taskList = tasks || [];
  const total     = taskList.length;
  const completed = taskList.filter(t => t.status === 'completed').length;
  const overdue   = taskList.filter(t => t.status === 'overdue' || t.is_overdue).length;
  const inprogress = taskList.filter(t => t.status === 'in_progress').length;

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

export function SkeletonCard({ style }: { style?: React.CSSProperties }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px', ...style }}>
      <div className="skeleton" style={{ height: '16px', width: '60%' }} />
      <div className="skeleton" style={{ height: '12px', width: '40%' }} />
      <div className="skeleton" style={{ height: '12px', width: '80%' }} />
    </div>
  );
}
