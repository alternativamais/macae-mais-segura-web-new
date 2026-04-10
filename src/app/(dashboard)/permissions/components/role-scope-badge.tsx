"use client"

import { Building2, Globe } from "lucide-react"
import { DataTag } from "@/components/shared/data-tag"
import { useTranslator } from "@/lib/i18n"
import { Role } from "@/types/role"
import { CompanyNameById, getRoleScopeLabel, isGlobalRole } from "./utils"

interface RoleScopeBadgeProps {
  role: Role
  companyNameById: CompanyNameById
}

export function RoleScopeBadge({ role, companyNameById }: RoleScopeBadgeProps) {
  const t = useTranslator("permissions.shared")
  const global = isGlobalRole(role)
  const label = getRoleScopeLabel(role, companyNameById, {
    globalRole: t("global_role"),
    companyFallback: (empresaId) => t("company_role_fallback", { id: empresaId }),
  })

  return (
    <DataTag tone={global ? "neutral" : "info"} className="h-5 px-2">
      {global ? <Globe className="size-3" /> : <Building2 className="size-3" />}
      {label}
    </DataTag>
  )
}
