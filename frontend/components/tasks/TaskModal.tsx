'use client';

import { useState, useEffect } from 'react';
import { Task, Message, TaskPriority, TaskStatus, User } from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/components/ui/Toast';
import { format } from 'date-fns';
import { LEAD_AND_ABOVE } from '@/types';
import { Loader2, Trash2, Edit3, MessageSquare, Clock, User as UserIcon, AlertCircle } from 'lucide-react';

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
  const { toast } = useToast();
  const qc = useQueryClient();
  const [input, setInput] = useState('');

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ['messages', taskId],
    queryFn: () => api.get(`/tasks/${taskId}/messages`).then(r => r.data),
    refetchInterval: 5000,
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '12px' }}>
        <MessageSquare size={16} color="var(--color-text-muted)" />
        <h3 style={{ fontSize: '14px', fontWeight: 600 }}>Discussion ({messages.length})</h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}>
        {messages.length === 0 && (
          <div style={{ color: 'var(--color-text-muted)', fontSize: '13px', textAlign: 'center', padding: '32px 0' }}>
            Start a conversation about this task...
          </div>
        )}
        {messages.map(m => (
          <div key={m.id} style={{ display: 'flex', gap: '12px' }}>
            <div className="avatar avatar-sm" style={{ background: getAvatarColor(m.sender_id), color: '#fff', flexShrink: 0 }}>
              {(m.sender?.full_name ?? 'U')[0]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline', marginBottom: '4px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{m.sender?.full_name ?? 'Unknown'}</span>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  {format(new Date(m.created_at), 'MMM d, h:mm a')}
                </span>
              </div>
              <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', background: 'var(--color-surface-raised)', borderRadius: 'var(--radius-md)', padding: '10px 14px', lineHeight: 1.5, border: '1px solid var(--color-border-subtle)' }}>
                {m.content}
              </div>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
        <input
          className="form-input"
          style={{ flex: 1 }}
          placeholder="Share an update or tag someone..."
          value={input}
          onChange={e => setInput(e.target.value)}
          id="message-input"
        />
        <button type="submit" className="btn btn-primary" disabled={!input.trim() || sendMutation.isPending} style={{ minWidth: '100px' }}>
          {sendMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : 'Comment'}
        </button>
      </form>
    </div>
  );
}

export function TaskModal({ task, onClose, onSubmit }: TaskModalProps) {
  const { user, role, domainId } = useAppStore();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  
  // Edit State
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDesc, setEditDesc] = useState(task.description ?? '');
  const [editPriority, setEditPriority] = useState(task.priority);
  const [editDeadline, setEditDeadline] = useState(task.deadline ? task.deadline.slice(0, 16) : '');
  const [editAssignee, setEditAssignee] = useState(task.assignee_id ?? '');

  const isLead = LEAD_AND_ABOVE.includes(role ?? 'member' as any);
  const canModify = isLead || (user?.id === task.created_by);
  const isMember = role === 'member';
  const canSubmit = isMember && task.status === 'in_progress';

  // Fetch users for assignee dropdown
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users', domainId],
    queryFn: () => api.get(`/users${domainId ? `?domain_id=${domainId}` : ''}`).then(r => r.data),
    enabled: editing && !!role,
  });

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

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/tasks/${task.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      toast('Task deleted', 'success');
      onClose();
    },
    onError: (err: Error) => toast(err.message, 'error'),
  });

  function handleSaveEdit() {
    updateMutation.mutate({
      title: editTitle,
      description: editDesc,
      priority: editPriority,
      deadline: editDeadline || null,
      assignee_id: editAssignee || null,
    });
  }

  function handleDelete() {
    if (confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      deleteMutation.mutate();
    }
  }

  const statusBadgeClass = `badge badge-${task.status}`;
  const statusLabel = { pending: 'Pending', in_progress: 'In Progress', completed: 'Completed', overdue: 'Overdue' }[task.status];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel glass" style={{ width: '100%', maxWidth: '800px', maxHeight: '95vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid var(--color-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className={statusBadgeClass}>{statusLabel}</span>
              <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>ID: {task.id.slice(0, 8)}</span>
            </div>
            {editing ? (
              <input
                className="form-input"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                style={{ fontSize: '20px', fontWeight: 700, width: '100%', padding: '8px 0', border: 'none', background: 'transparent', outline: 'none' }}
                placeholder="Task Title"
                autoFocus
              />
            ) : (
              <h2 style={{ fontSize: '20px', fontWeight: 700 }}>{task.title}</h2>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {canModify && !editing && (
              <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)} style={{ gap: '6px' }}>
                <Edit3 size={14} /> Edit
              </button>
            )}
            <button className="btn-ghost btn-icon" onClick={onClose}>×</button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Main Details Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '32px' }}>
            
            {/* Left: Description and Modifiable content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h3 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '12px', letterSpacing: '0.5px' }}>
                  Description
                </h3>
                {editing ? (
                  <textarea
                    className="form-input"
                    value={editDesc}
                    onChange={e => setEditDesc(e.target.value)}
                    style={{ minHeight: '180px', width: '100%', fontSize: '14px', lineHeight: '1.6' }}
                    placeholder="Provide details about this task..."
                  />
                ) : (
                  <div style={{ fontSize: '15px', lineHeight: 1.6, color: 'var(--color-text-secondary)' }}>
                    {task.description ? (
                      <div dangerouslySetInnerHTML={{ __html: task.description.replace(/\n/g, '<br/>') }} />
                    ) : (
                      <span style={{ fontStyle: 'italic', color: 'var(--color-text-muted)' }}>No description provided.</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Metadata sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Priority */}
              <div className="card glass-subtle" style={{ padding: '16px' }}>
                <h3 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '10px' }}>Priority</h3>
                {editing ? (
                  <select className="form-input" value={editPriority} onChange={e => setEditPriority(e.target.value as TaskPriority)}>
                    {PRIORITY_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`priority-dot priority-dot-${task.priority}`} />
                    <span style={{ fontSize: '14px', textTransform: 'capitalize', fontWeight: 500 }}>{task.priority}</span>
                  </div>
                )}
              </div>

              {/* Assignee */}
              <div className="card glass-subtle" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <UserIcon size={14} color="var(--color-text-muted)" />
                  <h3 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Assignee</h3>
                </div>
                {editing ? (
                  <select className="form-input" value={editAssignee} onChange={e => setEditAssignee(e.target.value)}>
                    <option value="">Unassigned</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                  </select>
                ) : (
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{task.assignee?.full_name ?? 'Not assigned'}</div>
                )}
              </div>

              {/* Deadline */}
              <div className="card glass-subtle" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <Clock size={14} color="var(--color-text-muted)" />
                  <h3 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Deadline</h3>
                </div>
                {editing ? (
                  <input type="datetime-local" className="form-input" value={editDeadline} onChange={e => setEditDeadline(e.target.value)} />
                ) : (
                  <div style={{ fontSize: '14px', fontWeight: 500, color: task.is_overdue ? 'var(--color-overdue)' : 'inherit' }}>
                    {task.deadline ? format(new Date(task.deadline), 'MMM d, yyyy HH:mm') : 'None'}
                  </div>
                )}
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border-subtle)' }} />

          {/* Discussion Section */}
          <MessageThread taskId={task.id} />
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border-subtle)', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {editing ? (
              <button className="btn btn-sm" onClick={handleDelete} disabled={deleteMutation.isPending} style={{ color: 'var(--color-overdue)', gap: '6px', background: 'rgba(239,68,68,0.1)' }}>
                <Trash2 size={14} /> Delete Task
              </button>
            ) : (
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Created {format(new Date(task.created_at), 'MMM d, yyyy')} by {task.creator?.full_name}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            {editing ? (
              <>
                <button className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSaveEdit} disabled={updateMutation.isPending} style={{ minWidth: '100px' }}>
                  {updateMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : 'Save Changes'}
                </button>
              </>
            ) : (
              canSubmit && (
                <button className="btn btn-primary" onClick={onSubmit}>Submit Proof of Work</button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
