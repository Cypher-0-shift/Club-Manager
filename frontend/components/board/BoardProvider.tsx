'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DndContext, closestCorners, DragEndEvent, DragOverlay, DragStartEvent,
} from '@dnd-kit/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/components/ui/Toast';
import { Task, TaskStatus } from '@/types';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { TaskModal } from '@/components/tasks/TaskModal';
import { SubmissionGate } from '@/components/tasks/SubmissionGate';
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal';
import { canCreateTasks } from '@/types';

const COLUMNS: TaskStatus[] = ['pending', 'in_progress', 'completed', 'overdue'];

export function BoardProvider() {
  const { user, role, domainId } = useAppStore();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [submissionTask, setSubmissionTask] = useState<Task | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createStatus, setCreateStatus] = useState<TaskStatus>('pending');

  // Fetch tasks — members get /tasks/my; leads/execs get /tasks?domain_id=...
  const queryKey = role === 'member' ? ['my-tasks'] : ['tasks', domainId];
  const queryFn = role === 'member'
    ? () => api.get('/tasks/my').then(r => r.data)
    : () => api.get(domainId ? `/tasks?domain_id=${domainId}` : '/tasks').then(r => r.data);

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey,
    queryFn,
    enabled: !!user,
  });

  // Supabase Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('tasks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
        qc.invalidateQueries({ queryKey });

        // Toast when task becomes overdue
        if (payload.eventType === 'UPDATE') {
          const newRec = payload.new as Partial<Task>;
          const oldRec = payload.old as Partial<Task>;
          if (newRec.is_overdue && !oldRec.is_overdue) {
            toast(`Task "${newRec.title}" is now overdue!`, 'error');
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [domainId]);

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      api.patch(`/tasks/${id}/status`, { status }),
    onError: (err: Error) => {
      toast(err.message, 'error');
      qc.invalidateQueries({ queryKey });
    },
  });

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    if (task) setActiveTask(task);
  }, [tasks]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const task = tasks.find(t => t.id === active.id);
    const newStatus = over.id as TaskStatus;

    if (!task || task.status === newStatus) return;
    if (!COLUMNS.includes(newStatus)) return;

    // Optimistic update
    qc.setQueryData<Task[]>(queryKey, old =>
      old?.map(t => t.id === task.id ? { ...t, status: newStatus } : t) ?? []
    );

    if (newStatus === 'completed') {
      setSubmissionTask({ ...task, status: newStatus });
    } else {
      statusMutation.mutate({ id: task.id, status: newStatus });
    }
  }, [tasks, queryKey]);

  function groupByStatus(tasks: Task[]): Record<TaskStatus, Task[]> {
    const groups: Record<TaskStatus, Task[]> = { pending: [], in_progress: [], completed: [], overdue: [] };
    for (const t of tasks) groups[t.status as TaskStatus].push(t);
    return groups;
  }

  const grouped = groupByStatus(tasks);
  const canAdd = canCreateTasks(role ?? 'member');

  if (isLoading) {
    return (
      <div style={{ display: 'flex', gap: '16px', height: '100%', padding: '4px' }}>
        {COLUMNS.map(c => (
          <div key={c} style={{
            flex: '0 0 280px', borderRadius: 'var(--radius-md)',
            background: 'var(--color-surface)', border: '1px solid var(--color-border-subtle)',
            overflow: 'hidden',
          }}>
            <div className="kanban-header">
              <div className="skeleton" style={{ height: '12px', width: '80px' }} />
              <div className="skeleton" style={{ height: '20px', width: '28px', borderRadius: '999px' }} />
            </div>
            <div className="kanban-body" style={{ gap: '8px' }}>
              {[1,2,3].map(i => (
                <div key={i} className="skeleton" style={{ height: '80px', borderRadius: 'var(--radius-sm)' }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <DndContext
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-board" style={{ height: 'calc(100vh - var(--topbar-height) - 80px)' }}>
          {COLUMNS.map(status => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={grouped[status] ?? []}
              onTaskClick={(t) => setSelectedTask(t)}
              canAdd={canAdd}
              onAddTask={() => { setCreateStatus(status); setShowCreate(true); }}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && (
            <div style={{ opacity: 0.85, cursor: 'grabbing' }}>
              <TaskCard task={activeTask} onClick={() => {}} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Task detail modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onSubmit={() => { setSubmissionTask(selectedTask); setSelectedTask(null); }}
        />
      )}

      {/* Submission gate */}
      {submissionTask && (
        <SubmissionGate
          task={submissionTask}
          onClose={() => {
            setSubmissionTask(null);
            qc.invalidateQueries({ queryKey });
          }}
          onSuccess={() => {
            statusMutation.mutate({ id: submissionTask.id, status: 'completed' });
            setSubmissionTask(null);
            qc.invalidateQueries({ queryKey });
          }}
        />
      )}

      {/* Create task */}
      {showCreate && canAdd && (
        <CreateTaskModal
          defaultStatus={createStatus}
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false);
            qc.invalidateQueries({ queryKey });
          }}
        />
      )}
    </>
  );
}
