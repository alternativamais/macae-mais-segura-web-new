export interface FrontendScreen {
  id: number;
  platform: string;
  screenKey: string;
  title: string;
  description?: string | null;
  path: string;
  group?: string | null;
}

export interface RoleFrontendScreen {
  id: number;
  roleId: number;
  frontendScreenId: number;
  frontendScreen?: FrontendScreen;
}

export interface RoleFrontendScreenAssignment extends FrontendScreen {
  assigned: boolean;
  metadata?: Record<string, unknown> | null;
}
