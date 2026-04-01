import { CheckCircle2, Loader2, Monitor, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslator } from "@/lib/i18n"

interface StatCardsProps {
  stats: {
    total: number;
    active: number;
    inactive: number;
  } | null;
  isLoading?: boolean;
}

export function StatCards({ stats, isLoading = false }: StatCardsProps) {
  const t = useTranslator("cameras.stats")

  const cards = [
    {
      title: t("total"),
      value: stats?.total ?? 0,
      description: t("total_desc"),
      icon: Monitor,
    },
    {
      title: t("active"),
      value: stats?.active ?? 0,
      description: t("active_desc"),
      icon: CheckCircle2,
    },
    {
      title: t("inactive"),
      value: stats?.inactive ?? 0,
      description: t("inactive_desc"),
      icon: XCircle,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading || !stats ? (
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
