"use client"

import { useMemo } from "react"
import { buildCompanyMap } from "@/lib/company-display"
import { useAuthStore } from "@/store/auth-store"

export function useCompanyVisibility() {
  const activeCompanyId = useAuthStore((state) => state.activeCompanyId)
  const availableCompanies = useAuthStore((state) => state.availableCompanies)

  return useMemo(
    () => ({
      isAllCompanies: activeCompanyId === "ALL",
      companiesById: buildCompanyMap(availableCompanies),
    }),
    [activeCompanyId, availableCompanies],
  )
}
