"use client"

import { CheckCircle2, MapPin, RadioTower, Thermometer } from "lucide-react"
import { SummaryStatCards } from "@/components/shared/summary-stat-cards"
import { useTranslator } from "@/lib/i18n"
import { ClimateEquipment } from "@/types/climate-equipment"

interface StatCardsProps {
  items: ClimateEquipment[]
  isLoading?: boolean
}

export function StatCards({ items, isLoading = false }: StatCardsProps) {
  const t = useTranslator("climate_equipment.stats")

  const cards = [
    {
      title: t("total"),
      value: items.length,
      description: t("total_desc"),
      icon: Thermometer,
    },
    {
      title: t("active"),
      value: items.filter((item) => item.status === "active").length,
      description: t("active_desc"),
      icon: CheckCircle2,
    },
    {
      title: t("points"),
      value: items.filter((item) => item.ponto || typeof item.pontoId === "number").length,
      description: t("points_desc"),
      icon: MapPin,
    },
    {
      title: t("totens"),
      value: items.filter((item) => item.totem).length,
      description: t("totens_desc"),
      icon: RadioTower,
    },
  ]

  return <SummaryStatCards items={cards.map((card) => ({ ...card, loading: isLoading }))} className="grid-cols-2 xl:grid-cols-4" loadingLabel={t("loading")} />
}
