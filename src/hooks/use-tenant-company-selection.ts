"use client"

import { useMemo } from "react"
import { useAuthStore } from "@/store/auth-store"

export interface TenantCompanyOption {
  id: number
  nome: string
}

function normalizeCompanyId(value: string | number | null) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string" && value.trim() && value !== "ALL") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

export function useTenantCompanySelection() {
  const activeCompanyId = useAuthStore((state) => state.activeCompanyId)
  const availableCompanies = useAuthStore((state) => state.availableCompanies)

  return useMemo(() => {
    const companies: TenantCompanyOption[] = availableCompanies.map((company) => ({
      id: company.id,
      nome: company.nome,
    }))
    const isAllCompanies = activeCompanyId === "ALL"
    const activeScopedCompanyId = normalizeCompanyId(activeCompanyId)
    const defaultCompanyId = isAllCompanies
      ? (companies.length === 1 ? companies[0]?.id ?? null : null)
      : activeScopedCompanyId ?? companies[0]?.id ?? null

    return {
      companies,
      isAllCompanies,
      showCompanySelector: isAllCompanies && companies.length > 1,
      defaultCompanyId,
      activeScopedCompanyId,
    }
  }, [activeCompanyId, availableCompanies])
}
