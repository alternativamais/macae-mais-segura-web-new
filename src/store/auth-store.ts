import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { deleteCookie } from 'cookies-next';
import { User } from '@/types/auth';

interface AuthState {
  token: string | null;
  user: User | null;
  allowedScreens: string[];
  permissions: string[];
  isAuthenticated: boolean;
  login: (token: string, user: User, allowedScreens?: string[], permissions?: string[]) => void;
  syncSession: (payload: {
    user: User;
    allowedScreens: string[];
    permissions: string[];
  }) => void;
  updateUser: (patch: Partial<User>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      allowedScreens: [],
      permissions: [],
      isAuthenticated: false,

      login: (token, user, allowedScreens = [], permissions = []) => {
        set({ token, user, allowedScreens, permissions, isAuthenticated: true });
      },

      syncSession: ({ user, allowedScreens = [], permissions = [] }) => {
        set((state) => ({
          token: state.token,
          user,
          allowedScreens,
          permissions,
          isAuthenticated: Boolean(state.token),
        }));
      },

      updateUser: (patch) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...patch } : state.user,
        }));
      },

      logout: () => {
        deleteCookie('@alternativa-base:token');
        localStorage.removeItem('@alternativa-base:token');
        set({ token: null, user: null, allowedScreens: [], permissions: [], isAuthenticated: false });
      },
    }),
    {
      name: '@alternativa-base:auth',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
