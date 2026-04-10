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
  empresaId?: number | null;
  empresa?: {
    id: number;
    nome: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
  rolePermissions?: RolePermission[];
}

export interface CreateRolePayload {
  name: string;
  description?: string;
  empresaId?: number;
}

export type UpdateRolePayload = Partial<CreateRolePayload>;

export type RoleListResponse = PaginatedResponse<Role>;
