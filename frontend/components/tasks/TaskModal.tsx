'use client';

import { useState } from 'react';
import { Task, Message, TaskPriority, TaskStatus, PRIORITY_COLORS } from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/components/ui/Toast';
import { format } from 'date-fns';
import { LEAD_AND_ABOVE } from '@/types';
import { Loader2 } from 'lucide-react';

interface TaskModalProps {
  task: Task;
  onClose: () => void;
  onSubmit: () => void;
}

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: '#22c55e' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'high', label: 'High', color: '#f97316' },
  { value: 'critical', label: 'Critical', color: '#ef4444' },
];

function MessageThread({ taskId }: { taskId: string }) {
  const { user } = useAppStore();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [input, setInput] = useState('');

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ['messages', taskId],
    queryFn: () => api.get(`/tasks/${taskId}/messages`).then(r => r.data),
    refetchInterval: 10_000,
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) => api.post(`/tasks/${taskId}/messages`, { content }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages', taskId] });
      setInput('');
    },
    onError: (err: Error) => toast(err.message, 'error'),
  });

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    sendMutation.mutate(input.trim());
  }

  function getAvatarColor(id: string) {
    const colors = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444'];
    return colors[id.charCodeAt(0) % colors.length];
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        fontSize: '12px', fontWeight: 600, textTransform: 'uppercase',
        letterSpacing: '0.06em', color: 'var(--color-text-muted)',
        marginBottom: '12px',
      }}>Comments ({messages.length})</div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.length === 0 && (
          <div style={{ color: 'var(--color-text-muted)', fontSize: '12px', textAlign: 'center', padding: '16px 0' }}>
            No messages yet
          </div>
        )}
        {messages.map(m => (
          <div key={m.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <div
              className="avatar avatar-sm"
              style={{ background: getAvatarColor(m.sender_id), color: '#fff', flexShrink: 0 }}
            >
              {(m.sender?.full_name ?? 'U')[0]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline', marginBottom: '2px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600 }}>{m.sender?.full_name ?? 'Unknown'}</span>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                  {format(new Date(m.created_at), 'MMM d, h:mm a')}
                </span>
              </div>
              <div style={{
                fontSize: '13px', color: 'var(--color-text-secondary)',
                background: 'var(--color-surface-raised)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 10px',
                lineHeight: 1.5,
              }}>
                {m.content}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <input
          className="form-input"
          style={{ flex: 1 }}
          placeholder="Write a message…"
          value={input}
          onChange={e => setInput(e.target.value)}
          id="message-input"
        />
        <button
          type="submit"
          className="btn btn-primary btn-sm"
          disabled={!input.trim() || sendMutation.isPending}
          style={{ minWidth: '80px' }}
        >
          {sendMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : 'Send'}
        </button>
      </form>
    </div>
  );
}

export function TaskModal({ task, onClose, onSubmit }: TaskModalProps) {
  const { user, role } = useAppStore();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editPriority, setEditPriority] = useState(task.priority);

  const isLead = LEAD_AND_ABOVE.includes(role ?? 'member' as any);
  const isMember = role === 'member';
  const canSubmit = isMember && task.status === 'in_progress';

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Task>) => api.patch(`/tasks/${task.id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['my-tasks'] });
      toast('Task updated', 'success');
      setEditing(false);
    },
    onError: (err: Error) => toast(err.message, 'error'),
  });

  function handleSaveEdit() {
    updateMutation.mutate({ title: editTitle, priority: editPriority });
  }

  const statusBadgeClass = `badge badge-${task.status}`;
  const statusLabel = { pending: 'Pending', in_progress: 'In Progress', completed: 'Completed', overdue: 'Overdue' }[task.status];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-panel"
        style={{ width: '100%', maxWidth: '720px', maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--color-border-subtle)',
          display: 'flex', alignItems: 'flex-start', gap: '12px',
        }}>
          <div style={{ flex: 1 }}>
            {editing ? (
              <input
                className="form-input"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                style={{ fontSize: '16px', fontWeight: 600 }}
                maxLength={120}
                id="task-title-edit"
              />
            ) : (
              <h2 style={{ fontSize: '16px', fontWeight: 600 }}>{task.title}</h2>
            )}
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px', alignItems: 'center' }}>
              <span className={statusBadgeClass}>{statusLabel}</span>
              {task.project?.name && (
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  {task.project.name}
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {isLead && !editing && (
              <button className="btn btn-sm btn-secondary" onClick={() => setEditing(true)}>
                Edit
              </button>
            )}
            {editing && (
              <>
                <button className="btn btn-sm btn-primary" onClick={handleSaveEdit} disabled={updateMutation.isPending} style={{ minWidth: '80px' }}>
                  {updateMutation.isPending ? <Loader2 className="animate-spin" size={14} /> : 'Save'}
                </button>
                <button className="btn btn-sm btn-secondary" onClick={() => setEditing(false)}>
                  Cancel
                </button>
              </>
            )}
            <button className="btn-ghost btn-icon" onClick={onClose} style={{ fontSize: '18px' }}>×</button>
          </div>
        </div>

        {/* Split Body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
          {/* Left panel — 60% */}
          <div style={{
            flex: '0 0 60%', borderRight: '1px solid var(--color-border-subtle)',
            padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px',
          }}>
            {/* Description */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                Description
              </div>
              {task.description
                ? <div style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--color-text-secondary)' }}
                    dangerouslySetInnerHTML={{ __html: task.description }} />
                : <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No description</span>
              }
            </div>

            {/* Priority */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                Priority
              </div>
              {editing ? (
                <div className="priority-toggle">
                  {PRIORITY_OPTIONS.map(p => (
                    <button
                      key={p.value}
                      className={`priority-toggle-btn ${editPriority === p.value ? `active-${p.value}` : ''}`}
                      onClick={() => setEditPriority(p.value)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`priority-dot priority-dot-${task.priority}`} />
                  <span style={{ fontSize: '13px', textTransform: 'capitalize' }}>{task.priority}</span>
                </div>
              )}
            </div>

            {/* Metadata grid */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px',
              background: 'var(--color-surface-raised)',
              borderRadius: 'var(--radius-sm)',
              padding: '14px',
            }}>
              {[
                { label: 'Assignee', value: task.assignee?.full_name ?? 'Unassigned' },
                { label: 'Deadline', value: task.deadline ? format(new Date(task.deadline), 'MMM d, yyyy HH:mm') : 'No deadline' },
                { label: 'Created by', value: task.creator?.full_name ?? '—' },
                { label: 'Created', value: format(new Date(task.created_at), 'MMM d, yyyy') },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: '3px' }}>
                    {label}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right panel — 40% */}
          <div style={{
            flex: '0 0 40%', padding: '20px 20px', overflowY: 'auto',
            display: 'flex', flexDirection: 'column',
          }}>
            <MessageThread taskId={task.id} />
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid var(--color-border-subtle)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span className={statusBadgeClass}>{statusLabel}</span>
          {canSubmit && (
            <button
              id="task-submit-btn"
              className="btn btn-primary"
              onClick={onSubmit}
            >
              Submit Proof of Work
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
