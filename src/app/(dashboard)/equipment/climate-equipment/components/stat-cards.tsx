"use client"

import { CheckCircle2, Loader2, MapPin, RadioTower, Thermometer } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <span className="inline-flex items-center gap-2 text-base text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("loading")}
                </span>
              ) : (
                card.value
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
