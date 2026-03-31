import { PaginatedResponse } from './api';
import { Permission } from './permission';

export interface RolePermission {
  id: number;
  roleId: number;
  permissionsId: number;
  createdAt?: string;
  updatedAt?: string;
  permissions?: Permission;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  rolePermissions?: RolePermission[];
}

export interface CreateRolePayload {
  name: string;
  description?: string;
}

export type UpdateRolePayload = Partial<CreateRolePayload>;

export type RoleListResponse = PaginatedResponse<Role>;
