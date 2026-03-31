import api from '@/lib/api-client';
import { RolePermission } from '@/types/role';

export const rolePermissionService = {
  findAll: async (): Promise<RolePermission[]> => {
    const { data } = await api.get<RolePermission[]>('/role-permissions');
    return data;
  },

  assignPermissions: async (
    roleId: number,
    permissionsIds: number[]
  ): Promise<RolePermission[]> => {
    const { data } = await api.post<RolePermission[]>('/role-permissions/assign', {
      roleId,
      permissionsIds,
    });
    return data;
  },

  updatePermissionsForRole: async (
    roleId: number,
    permissionsIds: number[]
  ): Promise<RolePermission[]> => {
    const { data } = await api.put<RolePermission[]>(
      `/role-permissions/assign/${roleId}`,
      { permissionsIds }
    );
    return data;
  },
};
