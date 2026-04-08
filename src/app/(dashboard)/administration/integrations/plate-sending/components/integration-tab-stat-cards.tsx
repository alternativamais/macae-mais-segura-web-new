import { Activity, Camera, KeyRound, ShieldCheck } from "lucide-react"
import { SummaryStatCards } from "@/components/shared/summary-stat-cards"
import { useTranslator } from "@/lib/i18n"

interface IntegrationTabStatCardsProps {
  configuredCount: number
  availableCount: number
  activeCount: number
  activeTokensCount: number
  isLoading?: boolean
}

export function IntegrationTabStatCards({
  configuredCount,
  availableCount,
  activeCount,
  activeTokensCount,
  isLoading = false,
}: IntegrationTabStatCardsProps) {
  const t = useTranslator("plate_sending.management.stats")

  const stats = [
    {
      title: t("configured"),
      value: configuredCount,
      description: t("configured_desc"),
      icon: Camera,
    },
    {
      title: t("available"),
      value: availableCount,
      description: t("available_desc"),
      icon: ShieldCheck,
    },
    {
      title: t("active"),
      value: activeCount,
      description: t("active_desc"),
      icon: Activity,
    },
    {
      title: t("tokens"),
      value: activeTokensCount,
      description: t("tokens_desc"),
      icon: KeyRound,
    },
  ]

  return <SummaryStatCards items={stats.map((stat) => ({ ...stat, loading: isLoading }))} className="grid-cols-2 xl:grid-cols-4" loadingLabel={t("loading")} />
}
