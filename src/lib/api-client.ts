import axios from 'axios';
import { notificationService } from './notifications/notification-service';
import { useAuthStore } from '@/store/auth-store';

let isHandlingUnauthorizedRedirect = false;

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6001/api/',
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('@alternativa-base:token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
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

        const unauthorizedUrl = new URL('/unauthorized', window.location.origin);
        const currentPath = `${window.location.pathname}${window.location.search}`;
        if (currentPath && currentPath !== '/unauthorized') {
          unauthorizedUrl.searchParams.set('next', currentPath);
        }

        window.location.replace(unauthorizedUrl.toString());
      }
    }
    return Promise.reject(error);
  }
);

export default api;
