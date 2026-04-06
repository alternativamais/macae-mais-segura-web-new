import api from '@/lib/api-client';
import { LoginCredentials, LoginResponse, SessionSnapshot } from '@/types/auth';
import { FrontendScreen } from '@/types/frontend-screen';

export const authService = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>('/auth', credentials);
    return data;
  },

  getProfile: async (): Promise<any> => {
    const { data } = await api.get('/me');
    return data;
  },

  checkToken: async (): Promise<SessionSnapshot> => {
    const { data } = await api.get<SessionSnapshot>('/check-token');
    return data;
  },

  syncClientScreens: async (screens: Array<Pick<FrontendScreen, "screenKey" | "title" | "description" | "path" | "group">>) => {
    const { data } = await api.post('/frontend/screens/sync-client', {
      platform: 'web',
      screens,
    });
    return data;
  },
};
