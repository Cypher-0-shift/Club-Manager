'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { useEffect, useState } from 'react';
import { ToastProvider } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { 
        retry: 1, 
        staleTime: 30_000,
        gcTime: 1000 * 60 * 60 * 24, // 24 hours (formerly cacheTime)
      },
    },
  }));

  // PHASE 4: Create persister for localStorage
  const [persister] = useState(() => {
    if (typeof window !== 'undefined') {
      return createSyncStoragePersister({
        storage: window.localStorage,
        key: 'REACT_QUERY_OFFLINE_CACHE',
        serialize: JSON.stringify,
        deserialize: JSON.parse,
      });
    }
    return undefined;
  });

  const { clearUser } = useAppStore();

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then((res) => {
      if (!res.data.session) {
        clearUser();
      }
    });

    // Subscribe to auth events
    const authRes = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        clearUser();
        queryClient.clear();
      }
    });

    const subscription = authRes.data.subscription;

    return () => subscription.unsubscribe();
  }, [clearUser, queryClient]);

  // PHASE 4: Use PersistQueryClientProvider for cache persistence
  if (persister) {
    return (
      <PersistQueryClientProvider 
        client={queryClient} 
        persistOptions={{ 
          persister,
          maxAge: 1000 * 60 * 60 * 24, // 24 hours
          buster: 'v1', // Change this to invalidate all cached data
        }}
      >
        <ToastProvider>
          {children}
        </ToastProvider>
      </PersistQueryClientProvider>
    );
  }

  // Fallback for SSR
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        {children}
      </ToastProvider>
    </QueryClientProvider>
  );
}
