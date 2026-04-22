'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/components/ui/Toast';
import { TaskPriority, TaskStatus, Project, User } from '@/types';
import { Loader2 } from 'lucide-react';

const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'critical'];
const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: '#22c55e', medium: '#f59e0b', high: '#f97316', critical: '#ef4444',
};

const schema = z.object({
  title: z.string().min(1, 'Title required').max(120, 'Max 120 characters'),
  description: z.string().optional(),
  priority: z.enum(['low','medium','high','critical'] as const),
  deadline: z.string().optional(),
  project_id: z.string().min(1, 'Project required'),
  assignee_id: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface CreateTaskModalProps {
  defaultStatus: TaskStatus;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateTaskModal({ defaultStatus, onClose, onSuccess }: CreateTaskModalProps) {
  const { user, domainId } = useAppStore();
  const { toast } = useToast();
  const [charCount, setCharCount] = useState(0);

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['projects', domainId],
    queryFn: () => api.get(domainId ? `/projects?domain_id=${domainId}` : '/projects').then(r => r.data),
  });

  const { data: members = [] } = useQuery<User[]>({
    queryKey: ['members', domainId],
    queryFn: () => api.get(domainId ? `/users?domain_id=${domainId}` : '/users').then(r => r.data),
  });

  const {
    register, handleSubmit, watch, control, formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'medium' },
    mode: 'onChange',
  });

  const selectedPriority = watch('priority');
  const title = watch('title');
  useEffect(() => setCharCount(title?.length ?? 0), [title]);

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      api.post('/tasks', { ...data, status: defaultStatus, created_by: user?.id }),
    onSuccess: () => {
      toast('Task created!', 'success');
      onSuccess();
    },
    onError: (err: Error) => toast(err.message, 'error'),
  });

  const today = new Date().toISOString().slice(0, 16);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-panel"
        style={{ width: '100%', maxWidth: '500px' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--color-border-subtle)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600 }}>Create Task</h2>
          <button className="btn-ghost btn-icon" onClick={onClose} style={{ fontSize: '18px' }}>×</button>
        </div>

        <form
          onSubmit={handleSubmit(d => mutation.mutate(d))}
          style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}
        >
          {/* Title */}
          <div className="form-group">
            <label className="form-label">Task Title *</label>
            <input
              {...register('title')}
              className="form-input"
              placeholder="What needs to be done?"
              maxLength={120}
              id="create-task-title"
            />
            {charCount >= 80 && (
              <span style={{ fontSize: '11px', color: charCount >= 120 ? 'var(--color-overdue)' : 'var(--color-text-muted)', alignSelf: 'flex-end' }}>
                {charCount}/120
              </span>
            )}
            {errors.title && <span className="form-error">{errors.title.message}</span>}
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              {...register('description')}
              className="form-input"
              rows={3}
              placeholder="Optional details…"
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Priority toggle */}
          <div className="form-group">
            <label className="form-label">Priority *</label>
            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <div className="priority-toggle">
                  {PRIORITIES.map(p => (
                    <button
                      key={p}
                      type="button"
                      className={`priority-toggle-btn ${field.value === p ? `active-${p}` : ''}`}
                      onClick={() => field.onChange(p)}
                      id={`priority-${p}`}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>

          {/* Deadline */}
          <div className="form-group">
            <label className="form-label">Deadline</label>
            <input
              {...register('deadline')}
              type="datetime-local"
              className="form-input"
              min={today}
              id="create-task-deadline"
            />
          </div>

          {/* Project */}
          <div className="form-group">
            <label className="form-label">Project *</label>
            <Controller
              name="project_id"
              control={control}
              render={({ field }) => (
                <select {...field} className="form-input" id="create-task-project">
                  <option value="">Select project…</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              )}
            />
            {errors.project_id && <span className="form-error">{errors.project_id.message}</span>}
          </div>

          {/* Assignee */}
          <div className="form-group">
            <label className="form-label">Assignee</label>
            <Controller
              name="assignee_id"
              control={control}
              render={({ field }) => (
                <select {...field} className="form-input" id="create-task-assignee">
                  <option value="">Unassigned</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.full_name} ({m.role})</option>)}
                </select>
              )}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button
              id="create-task-submit"
              type="submit"
              className="btn btn-primary"
              disabled={!isValid || mutation.isPending}
              style={{ minWidth: '120px' }}
            >
              {mutation.isPending ? <Loader2 className="animate-spin" size={16} /> : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
