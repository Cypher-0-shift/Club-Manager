'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function PendingApprovalPage() {
  const router = useRouter();

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', fontFamily: 'Satoshi, sans-serif' }}>
      <div style={{ textAlign: 'center', maxWidth: '400px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '999px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#fbbf24', fontSize: '10px', fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '24px', fontFamily: 'Satoshi, sans-serif' }}>
          Pending Clearance
        </div>
        <h1 className="font-display" style={{ fontSize: '36px', fontWeight: 700, letterSpacing: '-0.04em', marginBottom: '12px' }}>Access Request Submitted</h1>
        <p style={{ color: '#525252', fontSize: '14px', lineHeight: 1.6, marginBottom: '32px' }}>
          Your account is under review by a club officer. You will be notified once your access is approved.
        </p>
        <button
          onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }}
          style={{ padding: '12px 32px', background: 'transparent', color: '#a3a3a3', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '999px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', letterSpacing: '0.1em', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#a3a3a3'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
