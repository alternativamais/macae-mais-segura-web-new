"use client"

import { useEffect, useState } from "react"
import { Activity, AlertTriangle, Bug, Loader2, ScrollText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslator } from "@/lib/i18n"
import { logService } from "@/services/log.service"

interface SummaryState {
  apiTotal: number | null
  auditTotal: number | null
  apiErrors: number | null
  auditWarnings: number | null
}

const initialState: SummaryState = {
  apiTotal: null,
  auditTotal: null,
  apiErrors: null,
  auditWarnings: null,
}

export function StatCards() {
  const t = useTranslator("logs.stats")
  const [summary, setSummary] = useState(initialState)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadSummary = async () => {
      setIsLoading(true)
      const [apiTotal, auditTotal, apiErrors, auditWarnings] = await Promise.allSettled([
        logService.listApiLogs({ page: 1, pageSize: 1 }),
        logService.listAuditLogs({ page: 1, pageSize: 1 }),
        logService.listApiLogs({ page: 1, pageSize: 1, level: "error" }),
        logService.listAuditLogs({ page: 1, pageSize: 1, level: "warn" }),
      ])

      setSummary({
        apiTotal: apiTotal.status === "fulfilled" ? apiTotal.value.total : null,
        auditTotal: auditTotal.status === "fulfilled" ? auditTotal.value.total : null,
        apiErrors: apiErrors.status === "fulfilled" ? apiErrors.value.total : null,
        auditWarnings:
          auditWarnings.status === "fulfilled" ? auditWarnings.value.total : null,
      })

      setIsLoading(false)
    }

    loadSummary()
  }, [])

  const cards = [
    {
      title: t("cards.api_total.title"),
      value: summary.apiTotal,
      description: t("cards.api_total.description"),
      icon: Activity,
    },
    {
      title: t("cards.audit_total.title"),
      value: summary.auditTotal,
      description: t("cards.audit_total.description"),
      icon: ScrollText,
    },
    {
      title: t("cards.api_errors.title"),
      value: summary.apiErrors,
      description: t("cards.api_errors.description"),
      icon: Bug,
    },
    {
      title: t("cards.audit_warnings.title"),
      value: summary.auditWarnings,
      description: t("cards.audit_warnings.description"),
      icon: AlertTriangle,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <span className="inline-flex items-center gap-2 text-base text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("loading")}
                </span>
              ) : card.value === null ? (
                "--"
              ) : (
                card.value
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
