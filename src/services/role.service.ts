import api from '@/lib/api-client';
import { 
  Role, 
  RoleListResponse, 
  CreateRolePayload, 
  UpdateRolePayload 
} from '@/types/role';

export const roleService = {
  findAll: async (page = 1, pageSize = 10): Promise<RoleListResponse> => {
    const { data } = await api.get<RoleListResponse>('/roles', {
      params: { page, pageSize },
    });
    return data;
  },

  findAllNoPagination: async (): Promise<Role[]> => {
    const { data } = await api.get<{ items: Role[] }>('/roles', {
      params: { pagination: 'false' },
    });
    return data.items;
  },

  findOne: async (id: number): Promise<Role> => {
    const { data } = await api.get<Role>(`/roles/${id}`);
    return data;
  },

  create: async (payload: CreateRolePayload): Promise<Role> => {
    const { data } = await api.post<Role>('/roles', payload);
    return data;
  },

  update: async (id: number, payload: UpdateRolePayload): Promise<Role> => {
    const { data } = await api.put<Role>(`/roles/${id}`, payload);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/roles/${id}`);
  },
};
