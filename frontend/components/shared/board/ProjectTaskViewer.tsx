'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { Task, TaskStatus, TaskPriority, Project, User } from '@/types';
import { KanbanColumn } from '@/components/shared/board/KanbanColumn';
import { TaskCard } from '@/components/shared/board/TaskCard';
import { TaskModal } from '@/components/tasks/TaskModal';
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal';
import { TaskTable } from '@/components/admin/TaskTable';
import { useToast } from '@/components/ui/Toast';
import { Search, LayoutGrid, List, X, Filter } from 'lucide-react';
import {
  DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragStartEvent, DragEndEvent
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { isThisWeek, isThisMonth, isBefore, startOfDay } from 'date-fns';

interface ProjectTaskViewerProps {
  projectId: string;
}

export function ProjectTaskViewer({ projectId }: ProjectTaskViewerProps) {
  const { user, boardFilters, setBoardFilter, clearBoardFilters } = useAppStore();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  // ═══════════════════════════════════════════════════════════
  // FIX 11: Clear filters on component unmount to prevent stale state
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    return () => {
      clearBoardFilters();
    };
  }, [clearBoardFilters]);

  const { data: project } = useQuery<Project>({
    queryKey: ['project', projectId],
    queryFn: () => api.get(`/projects/${projectId}`).then(r => r.data),
    enabled: !!projectId,
  });

  const domainId = project?.domain_id;

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks', 'project', projectId],
    queryFn: () => api.get(`/tasks?project_id=${projectId}`).then(r => r.data),
    enabled: !!projectId,
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users', 'domain', domainId],
    queryFn: () => api.get(`/users?domain_id=${domainId}`).then(r => r.data),
    enabled: !!domainId,
  });

  // Filters from Store
  const { search, status: statusFilter, priority: priorityFilter, assignee: assigneeFilter } = boardFilters;
  const [dateFilter, setDateFilter] = useState<'all' | 'this_week' | 'this_month' | 'overdue'>('all');

  const hasFilters = search !== '' || statusFilter !== 'all' || priorityFilter !== 'all' || 
                     assigneeFilter !== 'all' || dateFilter !== 'all';

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && 
          !(t.description?.toLowerCase().includes(search.toLowerCase()))) return false;
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      if (assigneeFilter !== 'all') {
        if (assigneeFilter === 'unassigned' && t.assignee_id) return false;
        if (assigneeFilter !== 'unassigned' && t.assignee_id !== assigneeFilter) return false;
      }
      
      if (dateFilter !== 'all') {
        if (dateFilter === 'overdue' && !t.is_overdue) return false;
        if (t.deadline) {
          const d = new Date(t.deadline);
          if (dateFilter === 'this_week' && !isThisWeek(d)) return false;
          if (dateFilter === 'this_month' && !isThisMonth(d)) return false;
        } else if (dateFilter !== 'overdue') return false;
      }
      return true;
    });
  }, [tasks, search, statusFilter, priorityFilter, assigneeFilter, dateFilter]);

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<TaskStatus | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const updateStatusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) => 
      api.patch(`/tasks/${taskId}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', 'project', projectId] }),
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;
    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== newStatus) {
      updateStatusMutation.mutate({ taskId, status: newStatus });
    }
  }

  const columns: TaskStatus[] = ['pending', 'in_progress', 'completed', 'overdue'];

  const isAdmin = ['president', 'vp', 'secretary'].includes(user?.role ?? '');
  const isLeadOfThisDomain = user?.role === 'lead' && String(user?.domain_id) === String(domainId);
  const canCreate = isAdmin || isLeadOfThisDomain;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>{project?.name || 'Project Board'}</h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{project?.description || 'Manage your project tasks'}</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {canCreate && (
            <button 
              className="btn btn-primary" 
              onClick={() => setShowCreateModal('pending')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', height: '36px' }}
            >
              + Create Task
            </button>
          )}

          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <button 
              onClick={() => setViewMode('kanban')}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                background: viewMode === 'kanban' ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: viewMode === 'kanban' ? '#fff' : 'var(--color-text-muted)',
                border: 'none', cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              <LayoutGrid size={14} /> Kanban
            </button>
            <button 
              onClick={() => setViewMode('table')}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                background: viewMode === 'table' ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: viewMode === 'table' ? '#fff' : 'var(--color-text-muted)',
                border: 'none', cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              <List size={14} /> Table
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{
        display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap',
        background: 'rgba(255,255,255,0.02)', padding: '12px',
        borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)'
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input className="form-input" placeholder="Search tasks..." value={search} onChange={e => setBoardFilter('search', e.target.value)} style={{ paddingLeft: '36px' }} />
        </div>
        <select className="form-input" value={statusFilter} onChange={e => setBoardFilter('status', e.target.value)} style={{ width: 'auto', fontSize: '13px' }}>
          <option value="all">Status: All</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="overdue">Overdue</option>
        </select>
        <select className="form-input" value={priorityFilter} onChange={e => setBoardFilter('priority', e.target.value)} style={{ width: 'auto', fontSize: '13px' }}>
          <option value="all">Priority: All</option>
          {['low', 'medium', 'high', 'critical'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
        </select>
        <select className="form-input" value={assigneeFilter} onChange={e => setBoardFilter('assignee', e.target.value)} style={{ width: 'auto', fontSize: '13px', maxWidth: '140px' }}>
          <option value="all">Assignee: All</option>
          <option value="unassigned">Unassigned</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
        </select>
        <select className="form-input" value={dateFilter} onChange={e => setDateFilter(e.target.value as any)} style={{ width: 'auto', fontSize: '13px' }}>
          <option value="all">Date: All</option>
          <option value="this_week">Due This Week</option>
          <option value="this_month">Due This Month</option>
          <option value="overdue">Overdue Only</option>
        </select>
        {hasFilters && (
          <button onClick={() => { clearBoardFilters(); setDateFilter('all'); }} className="btn btn-sm btn-ghost btn-icon" style={{ color: 'var(--color-critical)' }}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, minHeight: 0 }}>
        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', height: '100%' }}>
            {[0, 1, 2, 3].map(i => <div key={i} className="kanban-column glass-subtle animate-pulse" style={{ height: '600px' }} />)}
          </div>
        ) : viewMode === 'kanban' ? (
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={e => {
            const task = filteredTasks.find(t => t.id === e.active.id);
            if (task) setActiveTask(task);
          }} onDragEnd={handleDragEnd}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', height: '100%', alignItems: 'start' }}>
              {columns.map(status => (
                <KanbanColumn
                  key={status}
                  status={status}
                  tasks={filteredTasks.filter(t => t.status === status)}
                  onTaskClick={setSelectedTask}
                  onAddTask={() => setShowCreateModal(status)}
                  canAdd={canCreate && status !== 'overdue'}
                />
              ))}
            </div>
            <DragOverlay dropAnimation={{ duration: 150 }}>
              {activeTask ? <TaskCard task={activeTask} /> : null}
            </DragOverlay>
          </DndContext>
        ) : (
          <TaskTable tasks={filteredTasks} onTaskClick={setSelectedTask} />
        )}
      </div>

      {selectedTask && (
        <TaskModal 
          task={selectedTask} 
          onClose={() => setSelectedTask(null)} 
          onSubmit={() => { setSelectedTask(null); qc.invalidateQueries({ queryKey: ['tasks'] }); }}
        />
      )}

      {showCreateModal && domainId && (
        <CreateTaskModal
          domainId={domainId}
          forcedProjectId={projectId}
          defaultStatus={showCreateModal}
          onClose={() => setShowCreateModal(null)}
          onSuccess={() => { setShowCreateModal(null); qc.invalidateQueries({ queryKey: ['tasks'] }); }}
        />
      )}
    </div>
  );
}
