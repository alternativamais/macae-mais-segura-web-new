import { PaginatedResponse } from './api';
import { Empresa } from './empresa';

export interface UserCompanyRole {
  empresaId: number;
  roleId: number;
  isDefault?: boolean;
  empresa?: {
    id: number;
    nome: string;
  } | null;
  role?: {
    id: number;
    name: string;
  } | null;
}

export interface User {
  id: number;
  email: string;
  name?: string;
  username?: string;
  status?: string;
  avatarUrl?: string | null;
  role?: { id: number; name: string };
  roleId?: number | null;
  birthday?: string;
  locationRequired?: boolean;
  empresaId?: number | null; // Retrocompatibilidade do dropdown anterior se houver
  empresaIds?: number[];
  companyRoles?: UserCompanyRole[];
  empresa?: Empresa;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserPayload {
  name: string;
  username: string;
  email: string;
  password?: string;
  birthday: string;
  status: string;
  roleId?: number;
  empresaIds?: number[];
  locationRequired?: boolean;
  companyRoles?: UserCompanyRole[];
}

export type UpdateUserPayload = Partial<CreateUserPayload> & {
  avatarUrl?: string;
  empresaIds?: number[];
};

export type UserListResponse = PaginatedResponse<User>;
