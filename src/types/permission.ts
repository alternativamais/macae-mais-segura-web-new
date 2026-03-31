import { PaginatedResponse } from './api';

export interface Permission {
  id: number;
  name: string;
  group?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePermissionPayload {
  name: string;
  group?: string;
}

export type UpdatePermissionPayload = Partial<CreatePermissionPayload>;

export type PermissionListResponse = PaginatedResponse<Permission>;
