'use client';

import { useState, useMemo } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragStartEvent, 
  DragEndEvent, 
  defaultDropAnimationSideEffects 
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/components/ui/Toast';
import { useSearchParams } from 'next/navigation';
import { Task, TaskStatus } from '@/types';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { TaskModal } from '@/components/tasks/TaskModal';
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal';
import { LEAD_AND_ABOVE } from '@/types';
import { StatsRow } from '@/components/dashboard/StatCard';

export function BoardProvider({ domainId }: { domainId?: string }) {
  const { user, role } = useAppStore();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project_id');
  const { toast } = useToast();
  const qc = useQueryClient();

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<TaskStatus | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const isPersonalBoard = !projectId;
  
  const queryKey = isPersonalBoard ? ['my-tasks'] : ['tasks', projectId];
  const queryFn = isPersonalBoard
    ? () => api.get('/tasks/my').then(r => r.data)
    : () => api.get(`/tasks?project_id=${projectId}`).then(r => r.data);

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey,
    queryFn,
    refetchOnWindowFocus: false,
    enabled: !!user,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) => 
      api.patch(`/tasks/${taskId}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
    onError: (err: Error) => toast(err.message, 'error'),
  });

  const canCreate = !isPersonalBoard && LEAD_AND_ABOVE.includes(role ?? 'member' as any);

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find(t => t.id === event.active.id);
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

  if (isLoading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', height: '100%' }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="kanban-column glass-subtle animate-pulse" style={{ height: '600px' }} />
        ))}
      </div>
    );
  }

  const columns: TaskStatus[] = ['pending', 'in_progress', 'completed', 'overdue'];

  return (
    <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          {isPersonalBoard && (
            <div className="personal-stats">
              <StatsRow tasks={tasks} />
            </div>
          )}
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '16px', 
          flex: 1,
          alignItems: 'start'
        }}>
          {columns.map(status => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={tasks.filter(t => t.status === status)}
              onTaskClick={setSelectedTask}
              onAddTask={() => setShowCreateModal(status)}
              canAdd={canCreate && status !== 'overdue'}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: { active: { opacity: '0.5' } }
          })
        }}>
          {activeTask ? <TaskCard task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>

      {selectedTask && (
        <TaskModal 
          task={selectedTask} 
          onClose={() => setSelectedTask(null)} 
          onSubmit={() => {
            setSelectedTask(null);
            qc.invalidateQueries({ queryKey });
          }}
        />
      )}

      {showCreateModal && projectId && (
        <CreateTaskModal
          domainId={domainId}
          forcedProjectId={projectId}
          defaultStatus={showCreateModal}
          onClose={() => setShowCreateModal(null)}
          onSuccess={() => {
            setShowCreateModal(null);
            qc.invalidateQueries({ queryKey });
          }}
        />
      )}
    </div>
  );
}
