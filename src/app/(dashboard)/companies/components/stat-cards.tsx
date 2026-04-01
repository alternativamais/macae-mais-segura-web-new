import { Building2, CheckCircle2, Loader2, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslator } from "@/lib/i18n"
import { Empresa } from "@/types/empresa"

interface StatCardsProps {
  companies: Empresa[]
  isLoading?: boolean
}

export function StatCards({ companies, isLoading = false }: StatCardsProps) {
  const t = useTranslator("companies.stats")

  const stats = [
    {
      title: t("total"),
      value: companies.length,
      description: t("total_desc"),
      icon: Building2,
    },
    {
      title: t("active"),
      value: companies.filter((c) => c.status === "active").length,
      description: t("active_desc"),
      icon: CheckCircle2,
    },
    {
      title: t("inactive"),
      value: companies.filter((c) => c.status === "inactive").length,
      description: t("inactive_desc"),
      icon: XCircle,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-3">
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
