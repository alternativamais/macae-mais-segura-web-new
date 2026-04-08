import { CheckCircle2, MapPin, Power, ToggleLeft, XCircle } from "lucide-react"
import { SummaryStatCards } from "@/components/shared/summary-stat-cards"
import { useTranslator } from "@/lib/i18n"
import { SmartSwitch } from "@/types/smart-switch"

interface StatCardsProps {
  items: SmartSwitch[]
  isLoading?: boolean
}

export function StatCards({ items, isLoading = false }: StatCardsProps) {
  const t = useTranslator("smart_switches.stats")

  const linkedTotems = new Set(
    items
      .map((item) => item.totemId)
      .filter((value): value is number => typeof value === "number"),
  ).size

  const directPoints = new Set(
    items
      .filter((item) => typeof item.totemId !== "number")
      .map((item) => item.pontoId)
      .filter((value): value is number => typeof value === "number"),
  ).size

  const cards = [
    {
      title: t("total"),
      value: items.length,
      description: t("total_desc"),
      icon: ToggleLeft,
    },
    {
      title: t("active"),
      value: items.filter((item) => item.status === "active").length,
      description: t("active_desc"),
      icon: CheckCircle2,
    },
    {
      title: t("inactive"),
      value: items.filter((item) => item.status === "inactive").length,
      description: t("inactive_desc"),
      icon: XCircle,
    },
    {
      title: t("totems"),
      value: linkedTotems,
      description: t("totems_desc"),
      icon: Power,
    },
    {
      title: t("points"),
      value: directPoints,
      description: t("points_desc"),
      icon: MapPin,
    },
  ]

  return <SummaryStatCards items={cards.map((stat) => ({ ...stat, loading: isLoading }))} className="grid-cols-2 xl:grid-cols-5" loadingLabel={t("loading")} />
}
