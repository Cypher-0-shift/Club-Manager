'use client';

import { AppShell } from '@/components/layout/AppShell';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { Domain, Project, Task } from '@/types';
import { StatsRow, SkeletonCard } from '@/components/dashboard/StatCard';
import { use, useState, useEffect, useMemo } from 'react';
import { ArrowLeft, FolderOpen, Settings, Trash2, Plus, Edit2, List, Calendar, User as UserIcon, Layers, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { useAuthHydration } from '@/hooks/useAuthHydration';
import { useToast } from '@/components/ui/Toast';
import { useRouter } from 'next/navigation';
import { hexToRgba } from '@/lib/utils';
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal';
import { TaskModal } from '@/components/tasks/TaskModal';

interface Props {
  params: Promise<{ domainId: string }>;
}

// Unified Modal for Domain Create/Edit
function DomainModal({ domain, onClose, onSuccess, onDelete }: { domain?: Domain; onClose: () => void; onSuccess: () => void; onDelete?: () => void }) {
  const { toast } = useToast();
  const [name, setName] = useState(domain?.name ?? '');
  const [description, setDescription] = useState(domain?.description ?? '');
  const [color, setColor] = useState(domain?.color_hex ?? '#6366f1');
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => domain 
      ? api.patch(`/domains/${domain.id}`, { name, description, color_hex: color })
      : api.post(`/domains`, { name, description, color_hex: color }),
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ['domain', domain?.id] });
      qc.invalidateQueries({ queryKey: ['domains'] });
      toast(`Domain ${domain ? 'updated' : 'created'}!`, 'success'); 
      onSuccess(); 
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" style={{ width: '100%', maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--color-border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600 }}>{domain ? 'Edit Domain' : 'New Domain'}</h2>
          <button className="btn-ghost btn-icon" onClick={onClose}>×</button>
        </div>
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">Domain Name *</label>
            <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Development" />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" value={description} onChange={e => setDescription(e.target.value)} rows={2} style={{ resize: 'none' }} />
          </div>
          <div className="form-group">
            <label className="form-label">Color</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ width: '40px', height: '36px', cursor: 'pointer', border: 'none', background: 'none' }} />
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{color}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
            {domain && (
              <button 
                className="btn-delete-domain" 
                onClick={onDelete} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  padding: '8px 12px', 
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--color-overdue)',
                  background: 'rgba(220, 38, 38, 0.08)',
                  border: '1px solid rgba(220, 38, 38, 0.15)',
                  transition: 'all 0.2s',
                  textTransform: 'uppercase',
                  letterSpacing: '0.02em'
                }}
              >
                <Trash2 size={14} /> Delete Domain
              </button>
            )}
            <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={() => mutation.mutate()} disabled={!name.trim() || mutation.isPending}>
                {mutation.isPending ? 'Saving…' : domain ? 'Save Changes' : 'Create'}
              </button>
            </div>
          </div>
          <style jsx>{`
            .btn-delete-domain:hover {
              background: rgba(220, 38, 38, 0.15) !important;
              border-color: rgba(220, 38, 38, 0.3) !important;
              transform: translateY(-1px);
            }
            .btn-delete-domain:active {
              transform: translateY(0);
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}

// Unified Modal for Project Create/Edit
function ProjectModal({ domainId, project, onClose, onSuccess }: { domainId: string; project?: Project; onClose: () => void; onSuccess: () => void }) {
  const { toast } = useToast();
  const [name, setName] = useState(project?.name ?? '');
  const [description, setDescription] = useState(project?.description ?? '');
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => project
      ? api.patch(`/projects/${project.id}`, { name, description })
      : api.post(`/projects`, { name, description, domain_id: domainId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects', domainId] });
      toast(`Project ${project ? 'updated' : 'created'}!`, 'success');
      onSuccess();
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" style={{ width: '100%', maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--color-border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600 }}>{project ? 'Edit Project' : 'New Project'}</h2>
          <button className="btn-ghost btn-icon" onClick={onClose}>×</button>
        </div>
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">Project Name *</label>
            <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Website Redesign" />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" value={description} onChange={e => setDescription(e.target.value)} rows={3} style={{ resize: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={() => mutation.mutate()} disabled={!name.trim() || mutation.isPending}>
              {mutation.isPending ? 'Saving…' : project ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DomainWorkspacePage({ params }: Props) {
  const { hydrated } = useAuthHydration();
  const { domainId } = use(params);
  const { role } = useAppStore();
  const { toast } = useToast();
  const router = useRouter();
  const qc = useQueryClient();
  
  const [showEditDomain, setShowEditDomain] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState<{ show: boolean; project?: Project }>({ show: false });
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const isAdmin = ['president', 'vp', 'secretary'].includes(role ?? '');
  const canManage = isAdmin || role === 'lead';

  const { data: domain } = useQuery<Domain>({
    queryKey: ['domain', domainId],
    queryFn: () => api.get(`/domains/${domainId}`).then(r => r.data),
    enabled: hydrated && !!domainId,
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ['projects', domainId],
    queryFn: () => api.get(`/projects?domain_id=${domainId}`).then(r => r.data),
    enabled: hydrated && !!domainId,
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ['tasks', domainId],
    queryFn: () => api.get(`/tasks?domain_id=${domainId}`).then(r => r.data),
    enabled: hydrated && !!domainId,
  });

  const deleteDomainMutation = useMutation({
    mutationFn: () => api.delete(`/domains/${domainId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['domains'] }); toast('Domain deleted', 'success'); router.push('/workspace'); },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/projects/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects', domainId] }); toast('Project deleted', 'success'); },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const handleDomainDelete = () => {
    if (confirm('Are you sure you want to delete this domain? All associated data will be affected.')) {
      deleteDomainMutation.mutate();
    }
  };

  const handleProjectDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault(); e.stopPropagation();
    if (confirm('Delete this project and all its tasks?')) {
      deleteProjectMutation.mutate(id);
    }
  };

  const domainColor = domain?.color_hex ?? '#6366f1';
  const isLoading = projectsLoading || tasksLoading;

  if (!hydrated) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--color-bg)' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <AppShell>
      <div style={{ 
        display: 'flex', flexDirection: 'column', gap: '32px', minHeight: '100%',
        background: domainColor ? `radial-gradient(ellipse at 0% 0%, ${hexToRgba(domainColor, 0.07)} 0%, transparent 50%), var(--color-bg)` : 'var(--color-bg)',
        margin: '-24px', padding: '24px' // Negate AppShell padding to let gradient bleed
      }}>

        {/* Back + header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <a href="/workspace" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--color-text-muted)', textDecoration: 'none', marginBottom: '12px' }}>
              <ArrowLeft size={14} /> All Domains
            </a>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '12px', height: '40px', borderRadius: '4px', background: domainColor, boxShadow: `0 0 16px ${domainColor}60` }} />
              <div>
                <h1 style={{ fontSize: '22px', fontWeight: 700 }}>{domain?.name ?? 'Loading…'}</h1>
                {domain?.description && <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{domain.description}</p>}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {canManage && (
              <button className="btn btn-primary" onClick={() => setShowCreateTask(true)} style={{ gap: '8px' }}>
                <Plus size={16} /> Create Task
              </button>
            )}
            {isAdmin && (
              <button className="btn btn-secondary" onClick={() => setShowEditDomain(true)} style={{ gap: '6px' }}>
                <Settings size={14} /> Settings
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        {isLoading
          ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>{[0,1,2,3].map(i => <SkeletonCard key={i} />)}</div>
          : <StatsRow tasks={tasks} />
        }

        {/* Project Cards Section */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 className="section-title">Projects</h2>
            {canManage && (
              <button className="btn btn-sm btn-secondary" onClick={() => setShowProjectModal({ show: true })} style={{ gap: '6px' }}>
                <Plus size={14} /> New Project
              </button>
            )}
          </div>

          {projectsLoading
            ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: '16px' }}>{[0,1].map(i => <SkeletonCard key={i} />)}</div>
            : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: '16px' }}>
                {projects.map(p => {
                  const projectTasks = tasks.filter(t => t.project_id === p.id);
                  const pct = projectTasks.length > 0 ? Math.round((projectTasks.filter(t => t.status === 'completed').length / projectTasks.length) * 100) : 0;
                  return (
                    <a key={p.id} href={`/board?project_id=${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div className="card glass-subtle project-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px', cursor: 'pointer', transition: 'all 0.2s', position: 'relative', minHeight: '180px' }}>
                        {canManage && (
                          <div className="project-actions" style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '6px', opacity: 0, transition: 'opacity 0.2s' }} onClick={e => e.preventDefault()}>
                            <button className="btn-ghost btn-icon btn-sm" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowProjectModal({ show: true, project: p }); }}><Edit2 size={12} /></button>
                            {isAdmin && <button className="btn-ghost btn-icon btn-sm" style={{ color: 'var(--color-overdue)' }} onClick={(e) => handleProjectDelete(e, p.id)}><Trash2 size={12} /></button>}
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                          <FolderOpen size={18} color={domainColor} style={{ marginTop: '2px', flexShrink: 0 }} />
                          <div style={{ flex: 1, paddingRight: '40px' }}>
                            <div style={{ fontWeight: 600, fontSize: '15px' }}>{p.name}</div>
                            {p.description && <div className="text-truncate-2" style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px', lineHeight: 1.4 }}>{p.description}</div>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {['pending', 'in_progress', 'completed', 'overdue'].map(st => {
                            const count = projectTasks.filter(t => t.status === st || (st === 'overdue' && t.is_overdue)).length;
                            const colors: any = { pending: 'var(--color-pending)', in_progress: 'var(--color-brand)', completed: 'var(--color-completed)', overdue: 'var(--color-overdue)' };
                            return count > 0 ? (
                              <div key={st} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--color-surface-raised)', padding: '2px 8px', borderRadius: '4px', border: `1px solid ${colors[st]}20` }}>
                                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: colors[st] }} />
                                <span style={{ fontSize: '10px', fontWeight: 600 }}>{count} {st.replace('_', ' ')}</span>
                              </div>
                            ) : null;
                          })}
                        </div>
                        <div style={{ marginTop: 'auto' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '5px' }}>
                            <span>{projectTasks.length} Tasks</span>
                            <span>{pct}%</span>
                          </div>
                          <div style={{ height: '4px', borderRadius: '999px', background: 'var(--color-border)' }}>
                            <div style={{ height: '100%', borderRadius: '999px', width: `${pct}%`, background: pct === 100 ? 'var(--color-completed)' : domainColor, transition: 'width 0.6s ease' }} />
                          </div>
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
          }
        </div>

      </div>

      <style jsx>{`
        .project-card:hover .project-actions { opacity: 1 !important; }
        .project-card:hover { transform: translateY(-2px); border-color: var(--color-border-strong); }
        .text-truncate-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>

      {showEditDomain && domain && (
        <DomainModal 
          domain={domain} 
          onClose={() => setShowEditDomain(false)} 
          onSuccess={() => setShowEditDomain(false)} 
          onDelete={handleDomainDelete}
        />
      )}

      {showProjectModal.show && (
        <ProjectModal 
          domainId={domainId} 
          project={showProjectModal.project} 
          onClose={() => setShowProjectModal({ show: false })} 
          onSuccess={() => setShowProjectModal({ show: false })} 
        />
      )}

      {showCreateTask && (
        <CreateTaskModal 
          domainId={domainId}
          defaultStatus="pending" 
          onClose={() => setShowCreateTask(false)} 
          onSuccess={() => { setShowCreateTask(false); qc.invalidateQueries({ queryKey: ['tasks', domainId] }); }} 
        />
      )}

      {selectedTask && (
        <TaskModal 
          task={selectedTask} 
          onClose={() => setSelectedTask(null)} 
          onSubmit={() => { setSelectedTask(null); qc.invalidateQueries({ queryKey: ['tasks', domainId] }); }} 
        />
      )}
    </AppShell>
  );
}
