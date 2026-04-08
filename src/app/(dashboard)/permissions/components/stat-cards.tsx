"use client"

import { useEffect, useState } from "react"
import { KeyRound, LayoutTemplate, ShieldCheck, Shapes } from "lucide-react"
import { SummaryStatCards } from "@/components/shared/summary-stat-cards"
import { useTranslator } from "@/lib/i18n"
import { permissionService } from "@/services/permission.service"
import { roleService } from "@/services/role.service"
import { frontendScreenService } from "@/services/frontend-screen.service"

interface SummaryState {
  roles: number | null
  permissions: number | null
  webScreens: number | null
  permissionGroups: number | null
}

const initialSummary: SummaryState = {
  roles: null,
  permissions: null,
  webScreens: null,
  permissionGroups: null,
}

export function StatCards() {
  const [summary, setSummary] = useState<SummaryState>(initialSummary)
  const [isLoading, setIsLoading] = useState(true)
  const t = useTranslator("permissions.stats")

  useEffect(() => {
    const loadSummary = async () => {
      setIsLoading(true)

      const [rolesResult, permissionsResult, screensResult] = await Promise.allSettled([
        roleService.findAllNoPagination(),
        permissionService.findAllNoPagination(),
        frontendScreenService.findAll("web"),
      ])

      const permissions =
        permissionsResult.status === "fulfilled" ? permissionsResult.value : []

      setSummary({
        roles: rolesResult.status === "fulfilled" ? rolesResult.value.length : null,
        permissions:
          permissionsResult.status === "fulfilled" ? permissionsResult.value.length : null,
        webScreens: screensResult.status === "fulfilled" ? screensResult.value.length : null,
        permissionGroups:
          permissionsResult.status === "fulfilled"
            ? new Set(
                permissions.map((permission) => permission.group).filter(Boolean)
              ).size
            : null,
      })

      setIsLoading(false)
    }

    loadSummary()
  }, [])

  const cards = [
    {
      title: t("roles"),
      value: summary.roles,
      description: t("roles_desc"),
      icon: ShieldCheck,
    },
    {
      title: t("permissions"),
      value: summary.permissions,
      description: t("permissions_desc"),
      icon: KeyRound,
    },
    {
      title: t("screens"),
      value: summary.webScreens,
      description: t("screens_desc"),
      icon: LayoutTemplate,
    },
    {
      title: t("groups"),
      value: summary.permissionGroups,
      description: t("groups_desc"),
      icon: Shapes,
    },
  ]

  return (
    <SummaryStatCards
      items={cards.map((card) => ({
        ...card,
        value: card.value === null ? "--" : card.value,
        loading: isLoading,
      }))}
      className="grid-cols-2 xl:grid-cols-4"
      loadingLabel={t("loading")}
    />
  )
}
