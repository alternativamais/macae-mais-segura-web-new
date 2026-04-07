import { Activity, Camera, Loader2, Send, Waypoints } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslator } from "@/lib/i18n"
import { Integration } from "@/types/integration"

interface StatCardsProps {
  integrations: Integration[]
  isLoading?: boolean
}

export function StatCards({ integrations, isLoading = false }: StatCardsProps) {
  const t = useTranslator("plate_sending.stats")

  const total = integrations.length
  const active = integrations.filter((integration) => integration.enabled).length
  const inactive = total - active
  const uniqueCodes = new Set(integrations.map((integration) => integration.code)).size

  const stats = [
    {
      title: t("total"),
      value: total,
      description: t("total_desc"),
      icon: Waypoints,
    },
    {
      title: t("active"),
      value: active,
      description: t("active_desc"),
      icon: Activity,
    },
    {
      title: t("inactive"),
      value: inactive,
      description: t("inactive_desc"),
      icon: Send,
    },
    {
      title: t("codes"),
      value: uniqueCodes,
      description: t("codes_desc"),
      icon: Camera,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
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
