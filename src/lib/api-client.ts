import axios from 'axios';
import { notificationService } from './notifications/notification-service';
import { useAuthStore } from '@/store/auth-store';
import {
  AUTH_REDIRECT_REASON,
  AUTH_TOKEN_KEY,
  buildSignInPath,
  getClientCurrentPath,
} from '@/lib/auth-session';

let isHandlingUnauthorizedRedirect = false;

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6001/api/',
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      const { activeCompanyId } = useAuthStore.getState();
      if (activeCompanyId) {
        config.headers['X-Empresa-Id'] = activeCompanyId;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined' && !isHandlingUnauthorizedRedirect) {
        isHandlingUnauthorizedRedirect = true;
        notificationService.warning('Sua sessão expirou. Faça login novamente.', {
          title: 'Sessão encerrada',
        });
        useAuthStore.getState().logout();

        const signInPath = buildSignInPath(
          getClientCurrentPath(),
          AUTH_REDIRECT_REASON.sessionExpired,
        );
        window.location.replace(new URL(signInPath, window.location.origin).toString());
      }
    }
    return Promise.reject(error);
  }
);

export default api;
