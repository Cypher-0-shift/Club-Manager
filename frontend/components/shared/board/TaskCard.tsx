'use client';

import { Task, PRIORITY_COLORS } from '@/types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Paperclip, Pin } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: task.status === 'overdue',
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'all 0.15s ease',
    ...(isDragging ? {
      opacity: 0.25,
      border: '1px dashed var(--color-border)',
      background: 'transparent',
      pointerEvents: 'none' as any,
    } : {}),
    ...(task.is_pinned ? {
      boxShadow: 'inset 0 2px 10px rgba(245, 158, 11, 0.15)',
      borderTop: '1px solid rgba(245, 158, 11, 0.5)'
    } : {})
  };

  const deadlineStr = task.deadline 
    ? formatDistanceToNow(new Date(task.deadline), { addSuffix: true })
    : null;

  const avatarColor = task.assignee_id
    ? ['#6366F1','#8B5CF6','#06B6D4','#10B981','#F59E0B','#EF4444'][task.assignee_id.charCodeAt(0) % 6]
    : 'var(--color-surface-hover)';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`task-card ${task.is_overdue || task.status === 'overdue' ? 'is-overdue' : ''}`}
      onClick={() => { if (!isDragging && onClick) onClick(); }}
    >
      {/* Line 1: Priority Dot, Title, Pin */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
        <div style={{ 
          width: '8px', height: '8px', borderRadius: '50%', 
          background: PRIORITY_COLORS[task.priority], 
          flexShrink: 0, marginTop: '5px' 
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <span className="task-card-title text-truncate-2" style={{ margin: 0 }}>
            {task.title}
          </span>
        </div>
        {task.is_pinned && (
          <span style={{ color: '#F59E0B', flexShrink: 0, opacity: 0.8 }}>
            <Pin size={12} fill="currentColor" />
          </span>
        )}
      </div>

      {/* Line 2: Project Name */}
      {task.project?.name && (
        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '8px', paddingLeft: '16px' }} className="text-truncate-1">
          {task.project.name}
        </div>
      )}

      {/* Line 3: Assignee + Status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', paddingLeft: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
          {task.assignee && (
            <>
              <div className="avatar avatar-xs" style={{ background: avatarColor, color: '#fff', flexShrink: 0, width: '16px', height: '16px', fontSize: '9px' }}>
                {task.assignee.full_name[0]}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {task.assignee.full_name}
              </span>
            </>
          )}
        </div>
        <span className={`badge badge-${task.status}`} style={{ fontSize: '9px', padding: '1px 6px', flexShrink: 0 }}>
          {task.status.replace('_', ' ')}
        </span>
      </div>

      {/* Line 4: Deadline + Counts */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '16px' }}>
        <div style={{ fontSize: '11px', color: task.is_overdue || task.status === 'overdue' ? 'var(--color-overdue)' : 'var(--color-text-muted)', fontWeight: task.is_overdue || task.status === 'overdue' ? 600 : 400 }}>
          {(task.is_overdue || task.status === 'overdue') ? '⚠ OVERDUE ' : ''}
          {deadlineStr || 'No deadline'}
        </div>

        <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: 'var(--color-text-muted)', flexShrink: 0 }}>
          {(task.message_count ?? 0) > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><MessageSquare size={12} /> {task.message_count}</span>}
          {(task.submission_count ?? 0) > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Paperclip size={12} /> {task.submission_count}</span>}
        </div>
      </div>
      
      <style jsx>{`
        .text-truncate-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .text-truncate-1 { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      `}</style>
    </div>
  );
}
