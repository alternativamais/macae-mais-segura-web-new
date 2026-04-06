import { CheckCircle2, Loader2, MapPin, RadioTower, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <span className="inline-flex items-center gap-2 text-base text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("loading")}
                </span>
              ) : (
                stat.value
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
