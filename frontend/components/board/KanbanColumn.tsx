'use client';

import { Task, TaskStatus } from '@/types';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { TaskCard } from './TaskCard';

const COLUMN_LABELS: Record<TaskStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  overdue: 'Overdue',
};

const COLUMN_COLORS: Record<TaskStatus, string> = {
  pending: 'var(--color-pending)',
  in_progress: 'var(--color-brand)',
  completed: 'var(--color-completed)',
  overdue: 'var(--color-overdue)',
};

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask?: () => void;
  canAdd?: boolean;
}

export function KanbanColumn({ status, tasks, onTaskClick, onAddTask, canAdd }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return 0;
  });

  const isOverdue = status === 'overdue';

  return (
    <div
      ref={setNodeRef}
      className={`kanban-column ${isOverdue ? 'kanban-column-overdue' : ''}`}
      style={{
        boxShadow: isOver ? `inset 0 0 0 2px ${COLUMN_COLORS[status]}` : undefined,
        transition: 'box-shadow 0.15s',
      }}
    >
      {/* Header */}
      <div className="kanban-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLUMN_COLORS[status] }}
          />
          <span className="kanban-title">{COLUMN_LABELS[status]}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="kanban-count">{tasks.length}</span>
          {canAdd && status !== 'overdue' && (
            <button
              className="btn btn-sm btn-ghost btn-icon"
              onClick={onAddTask}
              title="Add task"
              style={{ fontSize: '16px', lineHeight: 1 }}
            >
              +
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="kanban-body">
        <SortableContext items={sortedTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {sortedTasks.length === 0
            ? <div className="kanban-empty">No tasks here</div>
            : sortedTasks.map(t => (
                <TaskCard key={t.id} task={t} onClick={() => onTaskClick(t)} />
              ))
          }
        </SortableContext>
      </div>
    </div>
  );
}
