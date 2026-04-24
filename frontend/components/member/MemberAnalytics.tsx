'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { Task, Domain, Submission } from '@/types';
import { StatsRow, SkeletonCard } from '@/components/dashboard/StatCard';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie 
} from 'recharts';

export function MemberAnalytics() {
  const { user } = useAppStore();

  // 1. Fetch domain list for naming
  const { data: domains = [] } = useQuery<Domain[]>({
    queryKey: ['domains'],
    queryFn: () => api.get('/domains').then(r => r.data),
    enabled: !!user,
  });

  interface AnalyticsResponse {
    total: number;
    completed: number;
    overdue: number;
    by_status: Record<string, number>;
    by_priority: Record<string, number>;
    completion_rate: number;
    is_org_wide: boolean;
    submissions: Submission[];
  }

  // 2. Fetch specialized member analytics data
  const { data: analytics, isLoading, error } = useQuery<AnalyticsResponse>({
    queryKey: ['analytics', 'me'],
    queryFn: () => api.get('/tasks/analytics/me').then(r => r.data),
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {[0, 1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
        <SkeletonCard style={{ height: '300px' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-overdue)' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Error loading analytics</h3>
        <p style={{ fontSize: '14px', marginTop: '8px', opacity: 0.8 }}>{(error as any).message || 'Please try again later'}</p>
      </div>
    );
  }

  if (!analytics) return null;

  const { total, completed, overdue, by_status, by_priority, completion_rate, submissions, is_org_wide } = analytics;

  // Show empty state if member has no tasks
  if (total === 0 && !is_org_wide) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>Your Performance</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
            Overview of your task contributions and completion metrics.
          </p>
        </div>
        <div style={{ 
          padding: '80px 40px', 
          textAlign: 'center', 
          background: '#171717', 
          border: '1px solid rgba(255,255,255,0.07)', 
          borderRadius: '12px' 
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>📊</div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>No Tasks Assigned Yet</h3>
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Once you're assigned tasks, your performance analytics will appear here.
          </p>
        </div>
      </div>
    );
  }

  const isPresident = user?.role === 'president';

  // Prepare chart data
  const statusData = Object.entries(by_status || {}).map(([name, value]) => ({ 
    name: name.replace('_', ' '), 
    value 
  }));
  const priorityData = Object.entries(by_priority || {}).map(([name, value]) => ({ name, value }));

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>
          {is_org_wide ? 'Organization Overview' : 'Your Performance'}
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
          {is_org_wide 
            ? 'Real-time metrics and task distribution across the entire organization.' 
            : 'Overview of your task contributions and completion metrics.'
          }
        </p>
      </div>

      <StatsRow 
        tasks={[]} // We pass raw numbers below instead
        customStats={[
          { label: is_org_wide ? 'Total Tasks' : 'Total Assigned', value: total, trend: 'total' },
          { label: 'Completed', value: completed, trend: 'up' },
          { label: 'Overdue', value: overdue, trend: 'down' },
          { label: 'Success Rate', value: `${completion_rate}%`, trend: 'neutral' },
        ]}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
        {/* Status Distribution */}
        <div style={{ background: '#171717', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
            Task Distribution
          </h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ background: '#262626', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {statusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Breakdown */}
        <div style={{ background: '#171717', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
            Priority Split
          </h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {priorityData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ background: '#262626', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Submissions */}
      <div style={{ background: '#171717', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
            Recent Activity
          </h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.07)', color: 'var(--color-text-muted)' }}>
              <th style={{ padding: '16px 24px', fontWeight: 500 }}>Task</th>
              {is_org_wide && <th style={{ padding: '16px 24px', fontWeight: 500 }}>Member</th>}
              <th style={{ padding: '16px 24px', fontWeight: 500 }}>Type</th>
              <th style={{ padding: '16px 24px', fontWeight: 500 }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {submissions.length === 0 ? (
              <tr>
                <td colSpan={is_org_wide ? 4 : 3} style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  No recent activity found.
                </td>
              </tr>
            ) : (
              submissions.slice(0, 10).map((s: Submission) => (
                <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '16px 24px', fontWeight: 500 }}>{s.tasks?.title || 'Unknown Task'}</td>
                  {is_org_wide && (
                    <td style={{ padding: '16px 24px', color: '#fff' }}>
                      {s.submitter?.full_name || 'System'}
                    </td>
                  )}
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ 
                      background: 'rgba(255,255,255,0.05)', 
                      padding: '2px 8px', 
                      borderRadius: '4px',
                      fontSize: '11px',
                      textTransform: 'capitalize'
                    }}>
                      {s.type}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px', color: 'var(--color-text-muted)' }}>
                    {new Date(s.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
