import { PaginatedResponse } from './api';
import { Empresa } from './empresa';

export interface User {
  id: number;
  email: string;
  name?: string;
  username?: string;
  status?: string;
  avatarUrl?: string | null;
  role?: { id: number; name: string };
  roleId: number;
  birthday?: string;
  locationRequired?: boolean;
  empresaId?: number | null;
  empresa?: Empresa;
}

export interface CreateUserPayload {
  name: string;
  username: string;
  email: string;
  password?: string;
  birthday: string;
  status: string;
  roleId: number;
  empresaId?: number | null;
  locationRequired?: boolean;
}

export type UpdateUserPayload = Partial<CreateUserPayload> & {
  avatarUrl?: string;
};

export type UserListResponse = PaginatedResponse<User>;
