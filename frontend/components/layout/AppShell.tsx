'use client';

import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { OfflineBanner } from '@/components/ui/OfflineBanner';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      background: '#000000',
    }}>
      <OfflineBanner />
      
      <Sidebar />

      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        overflow: 'hidden',
        background: '#000000',
      }}>
        <TopBar />
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '24px',
        }}>
          {children}
        </div>
      </main>
    </div>
  );
}
