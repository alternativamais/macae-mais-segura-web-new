"use client"

import { type ReactNode } from "react"
import { ExternalLink, ImageIcon, Radio, ReceiptText } from "lucide-react"
import { DataTag } from "@/components/shared/data-tag"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { resolveCompanyLogoUrl } from "@/lib/company-logo"
import { useTranslator } from "@/lib/i18n"
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

function SummaryMetric({
  label,
  value,
}: {
  label: string
  value: ReactNode
}) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  )
}

function JsonBlock({ content }: { content: string }) {
  return (
    <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap break-all rounded-xl border bg-muted/20 p-4 text-xs leading-5 text-muted-foreground">
      {content}
    </pre>
  )
}

export function LprFineReportDetailsDialog({
  item,
  open,
  onOpenChange,
}: LprFineReportDetailsDialogProps) {
  const t = useTranslator("lpr_fines_reports.details")
  const locale = t.getLocale()
  const resolvedImageUrl = resolveCompanyLogoUrl(item?.imageUrl)

  if (!item) return null

  const summaryItems = [
    { label: t("labels.company"), value: item.empresa?.nome || "—" },
    { label: t("labels.rule"), value: item.rule?.name || item.ruleName || "—" },
    { label: t("labels.camera"), value: item.camera?.nome || "—" },
    { label: t("labels.detected_at"), value: formatDateTime(item.detectedAt, locale) },
    { label: t("labels.triggered_at"), value: formatDateTime(item.triggeredAt, locale) },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-hidden p-0 sm:max-w-5xl">
        <DialogHeader className="border-b px-6 py-5">
          <DialogTitle>{t("title", { plate: item.plateText ?? "—" })}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="border-b px-6 py-3">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="overview">{t("tabs.overview")}</TabsTrigger>
              <TabsTrigger value="deliveries">{t("tabs.deliveries")}</TabsTrigger>
              <TabsTrigger value="raw_data">{t("tabs.raw_data")}</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="m-0 min-h-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-6 px-6 py-5">
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_360px]">
                  <div className="overflow-hidden rounded-xl border bg-card">
                    <div className="flex items-center justify-between border-b px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        <h4 className="text-sm font-medium">{t("sections.image")}</h4>
                      </div>
                      {resolvedImageUrl ? (
                        <Button asChild size="sm" variant="outline">
                          <a href={resolvedImageUrl} target="_blank" rel="noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            {t("actions.open_image")}
                          </a>
                        </Button>
                      ) : null}
                    </div>

                    <div className="p-4">
                      {resolvedImageUrl ? (
                        <img
                          src={resolvedImageUrl}
                          alt={item.plateText}
                          className="max-h-[420px] w-full rounded-lg border object-contain"
                        />
                      ) : (
                        <div className="flex min-h-[260px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                          {t("labels.no_image")}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-xl border bg-card p-5">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                        {t("labels.plate")}
                      </p>
                      <p className="mt-2 text-3xl font-semibold tracking-wide">{item.plateText}</p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {item.deliveryChannels?.length ? (
                          item.deliveryChannels.map((channel) => (
                            <DataTag key={channel} tone={channel === "whatsapp" ? "accent" : "info"}>
                              {channel === "whatsapp" ? "WhatsApp" : "Email"}
                            </DataTag>
                          ))
                        ) : (
                          <DataTag tone="neutral">—</DataTag>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                      {summaryItems.map((entry) => (
                        <SummaryMetric key={entry.label} label={entry.label} value={entry.value} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="deliveries" className="m-0 min-h-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-4 px-6 py-5">
                <div className="flex items-center gap-2">
                  <ReceiptText className="h-4 w-4 text-muted-foreground" />
                  <h4 className="text-sm font-medium">{t("sections.deliveries")}</h4>
                </div>

                {item.dispatchLogs?.length ? (
                  <div className="space-y-3">
                    {item.dispatchLogs.map((log) => (
                      <div key={log.id} className="rounded-xl border bg-card p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-3">
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
                          </div>

                          <div className="space-y-1 text-sm text-muted-foreground sm:text-right">
                            <p>{formatDateTime(log.sentAt || log.createdAt, locale)}</p>
                            {log.providerMessageId ? <p className="break-all">{log.providerMessageId}</p> : null}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed px-4 py-10 text-sm text-muted-foreground">
                    {t("labels.no_deliveries")}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="raw_data" className="m-0 min-h-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-6 px-6 py-5">
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4 text-muted-foreground" />
                  <h4 className="text-sm font-medium">{t("sections.raw_summary")}</h4>
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                  <div className="space-y-3">
                    <h5 className="text-sm font-medium">{t("sections.detection_data")}</h5>
                    <JsonBlock content={formatJson(item.detectionSnapshot)} />
                  </div>

                  <div className="space-y-3">
                    <h5 className="text-sm font-medium">{t("sections.payload_data")}</h5>
                    <JsonBlock content={formatJson(item.payloadSnapshot)} />
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
