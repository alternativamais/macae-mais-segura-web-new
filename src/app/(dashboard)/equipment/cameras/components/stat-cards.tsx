import { CheckCircle2, Monitor, XCircle } from "lucide-react"
import { SummaryStatCards } from "@/components/shared/summary-stat-cards"
import { useTranslator } from "@/lib/i18n"

interface StatCardsProps {
  stats: {
    total: number;
    active: number;
    inactive: number;
  } | null;
  isLoading?: boolean;
}

export function StatCards({ stats, isLoading = false }: StatCardsProps) {
  const t = useTranslator("cameras.stats")

  const cards = [
    {
      title: t("total"),
      value: stats?.total ?? 0,
      description: t("total_desc"),
      icon: Monitor,
    },
    {
      title: t("active"),
      value: stats?.active ?? 0,
      description: t("active_desc"),
      icon: CheckCircle2,
    },
    {
      title: t("inactive"),
      value: stats?.inactive ?? 0,
      description: t("inactive_desc"),
      icon: XCircle,
    },
  ]

  return (
    <SummaryStatCards
      items={cards.map((stat) => ({ ...stat, loading: isLoading || !stats }))}
      className="grid-cols-2 md:grid-cols-3"
      loadingLabel={t("loading")}
    />
  )
}
