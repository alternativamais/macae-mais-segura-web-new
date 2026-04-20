"use client"

import { ExternalLink } from "lucide-react"
import { DataTag } from "@/components/shared/data-tag"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { useTranslator } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { LprFineReport } from "@/types/lpr-fine-report"

interface LprFineReportDetailsDialogProps {
  item: LprFineReport | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatDateTime(value: string | null | undefined, locale: string) {
  if (!value) return "—"

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(value))
}

function formatJson(value: unknown) {
  try {
    return JSON.stringify(value ?? {}, null, 2)
  } catch {
    return "{}"
  }
}

export function LprFineReportDetailsDialog({
  item,
  open,
  onOpenChange,
}: LprFineReportDetailsDialogProps) {
  const t = useTranslator("lpr_fines_reports.details")
  const locale = t.getLocale()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{t("title", { plate: item?.plateText ?? "—" })}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        {item ? (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-3">
                <div className="rounded-md border bg-card p-3">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h4 className="text-sm font-medium">{t("sections.image")}</h4>
                    {item.imageUrl ? (
                      <Button asChild size="sm" variant="outline">
                        <a href={item.imageUrl} target="_blank" rel="noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          {t("actions.open_image")}
                        </a>
                      </Button>
                    ) : null}
                  </div>

                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.plateText}
                      className="max-h-[320px] w-full rounded-md border object-contain"
                    />
                  ) : (
                    <div className="flex min-h-[220px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                      {t("labels.no_image")}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-md border bg-card">
                <div className="space-y-3 p-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("labels.plate")}</p>
                    <p className="text-2xl font-semibold tracking-wide">{item.plateText}</p>
                  </div>
                  <Separator />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("labels.company")}</p>
                      <p className="text-sm font-medium">{item.empresa?.nome || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("labels.rule")}</p>
                      <p className="text-sm font-medium">{item.rule?.name || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("labels.camera")}</p>
                      <p className="text-sm font-medium">{item.camera?.nome || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("labels.detected_at")}</p>
                      <p className="text-sm font-medium">{formatDateTime(item.detectedAt, locale)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("labels.triggered_at")}</p>
                      <p className="text-sm font-medium">{formatDateTime(item.triggeredAt, locale)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("labels.channels")}</p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {item.deliveryChannels?.length ? (
                          item.deliveryChannels.map((channel) => (
                            <DataTag key={channel} tone={channel === "whatsapp" ? "accent" : "info"}>
                              {channel === "whatsapp" ? "WhatsApp" : "Email"}
                            </DataTag>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-md border bg-card">
              <div className="border-b px-4 py-3">
                <h4 className="text-sm font-medium">{t("sections.deliveries")}</h4>
              </div>
              <div className="divide-y">
                {item.dispatchLogs?.length ? (
                  item.dispatchLogs.map((log) => (
                    <div key={log.id} className="grid gap-3 px-4 py-3 md:grid-cols-[140px_1fr_180px] md:items-start">
                      <div className="flex flex-wrap gap-2">
                        <DataTag tone={log.channel === "whatsapp" ? "accent" : "info"}>
                          {log.channel === "whatsapp" ? "WhatsApp" : "Email"}
                        </DataTag>
                        <DataTag tone={log.success ? "success" : "danger"}>
                          {log.success ? t("status.success") : t("status.error")}
                        </DataTag>
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm font-medium">{log.subject || "—"}</p>
                        <p className="text-sm text-muted-foreground">
                          {log.toRecipients?.length ? log.toRecipients.join(", ") : "—"}
                        </p>
                        {log.errorMessage ? (
                          <p className="text-sm text-red-400">{log.errorMessage}</p>
                        ) : null}
                      </div>

                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>{formatDateTime(log.sentAt || log.createdAt, locale)}</p>
                        {log.providerMessageId ? <p>{log.providerMessageId}</p> : null}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-6 text-sm text-muted-foreground">{t("labels.no_deliveries")}</div>
                )}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-md border bg-card">
                <div className="border-b px-4 py-3">
                  <h4 className="text-sm font-medium">{t("sections.detection_data")}</h4>
                </div>
                <pre className={cn("max-h-[280px] overflow-auto px-4 py-3 text-xs text-muted-foreground")}>
                  {formatJson(item.detectionSnapshot)}
                </pre>
              </div>
              <div className="rounded-md border bg-card">
                <div className="border-b px-4 py-3">
                  <h4 className="text-sm font-medium">{t("sections.payload_data")}</h4>
                </div>
                <pre className={cn("max-h-[280px] overflow-auto px-4 py-3 text-xs text-muted-foreground")}>
                  {formatJson(item.payloadSnapshot)}
                </pre>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
