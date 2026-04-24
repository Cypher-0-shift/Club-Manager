'use client';


import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { Domain, Project, Task } from '@/types';
import { DomainCardGrid } from '@/components/dashboard/DomainCard';
import { SkeletonCard } from '@/components/dashboard/StatCard';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/Toast';
import { useAuthHydration } from '@/hooks/useAuthHydration';

function CreateDomainModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#6366f1');
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => api.post('/domains', { name, description, color_hex: color }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['domains'] }); toast('Domain created!', 'success'); onSuccess(); },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" style={{ width: '100%', maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--color-border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600 }}>Create Domain</h2>
          <button className="btn-ghost btn-icon" onClick={onClose} style={{ fontSize: '18px' }}>×</button>
        </div>
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">Domain Name *</label>
            <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Development" id="domain-name" />
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
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={() => mutation.mutate()} disabled={!name.trim() || mutation.isPending} id="create-domain-submit">
              {mutation.isPending ? 'Creating…' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Suspense } from 'react';

function WorkspaceContent() {
  const { hydrated } = useAuthHydration();
  const { role } = useAppStore();
  const searchParams = useSearchParams();
  const [showCreate, setShowCreate] = useState(false);
  
  useEffect(() => {
    if (searchParams.get('create') === '1') {
      setShowCreate(true);
    }
  }, [searchParams]);

  const canManage = ['president','vp','secretary'].includes(role ?? '');

  const { data: domains = [], isLoading: domainsLoading } = useQuery<Domain[]>({
    queryKey: ['domains'],
    queryFn: () => api.get('/domains').then(r => r.data),
    enabled: hydrated && !!role,
  });

  const { user, domainId: userDomainId } = useAppStore();
  const isExec = ['president', 'vp', 'secretary'].includes(role ?? '');
  
  const domainsToDisplay = isExec 
    ? domains 
    : domains.filter(d => String(d.id).toLowerCase() === String(user?.domain_id || userDomainId || '').toLowerCase());

  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects').then(r => r.data),
    enabled: hydrated && !!role,
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: () => api.get('/tasks').then(r => r.data),
    enabled: hydrated && !!role,
  });

  const isLoading = domainsLoading || projectsLoading || tasksLoading;

  if (!hydrated) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--color-bg)',
      }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="section-title" style={{ fontSize: '18px' }}>Workspace</h1>
            <p className="section-subtitle">
              {isExec ? 'All club domains and their projects' : 'Your assigned domain and projects'}
            </p>
          </div>
          {canManage && (
            <button className="btn btn-primary" onClick={() => setShowCreate(true)} id="new-domain-btn">
              + New Domain
            </button>
          )}
        </div>

        {isLoading
          ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
              {[0,1,2].map(i => <SkeletonCard key={i} />)}
            </div>
          : domainsToDisplay.length > 0
            ? <DomainCardGrid domains={domainsToDisplay} tasks={tasks} projects={projects} />
            : <div className="card" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '40px' }}>
                {isExec ? 'No domains yet. Create the first one!' : 'You are not assigned to any domain yet.'}
              </div>
        }
      {showCreate && canManage && (
        <CreateDomainModal onClose={() => setShowCreate(false)} onSuccess={() => setShowCreate(false)} />
      )}
    </div>
  );
}

export default function WorkspacePage() {
  return (
    <Suspense fallback={<div className="spinner" />}>
      <WorkspaceContent />
    </Suspense>
  );
}
