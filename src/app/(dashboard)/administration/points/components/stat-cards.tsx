import { CheckCircle2, MapPin, RadioTower, XCircle } from "lucide-react"
import { SummaryStatCards } from "@/components/shared/summary-stat-cards"
import { useTranslator } from "@/lib/i18n"
import { Ponto } from "@/types/ponto"
import { getPointEquipmentCount } from "./utils"

interface StatCardsProps {
  points: Ponto[]
  isLoading?: boolean
}

export function StatCards({ points, isLoading = false }: StatCardsProps) {
  const t = useTranslator("points.stats")

  const cards = [
    {
      title: t("total"),
      value: points.length,
      description: t("total_desc"),
      icon: MapPin,
    },
    {
      title: t("active"),
      value: points.filter((point) => point.status === "active").length,
      description: t("active_desc"),
      icon: CheckCircle2,
    },
    {
      title: t("inactive"),
      value: points.filter((point) => point.status === "inactive").length,
      description: t("inactive_desc"),
      icon: XCircle,
    },
    {
      title: t("equipment"),
      value: points.reduce((total, point) => total + getPointEquipmentCount(point), 0),
      description: t("equipment_desc"),
      icon: RadioTower,
    },
  ]

  return <SummaryStatCards items={cards.map((stat) => ({ ...stat, loading: isLoading }))} className="grid-cols-2 xl:grid-cols-4" loadingLabel={t("loading")} />
}
