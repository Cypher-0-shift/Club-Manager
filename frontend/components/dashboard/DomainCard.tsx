'use client';

import { Domain, Project, Task } from '@/types';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface DomainCardProps {
  domain: Domain;
}

export function DomainCard({ domain }: DomainCardProps) {
  const router = useRouter();

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['tasks-domain', domain.id],
    queryFn: () => api.get(`/tasks?domain_id=${domain.id}`).then(r => r.data),
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['projects-domain', domain.id],
    queryFn: () => api.get(`/projects?domain_id=${domain.id}`).then(r => r.data),
  });

  const completed = tasks.filter(t => t.status === 'completed').length;
  const total = tasks.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div
      className="domain-card"
      style={{ borderTopColor: domain.color_hex }}
      onClick={() => router.push(`/workspace/${domain.id}`)}
    >
      <div className="domain-name">{domain.name}</div>
      {domain.description && <div className="domain-desc">{domain.description}</div>}

      <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
          {projects.length} project{projects.length !== 1 ? 's' : ''}
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

export function DomainCardGrid({ domains }: { domains: Domain[] }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
      gap: '16px',
    }}>
      {domains.map(d => <DomainCard key={d.id} domain={d} />)}
    </div>
  );
}
