import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { deleteCookie } from 'cookies-next';
import { AppEmpresa, User } from '@/types/auth';
import { AUTH_COOKIE_KEY, AUTH_TOKEN_KEY } from '@/lib/auth-session';

interface AuthState {
  token: string | null;
  user: User | null;
  allowedScreens: string[];
  permissions: string[];
  activeCompanyId: string | number | null;
  availableCompanies: AppEmpresa[];
  isAuthenticated: boolean;
  hasHydrated: boolean;
  login: (
    token: string, 
    user: User, 
    activeCompanyId?: string | number | null, 
    availableCompanies?: AppEmpresa[],
    allowedScreens?: string[], 
    permissions?: string[]
  ) => void;
  syncSession: (payload: {
    user: User;
    allowedScreens: string[];
    permissions: string[];
    activeCompanyId?: string | number | null;
    availableCompanies?: AppEmpresa[];
  }) => void;
  updateUser: (patch: Partial<User>) => void;
  setActiveCompanyId: (companyId: string | number | null) => void;
  setHasHydrated: (value: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      activeCompanyId: null,
      availableCompanies: [],
      allowedScreens: [],
      permissions: [],
      isAuthenticated: false,
      hasHydrated: false,

      login: (token, user, activeCompanyId = null, availableCompanies = [], allowedScreens = [], permissions = []) => {
        set({ 
          token, 
          user, 
          activeCompanyId,
          availableCompanies,
          allowedScreens, 
          permissions, 
          isAuthenticated: true 
        });
      },

      syncSession: ({ user, activeCompanyId, availableCompanies, allowedScreens = [], permissions = [] }) => {
        set((state) => ({
          token: state.token,
          user,
          activeCompanyId: activeCompanyId !== undefined ? activeCompanyId : state.activeCompanyId,
          availableCompanies: availableCompanies !== undefined ? availableCompanies : state.availableCompanies,
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

      setActiveCompanyId: (companyId) => {
        set({ activeCompanyId: companyId });
      },

      setHasHydrated: (value) => {
        set({ hasHydrated: value });
      },

      logout: () => {
        deleteCookie(AUTH_COOKIE_KEY, { path: '/' });
        localStorage.removeItem(AUTH_TOKEN_KEY);
        set({ 
          token: null, 
          user: null, 
          activeCompanyId: null,
          availableCompanies: [],
          allowedScreens: [], 
          permissions: [], 
          isAuthenticated: false 
        });
      },
    }),
    {
      name: '@alternativa-base:auth',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
