import { CheckCircle2, Cpu, Loader2, RadioTower, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
