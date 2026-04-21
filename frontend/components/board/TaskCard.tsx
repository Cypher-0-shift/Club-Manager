'use client';

import { Task, TaskPriority, TaskStatus, PRIORITY_COLORS } from '@/types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format, isPast } from 'date-fns';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: task.status === 'overdue',
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isDeadlineSoon = task.deadline && !task.is_overdue && isPast(new Date(task.deadline));
  const deadlineStr = task.deadline ? format(new Date(task.deadline), 'MMM d, yyyy') : null;

  // Avatar color from id
  const avatarColor = task.assignee_id
    ? ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444'][task.assignee_id.charCodeAt(0) % 6]
    : 'var(--color-surface-hover)';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={[
        'task-card',
        task.is_overdue ? 'task-card-overdue' : '',
        isDragging ? 'task-card-dragging' : '',
      ].join(' ')}
      onClick={(e) => {
        // Don't open if we were dragging
        if (!isDragging) onClick();
      }}
    >
      {/* Pin icon */}
      {task.is_pinned && (
        <span style={{
          position: 'absolute', top: '8px', right: '8px',
          fontSize: '11px', opacity: 0.6
        }}>📌</span>
      )}

      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '7px', marginBottom: '4px' }}>
        <span
          className={`priority-dot priority-dot-${task.priority}`}
          style={{ marginTop: '4px' }}
          title={`Priority: ${task.priority}`}
        />
        <span className="task-card-title" style={{ flex: 1 }}>{task.title}</span>
      </div>

      {/* Project */}
      {task.project?.name && (
        <div className="task-card-project">{task.project.name}</div>
      )}

      {/* Footer */}
      <div className="task-card-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Assignee avatar */}
          {task.assignee && (
            <div
              className="avatar avatar-sm"
              style={{ background: avatarColor, color: '#fff' }}
              title={task.assignee.full_name}
            >
              {task.assignee.full_name[0]}
            </div>
          )}
          {/* Deadline */}
          {deadlineStr && (
            <span className={`task-card-due ${isDeadlineSoon ? 'task-card-due-overdue' : ''}`}>
              {deadlineStr}
            </span>
          )}
        </div>

        {/* Meta counts */}
        <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
          {(task.message_count ?? 0) > 0 && <span>💬 {task.message_count}</span>}
          {(task.submission_count ?? 0) > 0 && <span>📎 {task.submission_count}</span>}
        </div>
      </div>
    </div>
  );
}
