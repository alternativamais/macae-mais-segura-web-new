import { Building2, CheckCircle2, XCircle } from "lucide-react"
import { SummaryStatCards } from "@/components/shared/summary-stat-cards"
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

  return <SummaryStatCards items={stats.map((stat) => ({ ...stat, loading: isLoading }))} className="grid-cols-2 md:grid-cols-3" loadingLabel={t("loading")} />
}
