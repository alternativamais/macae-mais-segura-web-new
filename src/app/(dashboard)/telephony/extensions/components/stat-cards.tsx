"use client"

import { Phone, RadioTower, ShieldCheck, UserRound } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslator } from "@/lib/i18n"
import { CallCenterExtension } from "@/types/call-center-extension"

interface StatCardsProps {
  extensions: CallCenterExtension[]
  isLoading?: boolean
}

export function StatCards({ extensions, isLoading }: StatCardsProps) {
  const t = useTranslator("call_center_extensions.stats")

  const total = extensions.length
  const active = extensions.filter((item) => item.status === "active").length
  const linkedToTotem = extensions.filter((item) => item.type === "totem").length
  const operators = extensions.filter((item) => item.type === "operator").length

  const cards = [
    {
      title: t("total"),
      description: t("total_desc"),
      value: total,
      icon: Phone,
    },
    {
      title: t("active"),
      description: t("active_desc"),
      value: active,
      icon: ShieldCheck,
    },
    {
      title: t("totem"),
      description: t("totem_desc"),
      value: linkedToTotem,
      icon: RadioTower,
    },
    {
      title: t("operator"),
      description: t("operator_desc"),
      value: operators,
      icon: UserRound,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon

        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <p className="text-xs text-muted-foreground">{card.description}</p>
              </div>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-tight">
                {isLoading ? t("loading") : card.value}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
