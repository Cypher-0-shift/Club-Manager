'use client';

import { AppShell } from '@/components/layout/AppShell';
import { BoardProvider } from '@/components/board/BoardProvider';
import { useAppStore } from '@/lib/store';
import { useAuthHydration } from '@/hooks/useAuthHydration';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Project } from '@/types';
import { ArrowLeft } from 'lucide-react';

export default function BoardPage() {
  const { hydrated } = useAuthHydration();
  const { role } = useAppStore();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project_id');

  const { data: project } = useQuery<Project>({
    queryKey: ['project', projectId],
    queryFn: () => api.get(`/projects/${projectId}`).then(r => r.data),
    enabled: hydrated && !!projectId,
  });

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

  if (!role) return null;

  return (
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
        
        {/* Navigation & Header */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {project && (
            <a
              href={`/workspace/${project.domain_id}`}
              className="back-link"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                fontSize: '13px', color: 'var(--color-text-muted)',
                textDecoration: 'none', width: 'fit-content',
                transition: 'color 0.2s, transform 0.2s'
              }}
            >
              <ArrowLeft size={14} /> Back to Workspace
            </a>
          )}

          <style jsx>{`
            .back-link:hover {
              color: var(--color-brand) !important;
              transform: translateX(-4px);
            }
          `}</style>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 className="section-title" style={{ fontSize: '20px', fontWeight: 700 }}>
                {project ? `${project.name} Board` : 'My Board'}
              </h1>
              <p className="section-subtitle">
                {project ? `Managing tasks for project: ${project.name}` : 'Drag tasks between columns to update their status'}
              </p>
            </div>
          </div>
        </div>

        <BoardProvider />
      </div>
    </AppShell>
  );
}
