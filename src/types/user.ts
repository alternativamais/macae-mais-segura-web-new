import { PaginatedResponse } from './api';

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
}

export interface CreateUserPayload {
  name: string;
  username: string;
  email: string;
  password?: string;
  birthday: string;
  status: string;
  roleId: number;
}

export type UpdateUserPayload = Partial<CreateUserPayload> & {
  avatarUrl?: string;
  locationRequired?: boolean;
};

export type UserListResponse = PaginatedResponse<User>;
