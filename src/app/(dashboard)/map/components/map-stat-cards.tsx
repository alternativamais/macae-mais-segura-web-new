"use client"

import { Camera, Map, RadioTower, Shield } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslator } from "@/lib/i18n"
import { OfficerLocation, OperationalMapMarker } from "@/types/map"
import { countPointCameras } from "./utils"

interface MapStatCardsProps {
  markers: OperationalMapMarker[]
  officers: OfficerLocation[]
}

export function MapStatCards({ markers, officers }: MapStatCardsProps) {
  const t = useTranslator("operational_map.stats")

  const cards = [
    {
      title: t("points"),
      value: markers.length,
      description: t("points_desc"),
      icon: Map,
    },
    {
      title: t("totens"),
      value: markers.filter((marker) => marker.point.totem?.id).length,
      description: t("totens_desc"),
      icon: RadioTower,
    },
    {
      title: t("cameras"),
      value: markers.reduce((sum, marker) => sum + countPointCameras(marker.point), 0),
      description: t("cameras_desc"),
      icon: Camera,
    },
    {
      title: t("officers"),
      value: officers.length,
      description: t("officers_desc"),
      icon: Shield,
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
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="mt-1 text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
