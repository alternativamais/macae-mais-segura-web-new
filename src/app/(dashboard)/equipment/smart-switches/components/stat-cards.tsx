import { CheckCircle2, Loader2, MapPin, Power, ToggleLeft, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
