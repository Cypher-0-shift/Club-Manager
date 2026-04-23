'use client';

import { Domain, Project, Task } from '@/types';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { hexToRgba } from '@/lib/utils';

interface DomainCardProps {
  domain: Domain;
  tasks: Task[];
  projects: Project[];
}

export function DomainCard({ domain, tasks, projects }: DomainCardProps) {
  const router = useRouter();

  const domainTasks = tasks.filter(t => t.project?.domain_id === domain.id || t.project_id === projects.find(p => p.domain_id === domain.id)?.id);
  const domainProjects = projects.filter(p => p.domain_id === domain.id);

  const completed = domainTasks.filter(t => t.status === 'completed').length;
  const total = domainTasks.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div
      className="domain-card"
      style={{ 
        '--domain-color': domain.color_hex || '#6366f1',
        '--domain-shadow': hexToRgba(domain.color_hex || '#6366f1', 0.2)
      } as any}
      onClick={() => router.push(`/workspace/${domain.id}`)}
    >
      <div className="domain-name">{domain.name}</div>
      {domain.description && <div className="domain-desc">{domain.description}</div>}

      <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
          {domainProjects.length} project{domainProjects.length !== 1 ? 's' : ''}
        </span>
        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
          {total} task{total !== 1 ? 's' : ''}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div className="domain-progress-bar" style={{ flex: 1 }}>
          <div
            className="domain-progress-fill"
            style={{ width: `${pct}%`, background: domain.color_hex }}
          />
        </div>
        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', minWidth: '32px', textAlign: 'right' }}>
          {pct}%
        </span>
      </div>
    </div>
  );
}

export function DomainCardGrid({ domains, tasks, projects }: { domains: Domain[], tasks: Task[], projects: Project[] }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
      gap: '16px',
    }}>
      {domains.map(d => <DomainCard key={d.id} domain={d} tasks={tasks} projects={projects} />)}
    </div>
  );
}
