"use client"

import { Archive, Clock3, Database, Loader2, ShieldCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
