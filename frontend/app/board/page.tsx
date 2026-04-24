'use client';

import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { useAuthHydration } from '@/hooks/useAuthHydration';
import { MyBoardView } from '@/components/shared/board/MyBoardView';
import { ProjectTaskViewer } from '@/components/shared/board/ProjectTaskViewer';

export default function UnifiedBoardPage() {
  const { hydrated } = useAuthHydration();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project_id');

  if (!hydrated) return null;

  return (
    <AppShell>
      {projectId ? (
        <ProjectTaskViewer projectId={projectId} />
      ) : (
        <MyBoardView />
      )}
    </AppShell>
  );
}
