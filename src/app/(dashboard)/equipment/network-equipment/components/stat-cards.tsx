import { Activity, CheckCircle2, Network, RadioTower, Router } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {cards.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? t("loading") : stat.value}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
