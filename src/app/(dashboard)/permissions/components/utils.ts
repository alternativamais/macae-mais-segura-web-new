import { AppEmpresa } from "@/types/auth"
import { Role } from "@/types/role"

export type CompanyNameById = Record<string, string>

interface RoleScopeLabels {
  globalRole: string
  companyFallback: (empresaId: number) => string
}

export function buildCompanyNameById(companies: AppEmpresa[]): CompanyNameById {
  return companies.reduce<CompanyNameById>((acc, company) => {
    acc[String(company.id)] = company.nome
    return acc
  }, {})
}

export function isGlobalRole(role: Role) {
  return role.empresaId == null
}

export function canManageRole(role: Role, isAllCompaniesView: boolean) {
  return !isAllCompaniesView && !isGlobalRole(role)
}

export function getRoleScopeLabel(
  role: Role,
  companyNameById: CompanyNameById,
  labels: RoleScopeLabels
) {
  if (isGlobalRole(role)) {
    return labels.globalRole
  }

  const empresaId = Number(role.empresaId)
  return companyNameById[String(empresaId)] ?? labels.companyFallback(empresaId)
}

export function getRoleOptionLabel(
  role: Role,
  companyNameById: CompanyNameById,
  labels: RoleScopeLabels
) {
  return `${role.name} • ${getRoleScopeLabel(role, companyNameById, labels)}`
}
