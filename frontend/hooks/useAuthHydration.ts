'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import { useAppStore } from '@/lib/store';

/**
 * Hydrates the Zustand store with the full user profile from the backend
 * on page load. Redirects to /login if no active session is found.
 *
 * Returns { hydrated } — render nothing (or a spinner) until hydrated is true.
 */
export function useAuthHydration() {
  const { user, setUser, clearUser } = useAppStore();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    async function run() {
      // Already hydrated — skip the network call
      if (user?.full_name) {
        setHydrated(true);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          clearUser();
          router.push('/login');
          return;
        }
        const res = await api.get('/users/me');
        setUser(res.data);
      } catch {
        clearUser();
        router.push('/login');
      } finally {
        setHydrated(true);
      }
    }

    run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { hydrated };
}
