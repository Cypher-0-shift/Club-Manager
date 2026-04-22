'use client';

import { Task, TaskPriority, TaskStatus, PRIORITY_COLORS } from '@/types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format, isPast, isBefore, addDays } from 'date-fns';
import { motion } from 'framer-motion';
import { MessageSquare, Paperclip, Pin } from 'lucide-react';

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

  const isDeadlineSoon = task.deadline && !task.is_overdue && isBefore(new Date(task.deadline), addDays(new Date(), 1));
  const deadlineStr = task.deadline ? format(new Date(task.deadline), 'MMM d') : null;

  // Avatar color from id
  const avatarColor = task.assignee_id
    ? ['#6366F1','#8B5CF6','#06B6D4','#10B981','#F59E0B','#EF4444'][task.assignee_id.charCodeAt(0) % 6]
    : 'var(--color-surface-hover)';

  // Priority color mapping for top border
  const priorityBorderMap: Record<string, string> = {
    low: 'var(--color-low)',
    medium: 'var(--color-medium)',
    high: 'var(--color-high)',
    critical: 'var(--color-critical)'
  };
  
  const borderTopColor = priorityBorderMap[task.priority] || 'transparent';

  return (
    <motion.div
      ref={setNodeRef}
      initial={task.is_overdue ? { x: [-4, 4, -4, 4, 0] } : false}
      transition={{ duration: 0.4 }}
      style={{
        ...style,
        borderTop: `3px solid ${borderTopColor}`,
        ...(isDeadlineSoon ? { boxShadow: '0 0 12px rgba(220, 38, 38, 0.3)', borderColor: 'rgba(220, 38, 38, 0.4)' } : {})
      }}
      {...attributes}
      {...listeners}
      className={['task-card', task.is_overdue ? 'task-card-overdue' : '', isDragging ? 'task-card-dragging' : ''].join(' ')}
      onClick={() => { if (!isDragging) onClick(); }}
      whileHover={{ y: -2, zIndex: 10 }}
    >
      {/* Pin icon */}
      {task.is_pinned && (
        <span style={{ position: 'absolute', top: '8px', right: '8px', opacity: 0.5, color: 'var(--color-brand)' }}>
          <Pin size={12} fill="currentColor" />
        </span>
      )}

      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '7px', marginBottom: '6px' }}>
        <span className="task-card-title" style={{ flex: 1, paddingRight: task.is_pinned ? '14px' : '0' }}>{task.title}</span>
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
          {task.is_overdue && (
            <span className="badge badge-overdue" style={{ fontSize: '9px', padding: '1px 4px' }}>OVERDUE</span>
          )}
        </div>

        {/* Meta counts */}
        <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
          {(task.message_count ?? 0) > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><MessageSquare size={12} /> {task.message_count}</span>}
          {(task.submission_count ?? 0) > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Paperclip size={12} /> {task.submission_count}</span>}
        </div>
      </div>
    </motion.div>
  );
}
