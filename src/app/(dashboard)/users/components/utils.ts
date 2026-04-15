import { Empresa } from "@/types/empresa"
import { Role } from "@/types/role"
import { User } from "@/types/user"

function getSortedCompanyRoles(user: User) {
  return [...(user.companyRoles || [])].sort((a, b) => {
    if (!!a.isDefault === !!b.isDefault) {
      return a.empresaId - b.empresaId
    }

    return a.isDefault ? -1 : 1
  })
}

export function getUserRoleName(
  user: User,
  rolesById: Map<number, Role>,
  fallback: string,
) {
  const firstCompanyRole = getSortedCompanyRoles(user)[0]

  if (firstCompanyRole?.role?.name) {
    return firstCompanyRole.role.name
  }

  if (typeof firstCompanyRole?.roleId === "number") {
    return rolesById.get(firstCompanyRole.roleId)?.name || fallback
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
  const companyRoles = getSortedCompanyRoles(user)
  const companyRoleNames = companyRoles
    .map((entry) => entry.empresa?.nome || companiesById.get(entry.empresaId)?.nome)
    .filter((name): name is string => typeof name === "string" && name.length > 0)

  if (companyRoleNames.length > 0) {
    return companyRoleNames
  }

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

export function getUserCompanyRoleSummary(
  user: User,
  companiesById: Map<number, Empresa>,
  rolesById: Map<number, Role>,
  fallback: string,
  labels?: {
    defaultSuffix?: string
  },
) {
  const companyRoles = getSortedCompanyRoles(user)
  if (!companyRoles.length) {
    return fallback
  }

  return companyRoles
    .map((entry) => {
      const companyName =
        entry.empresa?.nome || companiesById.get(entry.empresaId)?.nome || `#${entry.empresaId}`
      const roleName =
        entry.role?.name || rolesById.get(entry.roleId)?.name || fallback
      const defaultSuffix = entry.isDefault ? labels?.defaultSuffix || "" : ""

      return `${companyName}: ${roleName}${defaultSuffix}`
    })
    .join(" | ")
}
