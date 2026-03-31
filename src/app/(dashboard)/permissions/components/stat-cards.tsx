"use client"

import { useEffect, useState } from "react"
import { KeyRound, LayoutTemplate, Loader2, ShieldCheck, Shapes } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <span className="inline-flex items-center gap-2 text-base text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("loading")}
                </span>
              ) : card.value === null ? (
                "--"
              ) : (
                card.value
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
