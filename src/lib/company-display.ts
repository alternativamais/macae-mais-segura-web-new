import { AppEmpresa } from "@/types/auth"

export type CompanyMap = Map<number, Pick<AppEmpresa, "id" | "nome">>

export function buildCompanyMap(
  companies: Array<Pick<AppEmpresa, "id" | "nome">>,
): CompanyMap {
  return new Map(companies.map((company) => [company.id, company]))
}

export function getCompanyNameById(
  companyId: number | null | undefined,
  companiesById: CompanyMap,
  fallback: string,
) {
  if (typeof companyId !== "number") {
    return fallback
  }

  return companiesById.get(companyId)?.nome || fallback
}
