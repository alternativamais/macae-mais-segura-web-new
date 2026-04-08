"use client"

import { Phone, RadioTower, ShieldCheck, UserRound } from "lucide-react"
import { SummaryStatCards } from "@/components/shared/summary-stat-cards"
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
    <SummaryStatCards
      items={cards.map((card) => ({
        ...card,
        loading: isLoading,
        valueClassName: "text-lg font-semibold md:text-3xl",
      }))}
      className="grid-cols-2 xl:grid-cols-4"
      loadingLabel={t("loading")}
    />
  )
}
