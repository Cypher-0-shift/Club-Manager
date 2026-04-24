'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { Task, TaskStatus } from '@/types';
import { KanbanColumn } from '@/components/shared/board/KanbanColumn';
import { TaskCard } from '@/components/shared/board/TaskCard';
import { TaskModal } from '@/components/tasks/TaskModal';
import { useToast } from '@/components/ui/Toast';
import { Search, ArrowUpDown, X } from 'lucide-react';
import {
  DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

export function MyBoardView() {
  const { user, role, boardFilters, setBoardFilter, clearBoardFilters } = useAppStore();
  const { toast } = useToast();
  const qc = useQueryClient();

  const isPresident = role === 'president';

  // President sees all organization tasks, others see only their assigned tasks
  const { data: myTasks = [], isLoading } = useQuery<Task[]>({
    queryKey: isPresident ? ['all-tasks'] : ['my-tasks'],
    queryFn: () => {
      const endpoint = isPresident ? '/tasks?limit=5000' : '/tasks/my';
      return api.get(endpoint).then(r => r.data);
    },
    enabled: !!user,
  });

  const { search, status: statusFilter, priority: priorityFilter, sort: sortField, sortDir: sortOrder } = boardFilters;

  // ═══════════════════════════════════════════════════════════
  // FIX 11: Clear filters on component unmount to prevent stale state
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    return () => {
      // Cleanup: Clear filters when leaving this view
      // This prevents filters from persisting incorrectly across different board views
      clearBoardFilters();
    };
  }, [clearBoardFilters]);

  const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };

  const filteredTasks = useMemo(() => {
    return myTasks.filter(t => {
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      return true;
    }).sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;

      let comparison = 0;
      if (sortField === 'title') comparison = a.title.localeCompare(b.title);
      else if (sortField === 'priority') comparison = priorityWeight[a.priority] - priorityWeight[b.priority];
      else if (sortField === 'deadline') comparison = (a.deadline || '').localeCompare(b.deadline || '');
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [myTasks, search, statusFilter, priorityFilter, sortField, sortOrder]);

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const updateStatusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) => 
      api.patch(`/tasks/${taskId}/status`, { status }),
    onSuccess: () => {
      const queryKey = isPresident ? ['all-tasks'] : ['my-tasks'];
      qc.invalidateQueries({ queryKey });
    },
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;
    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;
    const task = myTasks.find(t => t.id === taskId);
    if (task && task.status !== newStatus) {
      updateStatusMutation.mutate({ taskId, status: newStatus });
    }
  }

  const columns: TaskStatus[] = ['pending', 'in_progress', 'completed', 'overdue'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>
            {isPresident ? 'Organization Board' : 'My Personal Board'}
          </h1>
          {isPresident && (
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              All tasks across the organization
            </p>
          )}
        </div>
      </div>

      <div style={{
        display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap',
        background: 'rgba(255,255,255,0.02)', padding: '12px',
        borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)'
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input 
            className="form-input" 
            placeholder={isPresident ? "Search all tasks..." : "Search my tasks..."} 
            value={search} 
            onChange={e => setBoardFilter('search', e.target.value)} 
            style={{ paddingLeft: '36px' }} 
          />
        </div>
        
        <select className="form-input" value={statusFilter} onChange={e => setBoardFilter('status', e.target.value)} style={{ width: 'auto', fontSize: '13px' }}>
          <option value="all">Status: All</option>
          <option value="pending">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Done</option>
          <option value="overdue">Overdue</option>
        </select>
        
        <select className="form-input" value={priorityFilter} onChange={e => setBoardFilter('priority', e.target.value)} style={{ width: 'auto', fontSize: '13px' }}>
          <option value="all">Priority: All</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>

        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <select className="form-input" value={sortField} onChange={e => setBoardFilter('sort', e.target.value)} style={{ width: 'auto', fontSize: '13px' }}>
            <option value="deadline">Sort: Deadline</option>
            <option value="priority">Sort: Priority</option>
            <option value="title">Sort: Title</option>
          </select>
          <button 
            className="btn btn-sm btn-icon btn-ghost" 
            onClick={() => setBoardFilter('sortDir', sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            <ArrowUpDown size={16} style={{ transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'none' }} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', height: '100%' }}>
            {[0, 1, 2, 3].map(i => <div key={i} className="kanban-column glass-subtle animate-pulse" style={{ height: '600px' }} />)}
          </div>
        ) : (
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
                  canAdd={false}
                />
              ))}
            </div>
            <DragOverlay dropAnimation={{ duration: 150 }}>
              {activeTask ? <TaskCard task={activeTask} /> : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {selectedTask && (
        <TaskModal 
          task={selectedTask} 
          onClose={() => setSelectedTask(null)} 
          onSubmit={() => { 
            setSelectedTask(null); 
            const queryKey = isPresident ? ['all-tasks'] : ['my-tasks'];
            qc.invalidateQueries({ queryKey }); 
          }}
        />
      )}
    </div>
  );
}
