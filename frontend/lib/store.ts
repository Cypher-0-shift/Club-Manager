import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole } from '@/types';

interface AppStore {
  userId: string | null;
  user: User | null;
  role: UserRole | null;
  domainId: string | null;
  boardFilters: {
    search: string;
    status: string;
    priority: string;
    assignee: string;
    project: string;
    sort: string;
    sortDir: 'asc' | 'desc';
  };
  setUser: (u: User) => void;
  clearUser: () => void;
  setBoardFilter: (key: keyof AppStore['boardFilters'], value: string) => void;
  clearBoardFilters: () => void;
}

const defaultFilters = {
  search: '', status: 'all', priority: 'all', assignee: 'all', project: 'all', sort: 'deadline', sortDir: 'asc' as const
};

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      userId: null,
      user: null,
      role: null,
      domainId: null,
      boardFilters: defaultFilters,
      setUser: (u) => set({ user: u, userId: u.id, role: u.role, domainId: u.domain_id }),
      clearUser: () => set({ user: null, userId: null, role: null, domainId: null }),
      setBoardFilter: (key, value) => set((state) => ({ boardFilters: { ...state.boardFilters, [key]: value } })),
      clearBoardFilters: () => set({ boardFilters: defaultFilters }),
    }),
    { 
      name: 'ctm-identity',
      partialize: (state) => ({ userId: state.userId, role: state.role, domainId: state.domainId, boardFilters: state.boardFilters }),
    }
  )
);
