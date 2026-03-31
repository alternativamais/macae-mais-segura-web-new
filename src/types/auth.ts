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

export interface LoginResponse {
  accessToken: string;
  user: User;
  allowedScreens: string[];
  permissions: string[];
}

export interface SessionSnapshot {
  user: User;
  allowedScreens: string[];
  permissions: string[];
}
