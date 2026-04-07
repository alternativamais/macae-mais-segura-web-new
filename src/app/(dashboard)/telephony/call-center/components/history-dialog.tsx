"use client"

import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { useTranslator } from "@/lib/i18n"
import { formatLocalizedDateTime } from "@/lib/i18n/date"
import { parseISO } from "date-fns"
import { CallCenterCall } from "@/types/call-center"
import { getHistoryEntryLabel } from "./utils"

interface HistoryDialogProps {
  call: CallCenterCall | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function HistoryDialog({ call, open, onOpenChange }: HistoryDialogProps) {
  const t = useTranslator("call_center")

  if (!call) return null

  const history = Array.isArray(call.history) ? call.history : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("history_dialog.title", { id: call.id })}</DialogTitle>
          <DialogDescription>{t("history_dialog.description")}</DialogDescription>
        </DialogHeader>

        {history.length === 0 ? (
          <div className="py-6 text-sm text-muted-foreground">{t("history_dialog.empty")}</div>
        ) : (
          <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
            {history.map((entry, index) => (
              <div key={`${entry.id}-${index}`} className="space-y-3">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm font-medium">
                      {t(getHistoryEntryLabel(entry))}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {entry.createdAt
                        ? formatLocalizedDateTime(parseISO(entry.createdAt), t.getLocale())
                        : "-"}
                    </span>
                  </div>
                  {entry.description ? (
                    <p className="text-sm text-muted-foreground">{entry.description}</p>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    {entry.status ? <Badge variant="outline">{entry.status}</Badge> : null}
                    {entry.agentExtension ? (
                      <Badge variant="secondary">
                        {t("history_dialog.extension", { extension: entry.agentExtension })}
                      </Badge>
                    ) : null}
                    {entry.agent?.name ? <Badge variant="secondary">{entry.agent.name}</Badge> : null}
                    {entry.queueName ? <Badge variant="outline">{entry.queueName}</Badge> : null}
                  </div>
                </div>
                {index < history.length - 1 ? <Separator /> : null}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
