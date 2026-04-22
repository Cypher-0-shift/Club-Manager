import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole } from '@/types';

interface AppStore {
  userId: string | null;
  user: User | null;
  role: UserRole | null;
  domainId: string | null;
  setUser: (u: User) => void;
  clearUser: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      userId: null,
      user: null,
      role: null,
      domainId: null,
      setUser: (u) => set({ user: u, userId: u.id, role: u.role, domainId: u.domain_id }),
      clearUser: () => set({ user: null, userId: null, role: null, domainId: null }),
    }),
    { 
      name: 'ctm-identity',
      partialize: (state) => ({ userId: state.userId, role: state.role, domainId: state.domainId }),
    }
  )
);
