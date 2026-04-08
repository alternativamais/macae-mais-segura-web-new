import { Activity, Camera, Send, Waypoints } from "lucide-react"
import { SummaryStatCards } from "@/components/shared/summary-stat-cards"
import { useTranslator } from "@/lib/i18n"
import { Integration } from "@/types/integration"

interface StatCardsProps {
  integrations: Integration[]
  isLoading?: boolean
}

export function StatCards({ integrations, isLoading = false }: StatCardsProps) {
  const t = useTranslator("plate_sending.stats")

  const total = integrations.length
  const active = integrations.filter((integration) => integration.enabled).length
  const inactive = total - active
  const uniqueCodes = new Set(integrations.map((integration) => integration.code)).size

  const stats = [
    {
      title: t("total"),
      value: total,
      description: t("total_desc"),
      icon: Waypoints,
    },
    {
      title: t("active"),
      value: active,
      description: t("active_desc"),
      icon: Activity,
    },
    {
      title: t("inactive"),
      value: inactive,
      description: t("inactive_desc"),
      icon: Send,
    },
    {
      title: t("codes"),
      value: uniqueCodes,
      description: t("codes_desc"),
      icon: Camera,
    },
  ]

  return <SummaryStatCards items={stats.map((stat) => ({ ...stat, loading: isLoading }))} className="grid-cols-2 xl:grid-cols-4" loadingLabel={t("loading")} />
}
