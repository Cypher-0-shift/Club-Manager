'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { QK } from '@/lib/queryKeys';
import { SkeletonCard, StatCard } from '@/components/dashboard/StatCard';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Task, Domain, PRIORITY_COLORS } from '@/types';
import Link from 'next/link';

export function MemberDashboard() {
  const { user } = useAppStore();

  const { data: myTasks = [], isLoading } = useQuery<Task[]>({
    queryKey: QK.tasks.mine(),
    queryFn: () => api.get('/tasks/my').then(r => r.data),
    enabled: !!user,
  });

  const { data: domains = [] } = useQuery<Domain[]>({
    queryKey: ['all-domains'],
    queryFn: () => api.get('/domains').then(r => r.data),
  });

  const domainName = domains.find(d => String(d.id).toLowerCase() === String(user?.domain_id || '').toLowerCase())?.name || 'Domain';
  const firstName = user?.full_name?.split(' ')[0] ?? 'there';

  const totalTasks = myTasks.length;
  const completedTasks = myTasks.filter(t => t.status === 'completed').length;
  const highPriority = myTasks.filter(t => t.priority === 'high' || t.priority === 'critical').length;
  const overdueTasks = myTasks.filter(t => t.is_overdue || t.status === 'overdue');
  
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const getCol = (statusFilter: string[]) => myTasks
    .filter(t => statusFilter.includes(t.status))
    .slice(0, 3);

  const todo = getCol(['pending']);
  const inProgress = getCol(['in_progress']);
  const done = getCol(['completed']);

  const statusCounts = {
    pending: myTasks.filter(t => t.status === 'pending').length,
    in_progress: myTasks.filter(t => t.status === 'in_progress').length,
    completed: completedTasks,
    overdue: overdueTasks.length,
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>
          Hello, {firstName} 👋
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
          {user?.role} · {domainName}
        </p>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>{[0,1,2].map(i => <SkeletonCard key={i} />)}</div>
      ) : (
        <>
          {/* Row 1: Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
            <StatCard label="My Total Tasks" value={totalTasks} />
            <StatCard label="Pending" value={statusCounts.pending} accent="var(--color-pending)" />
            <StatCard label="Completed" value={completedTasks} accent="var(--color-completed)" />
            <StatCard label="High Priority" value={highPriority} accent="var(--color-critical)" />
          </div>

          {/* Row 2: Deadline Alert */}
          {overdueTasks.length > 0 && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: '16px',
            }}>
              <AlertCircle size={20} color="var(--color-critical)" />
              <span style={{ fontSize: '14px', flex: 1, color: 'var(--color-critical)', fontWeight: 500 }}>
                {overdueTasks.length} task(s) are overdue
              </span>
              <Link href="/board?filter=overdue" className="btn btn-sm" style={{ background: 'var(--color-critical)', color: 'white', textDecoration: 'none' }}>
                View Tasks
              </Link>
            </div>
          )}

          {/* Row 3: My Tasks Quick View */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 className="section-title">My Tasks Quick View</h2>
              <Link href="/board" className="btn btn-sm btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}>
                View all <ArrowRight size={14} />
              </Link>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {[
                { title: 'To Do', items: todo },
                { title: 'In Progress', items: inProgress },
                { title: 'Done', items: done }
              ].map(col => (
                <div key={col.title} className="card glass-subtle" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '200px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {col.title}
                  </h3>
                  {col.items.length > 0 ? col.items.map((t: Task) => (
                    <div key={t.id} style={{ 
                      background: 'var(--color-surface-hover)', 
                      padding: '12px', 
                      borderRadius: '8px',
                      border: '1px solid var(--color-border-subtle)',
                      display: 'flex', flexDirection: 'column', gap: '8px'
                    }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: PRIORITY_COLORS[t.priority], flexShrink: 0, marginTop: '5px' }} />
                        <span style={{ fontSize: '13px', fontWeight: 500, lineHeight: 1.4 }} className="text-truncate-2">
                          {t.title}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: t.is_overdue || t.status === 'overdue' ? 'var(--color-overdue)' : 'var(--color-text-muted)', marginLeft: '16px' }}>
                        {t.deadline ? new Date(t.deadline).toLocaleDateString() : 'No deadline'}
                      </div>
                    </div>
                  )) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '13px', fontStyle: 'italic' }}>
                      Empty
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Row 4: My Progress */}
          <div className="card glass-subtle">
            <h2 className="section-title" style={{ marginBottom: '24px' }}>My Progress</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '48px', flexWrap: 'wrap' }}>
              
              <div style={{ 
                width: '120px', height: '120px', borderRadius: '50%', 
                background: `conic-gradient(var(--color-brand) ${completionRate}%, var(--color-surface-raised) 0)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative'
              }}>
                <div style={{ 
                  width: '96px', height: '96px', borderRadius: '50%', 
                  background: 'var(--color-surface)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                }}>
                  <span style={{ fontSize: '24px', fontWeight: 700 }}>{completionRate}%</span>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Completed</span>
                </div>
              </div>

              <div style={{ flex: 1, minWidth: '250px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', height: '12px', borderRadius: '6px', overflow: 'hidden', background: 'var(--color-surface-raised)' }}>
                  {totalTasks > 0 && (
                    <>
                      <div style={{ width: `${(statusCounts.completed / totalTasks) * 100}%`, background: 'var(--color-completed)' }} title={`Completed: ${statusCounts.completed}`} />
                      <div style={{ width: `${(statusCounts.in_progress / totalTasks) * 100}%`, background: 'var(--color-brand)' }} title={`In Progress: ${statusCounts.in_progress}`} />
                      <div style={{ width: `${(statusCounts.pending / totalTasks) * 100}%`, background: 'var(--color-pending)' }} title={`Pending: ${statusCounts.pending}`} />
                      <div style={{ width: `${(statusCounts.overdue / totalTasks) * 100}%`, background: 'var(--color-overdue)' }} title={`Overdue: ${statusCounts.overdue}`} />
                    </>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--color-completed)' }} /> Completed ({statusCounts.completed})</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--color-brand)' }} /> In Progress ({statusCounts.in_progress})</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--color-pending)' }} /> To Do ({statusCounts.pending})</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--color-overdue)' }} /> Overdue ({statusCounts.overdue})</div>
                </div>
              </div>

            </div>
          </div>
        </>
      )}

      <style jsx>{`
        .text-truncate-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </motion.div>
  );
}
