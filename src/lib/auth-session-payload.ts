import { LoginResponse, SessionSnapshot } from "@/types/auth"

type AuthSessionPayload = LoginResponse | SessionSnapshot

export function getAuthSessionCompanyState(payload: AuthSessionPayload) {
  return {
    activeCompanyId: payload.empresa?.id ?? null,
    availableCompanies: Array.isArray(payload.empresas) ? payload.empresas : [],
  }
}
