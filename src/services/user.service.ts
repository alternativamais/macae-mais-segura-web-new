import api from '@/lib/api-client';
import { 
  User, 
  UserListResponse, 
  CreateUserPayload, 
  UpdateUserPayload 
} from '@/types/user';

export const userService = {
  findAll: async (page = 1, pageSize = 10): Promise<UserListResponse> => {
    const { data } = await api.get<UserListResponse>('/users', {
      params: { page, pageSize },
    });
    return data;
  },

  findOne: async (id: number): Promise<User> => {
    const { data } = await api.get<User>(`/users/${id}`);
    return data;
  },

  create: async (payload: CreateUserPayload): Promise<User> => {
    const { data } = await api.post<User>('/users', payload);
    return data;
  },

  update: async (id: number, payload: UpdateUserPayload): Promise<User> => {
    const { data } = await api.put<User>(`/users/${id}`, payload);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};
