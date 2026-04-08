import { Activity, CheckCircle2, Network, RadioTower, Router } from "lucide-react"
import { SummaryStatCards } from "@/components/shared/summary-stat-cards"
import { useTranslator } from "@/lib/i18n"
import { NetworkEquipment } from "@/types/network-equipment"

interface StatCardsProps {
  items: NetworkEquipment[]
  isLoading?: boolean
}

export function StatCards({ items, isLoading = false }: StatCardsProps) {
  const t = useTranslator("network_equipment.stats")

  const cards = [
    {
      title: t("total"),
      value: items.length,
      description: t("total_desc"),
      icon: Network,
    },
    {
      title: t("active"),
      value: items.filter((item) => item.status === "active").length,
      description: t("active_desc"),
      icon: CheckCircle2,
    },
    {
      title: t("online"),
      value: items.filter((item) => item.online).length,
      description: t("online_desc"),
      icon: Activity,
    },
    {
      title: t("points"),
      value: items.filter((item) => typeof item.pontoId === "number").length,
      description: t("points_desc"),
      icon: Router,
    },
    {
      title: t("totens"),
      value: items.filter((item) => typeof item.totemId === "number").length,
      description: t("totens_desc"),
      icon: RadioTower,
    },
  ]

  return <SummaryStatCards items={cards.map((stat) => ({ ...stat, loading: isLoading }))} className="grid-cols-2 xl:grid-cols-5" loadingLabel={t("loading")} />
}
