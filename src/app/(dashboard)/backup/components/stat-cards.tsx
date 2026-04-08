"use client"

import { Archive, Clock3, Database, ShieldCheck } from "lucide-react"
import { SummaryStatCards } from "@/components/shared/summary-stat-cards"
import { BackupRecord, BackupSettings } from "@/types/backup"
import { formatDateTime } from "./utils"
import { useTranslator } from "@/lib/i18n"

interface StatCardsProps {
  backups: BackupRecord[]
  settings: BackupSettings | null
  isLoading: boolean
}

export function StatCards({ backups, settings, isLoading }: StatCardsProps) {
  const t = useTranslator("backup.stat_cards")
  const completed = backups.filter((backup) => backup.status === "completed").length
  const failed = backups.filter((backup) => backup.status === "failed").length

  const cards = [
    {
      title: t("card_total"),
      value: backups.length,
      description: t("card_total_desc"),
      icon: Archive,
    },
    {
      title: t("card_completed"),
      value: completed,
      description: t("card_completed_desc"),
      icon: ShieldCheck,
    },
    {
      title: t("card_failed"),
      value: failed,
      description: t("card_failed_desc"),
      icon: Database,
    },
    {
      title: t("card_last"),
      value: settings?.lastRunAt ? formatDateTime(settings.lastRunAt) : "--",
      description: settings?.enabled
        ? t("card_last_desc_on")
        : t("card_last_desc_off"),
      icon: Clock3,
    },
  ]

  return (
    <SummaryStatCards
      items={cards.map((card) => ({
        ...card,
        loading: isLoading,
        valueClassName: typeof card.value === "string" ? "text-sm md:text-2xl" : undefined,
      }))}
      className="grid-cols-2 xl:grid-cols-4"
      loadingLabel={t("loading")}
    />
  )
}
