'use client';

import { useState, useMemo } from 'react';
import { Task, TaskPriority, TaskStatus, PRIORITY_COLORS, STATUS_LABELS } from '@/types';
import { format } from 'date-fns';
import { Search, Filter, ArrowUpDown, ChevronDown, CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface TaskTableProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

type SortField = 'title' | 'status' | 'priority' | 'deadline' | 'assignee';

export function TaskTable({ tasks, onTaskClick }: TaskTableProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('deadline');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const { data: allDomains = [] } = useQuery<any[]>({
    queryKey: ['domains'],
    queryFn: () => api.get('/domains').then(r => r.data),
  });

  const domainColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    allDomains.forEach(d => { map[d.id] = d.color_hex; });
    return map;
  }, [allDomains]);

  const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
  const statusWeight = { overdue: 4, in_progress: 3, pending: 2, completed: 1 };

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
        (t.description?.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortField === 'title') comparison = a.title.localeCompare(b.title);
      else if (sortField === 'status') comparison = statusWeight[a.status] - statusWeight[b.status];
      else if (sortField === 'priority') comparison = priorityWeight[a.priority] - priorityWeight[b.priority];
      else if (sortField === 'deadline') comparison = (a.deadline || '').localeCompare(b.deadline || '');
      else if (sortField === 'assignee') comparison = (a.assignee?.full_name || '').localeCompare(b.assignee?.full_name || '');

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [tasks, search, statusFilter, priorityFilter, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const StatusIcon = ({ status }: { status: TaskStatus }) => {
    switch (status) {
      case 'completed': return <CheckCircle2 size={14} color="var(--color-completed)" />;
      case 'in_progress': return <Clock size={14} color="var(--color-brand)" />;
      case 'overdue': return <AlertCircle size={14} color="var(--color-overdue)" />;
      default: return <Circle size={14} color="var(--color-pending)" />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Filters Toolbar */}
      <div style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        flexWrap: 'wrap',
        background: 'rgba(255,255,255,0.02)',
        padding: '12px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border-subtle)'
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            className="form-input"
            placeholder="Search tasks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <select
            className="form-input"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            style={{ width: 'auto', fontSize: '13px' }}
          >
            <option value="all">Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>

          <select
            className="form-input"
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value as any)}
            style={{ width: 'auto', fontSize: '13px' }}
          >
            <option value="all">Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
          Showing {filteredTasks.length} tasks
        </div>
      </div>

      {/* Table */}
      <div className="card glass-subtle" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--color-border-subtle)' }}>
              <tr>
                <th
                  onClick={() => handleSort('title')}
                  style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-muted)', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Task {sortField === 'title' && <ArrowUpDown size={12} />}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('assignee')}
                  style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-muted)', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Assignee {sortField === 'assignee' && <ArrowUpDown size={12} />}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('status')}
                  style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-muted)', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Status {sortField === 'status' && <ArrowUpDown size={12} />}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('priority')}
                  style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-muted)', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Priority {sortField === 'priority' && <ArrowUpDown size={12} />}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('deadline')}
                  style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-muted)', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Deadline {sortField === 'deadline' && <ArrowUpDown size={12} />}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map(t => (
                <tr
                  key={t.id}
                  onClick={() => onTaskClick(t)}
                  style={{ borderBottom: '1px solid var(--color-border-subtle)', cursor: 'pointer', transition: 'background 0.2s' }}
                  className="table-row-hover"
                >
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 500 }}>{t.title}</div>
                    {t.description && <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }} className="text-truncate-1">{t.description}</div>}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="avatar avatar-xs" style={{ fontSize: '10px' }}>{(t.assignee?.full_name ?? 'U')[0]}</div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ 
                          fontWeight: 500, 
                          color: t.assignee ? (domainColorMap[t.assignee.domain_id || ''] || 'inherit') : 'inherit' 
                        }}>
                          {t.assignee?.full_name ?? 'Unassigned'}
                        </span>
                        {t.assignee && (
                          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
                            {t.assignee.role}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <StatusIcon status={t.status} />
                      <span className={`badge badge-${t.status}`} style={{ fontSize: '10px' }}>{t.status.replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: PRIORITY_COLORS[t.priority] }} />
                      <span style={{ textTransform: 'capitalize' }}>{t.priority}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', color: t.is_overdue ? 'var(--color-overdue)' : 'var(--color-text-muted)' }}>
                    {t.deadline ? format(new Date(t.deadline), 'MMM d, HH:mm') : '—'}
                  </td>
                </tr>
              ))}
              {filteredTasks.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    No tasks match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .table-row-hover:hover { background: rgba(255,255,255,0.02); }
        .text-truncate-1 { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  );
}
