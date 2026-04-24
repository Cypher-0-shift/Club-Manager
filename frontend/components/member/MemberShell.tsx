'use client';

import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { TopBar } from '@/components/layout/TopBar';
import { Sidebar } from '@/components/layout/Sidebar';

export function MemberShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#000000' }}>
      <OfflineBanner />

      <Sidebar />

      {/* ── Main content ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden', background: '#000000' }}>
        <TopBar />
        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
