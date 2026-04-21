import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole } from '@/types';

interface AppStore {
  user: User | null;
  role: UserRole | null;
  domainId: string | null;
  setUser: (u: User) => void;
  clearUser: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      user: null,
      role: null,
      domainId: null,
      setUser: (u) => set({ user: u, role: u.role, domainId: u.domain_id }),
      clearUser: () => set({ user: null, role: null, domainId: null }),
    }),
    { name: 'ctm-identity' }
  )
);
