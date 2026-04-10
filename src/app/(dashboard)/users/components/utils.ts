import { Empresa } from "@/types/empresa"
import { Role } from "@/types/role"
import { User } from "@/types/user"

export function getUserRoleName(
  user: User,
  rolesById: Map<number, Role>,
  fallback: string,
) {
  if (user.role?.name) {
    return user.role.name
  }

  if (typeof user.roleId === "number") {
    return rolesById.get(user.roleId)?.name || fallback
  }

  return fallback
}

export function getUserCompanyNames(
  user: User,
  companiesById: Map<number, Empresa>,
) {
  const resolvedNames = (user.empresaIds || [])
    .map((companyId) => companiesById.get(companyId)?.nome)
    .filter((name): name is string => typeof name === "string" && name.length > 0)

  if (resolvedNames.length > 0) {
    return resolvedNames
  }

  if (user.empresa?.nome) {
    return [user.empresa.nome]
  }

  if (typeof user.empresaId === "number") {
    const fallbackName = companiesById.get(user.empresaId)?.nome

    if (fallbackName) {
      return [fallbackName]
    }
  }

  return []
}

export function getUserCompanySummary(
  user: User,
  companiesById: Map<number, Empresa>,
  fallback: string,
) {
  const companyNames = getUserCompanyNames(user, companiesById)

  if (!companyNames.length) {
    return fallback
  }

  return companyNames.join(", ")
}
