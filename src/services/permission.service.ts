import api from '@/lib/api-client';
import { 
  Permission, 
  PermissionListResponse, 
  CreatePermissionPayload, 
  UpdatePermissionPayload 
} from '@/types/permission';

export const permissionService = {
  findAll: async (page = 1, pageSize = 10): Promise<PermissionListResponse> => {
    const { data } = await api.get<PermissionListResponse>('/permissions', {
      params: { page, pageSize },
    });
    return data;
  },

  findAllNoPagination: async (): Promise<Permission[]> => {
    const { data } = await api.get<{ items: Permission[] }>('/permissions', {
      params: { pagination: 'false' },
    });
    return data.items;
  },

  create: async (payload: CreatePermissionPayload): Promise<Permission> => {
    const { data } = await api.post<Permission>('/permissions', payload);
    return data;
  },

  update: async (id: number, payload: UpdatePermissionPayload): Promise<Permission> => {
    const { data } = await api.put<Permission>(`/permissions/${id}`, payload);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/permissions/${id}`);
  },
};
