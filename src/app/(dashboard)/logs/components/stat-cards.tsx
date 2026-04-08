"use client"

import { useEffect, useState } from "react"
import { Activity, AlertTriangle, Bug, ScrollText } from "lucide-react"
import { SummaryStatCards } from "@/components/shared/summary-stat-cards"
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
    <SummaryStatCards
      items={cards.map((card) => ({
        ...card,
        value: card.value === null ? "--" : card.value,
        loading: isLoading,
      }))}
      className="grid-cols-2 xl:grid-cols-4"
      loadingLabel={t("loading")}
    />
  )
}
