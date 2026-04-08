"use client"

import { Camera, Map, RadioTower, Shield } from "lucide-react"
import { SummaryStatCards } from "@/components/shared/summary-stat-cards"
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

  return <SummaryStatCards items={cards} className="grid-cols-2 xl:grid-cols-4" />
}
