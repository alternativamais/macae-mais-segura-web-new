import { CheckCircle2, Cpu, RadioTower, XCircle } from "lucide-react"
import { SummaryStatCards } from "@/components/shared/summary-stat-cards"
import { useTranslator } from "@/lib/i18n"
import { Totem } from "@/types/totem"
import { getTotemIntegratedEquipmentCount } from "./utils"

interface StatCardsProps {
  totems: Totem[]
  isLoading?: boolean
}

export function StatCards({ totems, isLoading = false }: StatCardsProps) {
  const t = useTranslator("totens.stats")

  const cards = [
    {
      title: t("total"),
      value: totems.length,
      description: t("total_desc"),
      icon: RadioTower,
    },
    {
      title: t("active"),
      value: totems.filter((totem) => totem.status === "active").length,
      description: t("active_desc"),
      icon: CheckCircle2,
    },
    {
      title: t("inactive"),
      value: totems.filter((totem) => totem.status === "inactive").length,
      description: t("inactive_desc"),
      icon: XCircle,
    },
    {
      title: t("integrations"),
      value: totems.reduce(
        (total, totem) => total + getTotemIntegratedEquipmentCount(totem),
        0,
      ),
      description: t("integrations_desc"),
      icon: Cpu,
    },
  ]

  return <SummaryStatCards items={cards.map((stat) => ({ ...stat, loading: isLoading }))} className="grid-cols-2 xl:grid-cols-4" loadingLabel={t("loading")} />
}
