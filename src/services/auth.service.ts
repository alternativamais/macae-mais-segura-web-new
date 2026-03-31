import api from '@/lib/api-client';
import { LoginResponse, SessionSnapshot } from '@/types/auth';

export const authService = {
  login: async (credentials: any): Promise<LoginResponse> => {
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
};
