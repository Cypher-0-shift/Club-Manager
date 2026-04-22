'use client';

import { useState, useEffect } from 'react';
import { Task, Message, TaskPriority, TaskStatus, User } from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/components/ui/Toast';
import { format } from 'date-fns';
import { LEAD_AND_ABOVE } from '@/types';
import { Loader2, Trash2, Edit3, MessageSquare, Clock, User as UserIcon, FolderOpen, AlertCircle, Paperclip } from 'lucide-react';

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '12px', marginBottom: '16px', flexShrink: 0 }}>
        <MessageSquare size={16} color="var(--color-text-muted)" />
        <h3 style={{ fontSize: '14px', fontWeight: 600 }}>Discussion ({messages.length})</h3>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '8px', marginBottom: '16px' }}>
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
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', background: 'var(--color-surface-raised)', borderRadius: 'var(--radius-md)', padding: '10px 14px', lineHeight: 1.5, border: '1px solid var(--color-border-subtle)' }}>
                {m.content}
              </div>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
        <textarea
          className="form-input"
          style={{ height: '100px', resize: 'none', fontSize: '13px' }}
          placeholder="Share an update or tag someone..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
        />
        <button type="submit" className="btn btn-primary" disabled={!input.trim() || sendMutation.isPending} style={{ alignSelf: 'flex-end', width: '100%' }}>
          {sendMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : 'Send Message'}
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
  const [editStatus, setEditStatus] = useState<TaskStatus>(task.status);

  const isLead = LEAD_AND_ABOVE.includes(role ?? 'member' as any);
  const canModify = isLead || (user?.id === task.created_by);
  const isMember = role === 'member';
  const canSubmit = isMember && task.status === 'in_progress';

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users', domainId],
    queryFn: () => api.get(`/users${domainId ? `?domain_id=${domainId}` : ''}`).then(r => r.data),
    enabled: editing && !!role,
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['submissions', task.id],
    queryFn: () => api.get(`/tasks/${task.id}/submissions`).then(r => r.data),
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

  function handleSaveEdit() {
    updateMutation.mutate({
      title: editTitle,
      description: editDesc,
      priority: editPriority,
      deadline: editDeadline || null,
      assignee_id: editAssignee || null,
      status: editStatus,
    });
  }

  function handleUpdateStatus(status: TaskStatus) {
    updateMutation.mutate({ status });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel glass task-modal-panel" style={{ width: '100%', maxWidth: '960px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', borderRadius: 'var(--radius-lg)' }} onClick={e => e.stopPropagation()}>
        
        {/* Header - Simple Close Button */}
        <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10 }}>
          <button className="btn-ghost btn-icon" onClick={onClose}>×</button>
        </div>

        {/* Content Split */}
        <div className="task-modal-split" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          
          {/* Left Panel - 60% */}
          <div className="task-modal-left" style={{ flex: '0 0 60%', padding: '32px 24px', overflowY: 'auto', borderRight: '1px solid var(--color-border-subtle)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Title & Status */}
            <div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <span className={`badge badge-${task.status}`}>{task.status.replace('_', ' ')}</span>
                <span className={`badge badge-pending`} style={{ background: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: PRIORITY_OPTIONS.find(p => p.value === task.priority)?.color }} />
                  {task.priority} Priority
                </span>
                {task.is_overdue && <span className="badge badge-overdue">⚠ OVERDUE</span>}
              </div>
              
              {editing ? (
                <input
                  className="form-input"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  style={{ fontSize: '24px', fontWeight: 700, padding: '8px 12px', width: '100%' }}
                />
              ) : (
                <h1 style={{ fontSize: '24px', fontWeight: 700, lineHeight: 1.3, cursor: canModify ? 'pointer' : 'default' }} onClick={() => { if(canModify) setEditing(true); }}>
                  {task.title}
                </h1>
              )}
            </div>

            {/* Metadata Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', background: 'var(--color-surface-raised)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}><UserIcon size={16} /></div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Assignee</div>
                  {editing ? (
                    <select className="form-input" value={editAssignee} onChange={e => setEditAssignee(e.target.value)} style={{ padding: '2px 6px', fontSize: '13px', marginTop: '4px' }}>
                      <option value="">Unassigned</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                    </select>
                  ) : (
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>{task.assignee?.full_name || 'Unassigned'}</div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}><FolderOpen size={16} /></div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Project</div>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>{task.project?.name || '—'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}><Clock size={16} /></div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Deadline</div>
                  {editing ? (
                    <input type="datetime-local" className="form-input" value={editDeadline} onChange={e => setEditDeadline(e.target.value)} style={{ padding: '2px 6px', fontSize: '13px', marginTop: '4px' }} />
                  ) : (
                    <div style={{ fontSize: '13px', fontWeight: 500, color: task.is_overdue ? 'var(--color-overdue)' : 'inherit' }}>
                      {task.deadline ? format(new Date(task.deadline), 'MMM d, yyyy HH:mm') : 'No deadline'}
                    </div>
                  )}
                </div>
              </div>
              
            </div>

            {/* Description */}
            <div>
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '12px' }}>Description</h3>
              {editing ? (
                <textarea
                  className="form-input"
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  style={{ minHeight: '150px', width: '100%', fontSize: '14px', lineHeight: '1.6', resize: 'vertical' }}
                  placeholder="Provide details about this task..."
                />
              ) : (
                <div style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--color-text-primary)', background: 'var(--color-surface-raised)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                  {task.description ? (
                    <div dangerouslySetInnerHTML={{ __html: task.description.replace(/\n/g, '<br/>') }} />
                  ) : (
                    <span style={{ fontStyle: 'italic', color: 'var(--color-text-muted)' }}>No description provided.</span>
                  )}
                </div>
              )}
            </div>

            {/* Submissions */}
            {submissions.length > 0 && (
              <div>
                <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Paperclip size={14} /> Proof of Work ({submissions.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {submissions.map((s: any) => (
                    <div key={s.id} className="card glass-subtle" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 500, display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span className="badge" style={{ background: 'var(--color-surface-hover)' }}>{s.type}</span>
                          {format(new Date(s.created_at), 'MMM d, h:mm a')}
                        </div>
                        {s.type === 'text' && <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px', fontStyle: 'italic' }}>"{s.content}"</div>}
                      </div>
                      {s.type === 'file' && s.file_url && (
                        <a href={s.file_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-secondary">View File</a>
                      )}
                      {s.type === 'link' && s.content && (
                        <a href={s.content} target="_blank" rel="noreferrer" className="btn btn-sm btn-secondary">Open Link</a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Right Panel - 40% */}
          <div className="task-modal-right" style={{ flex: '0 0 40%', padding: '32px 24px', background: 'var(--color-surface-raised)', display: 'flex', flexDirection: 'column' }}>
            <MessageThread taskId={task.id} />
          </div>

        </div>

        {/* Footer Actions */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border-subtle)', background: 'var(--surface-base)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Created by {task.creator?.full_name}
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {editing ? (
              <>
                <button className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSaveEdit} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : 'Save Details'}
                </button>
              </>
            ) : (
              <>
                {canSubmit && (
                  <button className="btn btn-primary" onClick={onSubmit} style={{ gap: '8px' }}>
                    <Paperclip size={16} /> Submit Proof
                  </button>
                )}
                {canModify && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select 
                      className="form-input" 
                      value={task.status} 
                      onChange={e => handleUpdateStatus(e.target.value as TaskStatus)} 
                      style={{ padding: '6px 12px', height: 'auto', width: '140px' }}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="overdue">Overdue</option>
                    </select>
                    <button className="btn btn-secondary" onClick={() => setEditing(true)} style={{ gap: '6px' }}>
                      <Edit3 size={14} /> Edit
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .task-modal-split { flex-direction: column !important; overflow-y: auto !important; }
          .task-modal-left { flex: none !important; border-right: none !important; padding: 24px 16px !important; }
          .task-modal-right { flex: none !important; padding: 24px 16px !important; min-height: 400px; }
          .task-modal-panel { max-height: 100vh !important; border-radius: 0 !important; }
        }
      `}</style>
    </div>
  );
}
