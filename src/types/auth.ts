export interface User {
  id: number;
  email: string;
  name?: string;
  username?: string;
  status?: string;
  avatarUrl?: string | null;
  role?: { id: number; name: string };
  locationRequired?: boolean;
  themeModePreference?: "light" | "dark" | null;
}

export interface AppEmpresa {
  id: number;
  nome: string;
  roleId: number;
  isDefault: boolean;
}

export interface AuthSessionSnapshot {
  user: User;
  allowedScreens: string[];
  permissions: string[];
  needsSelection?: boolean;
  empresas?: AppEmpresa[];
  empresa?: { id: number; nome: string };
}

export interface LoginResponse extends AuthSessionSnapshot {
  accessToken: string;
}

export type SessionSnapshot = AuthSessionSnapshot;

export interface LoginCredentials {
  email: string;
  password: string;
  latitude?: number;
  longitude?: number;
}
