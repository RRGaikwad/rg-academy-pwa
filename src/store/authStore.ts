import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Role, User } from '../types';

interface AuthState {
  user: User | null;
  role: Role | null;
  instituteId: string;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      role: null,
      instituteId: 'rg_academy_id',
      isLoading: false,
      isAuthenticated: false,
      login: (user: User) =>
        set({
          user,
          role: user.role,
          instituteId: user.instituteId || 'rg_academy_id',
          isAuthenticated: true,
          isLoading: false,
        }),
      logout: () =>
        set({
          user: null,
          role: null,
          isAuthenticated: false,
          isLoading: false,
        }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    {
      name: 'rg-academy-auth',
      partialize: (state) => ({
        user: state.user,
        role: state.role,
        instituteId: state.instituteId,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
