'use client';

import { Task, TaskStatus } from '@/types';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { TaskCard } from './TaskCard';
import { LayoutList, Plus } from 'lucide-react';

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
        borderLeft: `2px solid ${COLUMN_COLORS[status]}`,
        borderTop: 'none',
      }}
    >
      {/* Header */}
      <div className="kanban-header" style={{ 
        background: `color-mix(in srgb, ${COLUMN_COLORS[status]} 8%, transparent)`,
        borderBottom: `1px solid color-mix(in srgb, ${COLUMN_COLORS[status]} 20%, transparent)`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLUMN_COLORS[status], boxShadow: `0 0 8px ${COLUMN_COLORS[status]}` }}
          />
          <span className="kanban-title" style={{ color: 'var(--color-text-primary)' }}>{COLUMN_LABELS[status]}</span>
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
            ? (
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '12px', border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-sm)',
                padding: '32px 16px', color: 'var(--color-text-muted)', textAlign: 'center', cursor: canAdd ? 'pointer' : 'default',
                transition: 'border-color 0.15s, color 0.15s'
              }}
              onClick={canAdd ? onAddTask : undefined}
              onMouseEnter={(e) => { if(canAdd) { e.currentTarget.style.borderColor = 'var(--color-brand)'; e.currentTarget.style.color = 'var(--color-brand)'; } }}
              onMouseLeave={(e) => { if(canAdd) { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-muted)'; } }}
              >
                <LayoutList size={24} opacity={0.6} />
                <span style={{ fontSize: '12px', fontWeight: 500 }}>
                  {canAdd && status !== 'overdue' ? '+ Add your first task' : 'No tasks here'}
                </span>
              </div>
            )
            : sortedTasks.map(t => (
                <TaskCard key={t.id} task={t} onClick={() => onTaskClick(t)} />
              ))
          }
        </SortableContext>
      </div>
    </div>
  );
}
