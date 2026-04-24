import { useState, useEffect, useMemo, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/components/ui/Toast';
import { TaskPriority, TaskStatus, Project, User, Domain } from '@/types';
import { Loader2, Search, ChevronDown, Check, User as UserIcon } from 'lucide-react';

const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'critical'];

const schema = z.object({
  title: z.string().min(1, 'Title required').max(120, 'Max 120 characters'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical'] as const),
  deadlineDate: z.string().optional(),
  deadlineTime: z.string().optional(),
  domain_id: z.string().min(1, 'Domain required'),
  project_id: z.string().optional().nullable(),
  assignee_id: z.string().optional().nullable(),
});
type FormData = z.infer<typeof schema>;

interface CreateTaskModalProps {
  domainId?: string; // Optional: use the provided domainId or fallback to store
  defaultStatus: TaskStatus;
  onClose: () => void;
  onSuccess: () => void;
  forcedProjectId?: string;
}

export function CreateTaskModal({ domainId: propDomainId, defaultStatus, onClose, onSuccess, forcedProjectId }: CreateTaskModalProps) {
  const { user, domainId: storeDomainId } = useAppStore();
  const domainId = propDomainId || storeDomainId;
  const { toast } = useToast();
  const [charCount, setCharCount] = useState(0);
  const [allocateTime, setAllocateTime] = useState(false);

  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['projects', domainId],
    queryFn: () => api.get(domainId ? `/projects?domain_id=${domainId}` : '/projects').then(r => r.data),
    enabled: !!user,
  });

  const { data: members = [] } = useQuery<User[]>({
    queryKey: ['members', domainId],
    queryFn: () => api.get(domainId ? `/users?domain_id=${domainId}` : '/users').then(r => r.data),
    enabled: !!user,
  });

  const { data: allDomains = [] } = useQuery<Domain[]>({
    queryKey: ['domains'],
    queryFn: () => api.get('/domains').then(r => r.data),
  });

  const domainColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    allDomains.forEach(d => { map[d.id] = d.color_hex; });
    return map;
  }, [allDomains]);

  const {
    register, handleSubmit, watch, control, setValue, formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      priority: 'medium',
      domain_id: domainId || '',
      project_id: forcedProjectId || null
    },
    mode: 'onChange',
  });

  const title = watch('title');
  const selectedAssigneeId = watch('assignee_id');

  useEffect(() => setCharCount(title?.length ?? 0), [title]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowAssigneeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const { deadlineDate, deadlineTime, ...rest } = data;
      let deadline = null;
      if (deadlineDate) {
        const time = allocateTime ? (deadlineTime || '11:59') : '23:59';
        deadline = `${deadlineDate}T${time}:00`;
      }

      return api.post('/tasks', {
        ...rest,
        deadline,
        status: defaultStatus,
        created_by: user?.id,
        project_id: data.project_id || null
      });
    },
    onSuccess: () => {
      toast('Task created!', 'success');
      onSuccess();
    },
    onError: (err: Error) => toast(err.message, 'error'),
  });

  const today = new Date().toISOString().slice(0, 10);

  const filteredMembers = useMemo(() => {
    return members.filter(m =>
      m.full_name.toLowerCase().includes(assigneeSearch.toLowerCase()) ||
      m.role.toLowerCase().includes(assigneeSearch.toLowerCase())
    );
  }, [members, assigneeSearch]);

  const selectedAssignee = members.find(m => m.id === selectedAssigneeId);

  return (
    <div className="modal-overlay" onClick={onClose} style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div
        className="modal-panel"
        style={{ width: '100%', maxWidth: '500px', background: '#262626', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', boxShadow: '0 24px 64px rgba(0,0,0,0.8)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600 }}>Create Task</h2>
          <button className="btn-ghost btn-icon" onClick={onClose}>×</button>
        </div>

        <form
          onSubmit={handleSubmit(d => mutation.mutate(d))}
          style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}
        >
          {/* Title */}
          <div className="form-group">
            <label className="form-label" style={{ color: '#ffffff', fontWeight: 800, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Task Title *</label>
            <input
              {...register('title')}
              className="form-input"
              placeholder="What needs to be done?"
              maxLength={120}
              id="create-task-title"
              style={{ fontWeight: 600, fontSize: '15px' }}
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
            <label className="form-label" style={{ color: '#ffffff', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</label>
            <textarea
              {...register('description')}
              className="form-input"
              rows={3}
              placeholder="Optional details…"
              style={{ resize: 'vertical', fontWeight: 500 }}
            />
          </div>

          {/* Priority */}
          <div className="form-group">
            <label className="form-label" style={{ color: '#ffffff', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Priority *</label>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ marginBottom: 0, color: '#ffffff', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deadline</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="allocate-time"
                  checked={allocateTime}
                  onChange={e => setAllocateTime(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <label htmlFor="allocate-time" style={{ fontSize: '12px', color: '#525252', cursor: 'pointer' }}>Allocate Time</label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <input
                  {...register('deadlineDate')}
                  type="date"
                  className="form-input"
                  min={today}
                  style={{ width: '100%' }}
                />
              </div>
              {allocateTime && (
                <div style={{ flex: 1 }}>
                  <input
                    {...register('deadlineTime')}
                    type="time"
                    className="form-input"
                    style={{ width: '100%' }}
                    defaultValue="11:59"
                  />
                </div>
              )}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              {allocateTime ? 'Time is explicitly allocated.' : 'Defaults to 23:59 (end of day) if time is not allocated.'}
            </span>
          </div>

          {/* Project - Optional */}
          <div className="form-group">
            <label className="form-label" style={{ color: '#ffffff', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Project (Optional)</label>
            <Controller
              name="project_id"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  value={field.value || ''}
                  onChange={e => field.onChange(e.target.value || null)}
                  className="form-input"
                  disabled={!!forcedProjectId}
                >
                  <option value="">Standalone (No Project)</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              )}
            />
          </div>

          {/* Assignee - Searchable Dropdown */}
          <div className="form-group" style={{ position: 'relative' }} ref={dropdownRef}>
            <label className="form-label" style={{ color: '#ffffff', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assignee</label>
            <div
              className="form-input"
              onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
            >
              {selectedAssignee ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="avatar avatar-xs" style={{ fontSize: '10px' }}>{selectedAssignee.full_name[0]}</div>
                  <span style={{ color: domainColorMap[selectedAssignee.domain_id || ''] || 'inherit', fontWeight: 500 }}>
                    {selectedAssignee.full_name}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>({selectedAssignee.role})</span>
                </div>
              ) : (
                <span style={{ color: 'var(--color-text-muted)' }}>Unassigned</span>
              )}
              <ChevronDown size={14} />
            </div>

            {showAssigneeDropdown && (
              <div className="card glass-subtle" style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                marginTop: '4px', padding: '8px', maxHeight: '240px', overflowY: 'auto',
                display: 'flex', flexDirection: 'column', gap: '4px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
              }}>
                <div style={{ position: 'relative', marginBottom: '8px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                  <input
                    className="form-input"
                    placeholder="Search members..."
                    value={assigneeSearch}
                    onChange={e => setAssigneeSearch(e.target.value)}
                    onClick={e => e.stopPropagation()}
                    autoFocus
                    style={{ paddingLeft: '32px', height: '32px', fontSize: '13px' }}
                  />
                </div>

                <div
                  className="dropdown-item"
                  onClick={() => { setValue('assignee_id', null); setShowAssigneeDropdown(false); }}
                  style={{ padding: '8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <span style={{ fontSize: '13px' }}>Unassigned</span>
                  {!selectedAssigneeId && <Check size={14} color="var(--color-brand)" />}
                </div>

                {filteredMembers.map(m => (
                  <div
                    key={m.id}
                    className="dropdown-item"
                    onClick={() => { setValue('assignee_id', m.id); setShowAssigneeDropdown(false); }}
                    style={{ padding: '8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="avatar avatar-xs" style={{ fontSize: '10px' }}>{m.full_name[0]}</div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: domainColorMap[m.domain_id || ''] || 'inherit' }}>
                          {m.full_name}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>{m.role}</span>
                      </div>
                    </div>
                    {selectedAssigneeId === m.id && <Check size={14} color="var(--color-brand)" />}
                  </div>
                ))}

                {filteredMembers.length === 0 && (
                  <div style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    No members found
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!isValid || mutation.isPending}
              style={{ minWidth: '120px' }}
            >
              {mutation.isPending ? <Loader2 className="animate-spin" size={16} /> : 'Create Task'}
            </button>
          </div>
        </form>

        <style jsx>{`
          .dropdown-item:hover {
            background: rgba(255,255,255,0.05);
          }
        `}</style>
      </div>
    </div>
  );
}
