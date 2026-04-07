import { Activity, Camera, KeyRound, Loader2, ShieldCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslator } from "@/lib/i18n"

interface IntegrationTabStatCardsProps {
  configuredCount: number
  availableCount: number
  activeCount: number
  activeTokensCount: number
  isLoading?: boolean
}

export function IntegrationTabStatCards({
  configuredCount,
  availableCount,
  activeCount,
  activeTokensCount,
  isLoading = false,
}: IntegrationTabStatCardsProps) {
  const t = useTranslator("plate_sending.management.stats")

  const stats = [
    {
      title: t("configured"),
      value: configuredCount,
      description: t("configured_desc"),
      icon: Camera,
    },
    {
      title: t("available"),
      value: availableCount,
      description: t("available_desc"),
      icon: ShieldCheck,
    },
    {
      title: t("active"),
      value: activeCount,
      description: t("active_desc"),
      icon: Activity,
    },
    {
      title: t("tokens"),
      value: activeTokensCount,
      description: t("tokens_desc"),
      icon: KeyRound,
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
