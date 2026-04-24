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
import { useToast } from '@/components/ui/Toast';
import { Search, LayoutGrid, X } from 'lucide-react';
import {
  DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragStartEvent, DragEndEvent, defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { isThisWeek, isThisMonth, isBefore, startOfDay } from 'date-fns';

export function AdminBoard() {
  const { user, boardFilters, setBoardFilter, clearBoardFilters } = useAppStore();
  const { toast } = useToast();
  const qc = useQueryClient();

  const domainId = user?.domain_id;

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks', 'domain', domainId],
    queryFn: () => api.get(`/tasks?domain_id=${domainId}`).then(r => r.data),
    enabled: !!domainId,
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['projects', 'domain', domainId],
    queryFn: () => api.get(`/projects?domain_id=${domainId}`).then(r => r.data),
    enabled: !!domainId,
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users', 'domain', domainId],
    queryFn: () => api.get(`/users?domain_id=${domainId}`).then(r => r.data),
    enabled: !!domainId,
  });

  // Filters from Store
  const { search, status: statusFilter, priority: priorityFilter, assignee: assigneeFilter, project: projectFilter } = boardFilters;
  
  // Local Date Filter
  const [dateFilter, setDateFilter] = useState<'all' | 'this_week' | 'this_month' | 'overdue'>('all');

  const hasFilters = search !== '' || statusFilter !== 'all' || priorityFilter !== 'all' || 
                     assigneeFilter !== 'all' || projectFilter !== 'all' || dateFilter !== 'all';

  const clearFilters = () => {
    clearBoardFilters();
    setDateFilter('all');
  };

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
      if (projectFilter !== 'all' && t.project_id !== projectFilter) return false;
      
      if (dateFilter !== 'all') {
        if (dateFilter === 'overdue' && !t.is_overdue && (!t.deadline || !isBefore(new Date(t.deadline), startOfDay(new Date())))) return false;
        if (t.deadline) {
          const d = new Date(t.deadline);
          if (dateFilter === 'this_week' && !isThisWeek(d)) return false;
          if (dateFilter === 'this_month' && !isThisMonth(d)) return false;
        } else if (dateFilter === 'this_week' || dateFilter === 'this_month') {
          return false;
        }
      }
      return true;
    });
  }, [tasks, search, statusFilter, priorityFilter, assigneeFilter, projectFilter, dateFilter]);

  // Kanban DnD State
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', 'domain', domainId] }),
    onError: (err: Error) => toast(err.message, 'error'),
  });

  function handleDragStart(event: DragStartEvent) {
    const task = filteredTasks.find(t => t.id === event.active.id);
    if (task) setActiveTask(task);
  }

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
      
      {/* Top Header & Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="section-title" style={{ fontSize: '20px', margin: 0 }}>Club Board</h1>
      </div>

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
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
        <select className="form-input" value={assigneeFilter} onChange={e => setBoardFilter('assignee', e.target.value)} style={{ width: 'auto', fontSize: '13px', maxWidth: '140px' }}>
          <option value="all">Assignee: All</option>
          <option value="unassigned">Unassigned</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
        </select>
        <select className="form-input" value={projectFilter} onChange={e => setBoardFilter('project', e.target.value)} style={{ width: 'auto', fontSize: '13px', maxWidth: '140px' }}>
          <option value="all">Project: All</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select className="form-input" value={dateFilter} onChange={e => setDateFilter(e.target.value as any)} style={{ width: 'auto', fontSize: '13px' }}>
          <option value="all">Date: All</option>
          <option value="this_week">Due This Week</option>
          <option value="this_month">Due This Month</option>
          <option value="overdue">Overdue Only</option>
        </select>
        {hasFilters && (
          <button onClick={clearFilters} className="btn btn-sm btn-ghost btn-icon" style={{ color: 'var(--color-critical)' }} title="Clear filters">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, minHeight: 0 }}>
        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', height: '100%' }}>
            {[0, 1, 2, 3].map(i => <div key={i} className="kanban-column glass-subtle animate-pulse" style={{ height: '600px' }} />)}
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', height: '100%', alignItems: 'start' }}>
              {columns.map(status => (
                <KanbanColumn
                  key={status}
                  status={status}
                  tasks={filteredTasks.filter(t => t.status === status)}
                  onTaskClick={setSelectedTask}
                  onAddTask={() => setShowCreateModal(status)}
                  canAdd={status !== 'overdue'}
                />
              ))}
            </div>
            <DragOverlay dropAnimation={{ duration: 150, easing: 'cubic-bezier(0.18,0.67,0.6,1.22)' }}>
              {activeTask ? (
                <div style={{ filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.4))', transform: 'scale(1.02)' }}>
                  <TaskCard task={activeTask} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
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
          defaultStatus={showCreateModal}
          onClose={() => setShowCreateModal(null)}
          onSuccess={() => { setShowCreateModal(null); qc.invalidateQueries({ queryKey: ['tasks'] }); }}
        />
      )}
    </div>
  );
}
