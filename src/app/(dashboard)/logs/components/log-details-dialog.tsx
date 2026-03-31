"use client"

import { Info, ShieldCheck, UserRound } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslator } from "@/lib/i18n"
import { ApiLogRecord, AuditLogRecord, LogType } from "@/types/log"
import {
  LogLevelBadge,
  MethodBadge,
  OriginBadge,
  StatusCodeBadge,
} from "./status-badges"
import {
  formatDuration,
  formatLogDateTime,
  getOriginLabel,
  getUserLogLabel,
  safeJsonStringify,
} from "./utils"

interface LogDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: LogType
  log?: ApiLogRecord | AuditLogRecord | null
}

function JsonBlock({ content }: { content: string }) {
  return (
    <pre className="max-h-[340px] overflow-auto whitespace-pre-wrap break-all rounded-xl border bg-muted/20 p-4 text-xs leading-5">
      {content}
    </pre>
  )
}

function SummaryCard({
  title,
  value,
  icon: Icon,
}: {
  title: string
  value: string
  icon: typeof Info
}) {
  return (
    <Card className="gap-3 py-4">
      <CardHeader className="px-4 pb-0">
        <CardTitle className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="text-sm font-medium">{value}</div>
      </CardContent>
    </Card>
  )
}

export function LogDetailsDialog({
  open,
  onOpenChange,
  type,
  log,
}: LogDetailsDialogProps) {
  const t = useTranslator("logs.details")
  const tRoot = useTranslator("logs")
  const locale = t.getLocale()
  const apiLog = type === "api" ? (log as ApiLogRecord | null | undefined) : undefined
  const auditLog = type === "audit" ? (log as AuditLogRecord | null | undefined) : undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-hidden sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {log
              ? `${formatLogDateTime(log.createdAt, locale)} • ${getUserLogLabel(log, tRoot)} • ${getOriginLabel(log.clientOrigin, tRoot)}`
              : t("empty")}
          </DialogDescription>
        </DialogHeader>

        {log ? (
          <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
            <div className="space-y-4">
              <Card className="gap-3 py-4">
                <CardHeader className="px-4 pb-0">
                  <CardTitle className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {t("sections.summary")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 px-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <LogLevelBadge level={log.level} />
                    <OriginBadge origin={log.clientOrigin} />
                    {type === "api" && apiLog ? <MethodBadge method={apiLog.method} /> : null}
                    {type === "api" && apiLog ? (
                      <StatusCodeBadge statusCode={apiLog.statusCode} />
                    ) : null}
                  </div>
                  <div className="text-sm font-medium">{log.message || tRoot("shared.empty_value")}</div>
                </CardContent>
              </Card>

              <div className="grid gap-3">
                <SummaryCard
                  title={t("cards.user")}
                  value={getUserLogLabel(log, tRoot)}
                  icon={UserRound}
                />
                <SummaryCard
                  title={t("cards.origin")}
                  value={getOriginLabel(log.clientOrigin, tRoot)}
                  icon={ShieldCheck}
                />
                <SummaryCard
                  title={t("cards.moment")}
                  value={formatLogDateTime(log.createdAt, locale)}
                  icon={Info}
                />
              </div>

              <Card className="gap-3 py-4">
                <CardHeader className="px-4 pb-0">
                  <CardTitle className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {t("sections.metadata")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 text-sm">
                  <div className="space-y-2">
                    <div>
                      <span className="text-muted-foreground">{t("labels.ip")}:</span> {log.ip || tRoot("shared.empty_value")}
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t("labels.request_id")}:</span> {log.requestId || tRoot("shared.empty_value")}
                    </div>
                    {type === "api" && apiLog ? (
                      <>
                        <div>
                          <span className="text-muted-foreground">{t("labels.url")}:</span> {apiLog.url || tRoot("shared.empty_value")}
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t("labels.duration")}:</span>{" "}
                          {formatDuration(apiLog.durationMs, tRoot)}
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t("labels.controller")}:</span>{" "}
                          {apiLog.controller || tRoot("shared.empty_value")}
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t("labels.handler")}:</span> {apiLog.handler || tRoot("shared.empty_value")}
                        </div>
                      </>
                    ) : null}
                    {type === "audit" && auditLog ? (
                      <>
                        <div>
                          <span className="text-muted-foreground">{t("labels.action")}:</span> {auditLog.action || tRoot("shared.empty_value")}
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t("labels.entity")}:</span> {auditLog.entity || tRoot("shared.empty_value")}
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t("labels.entity_id")}:</span>{" "}
                          {auditLog.entityId || tRoot("shared.empty_value")}
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t("labels.logical_source")}:</span>{" "}
                          {auditLog.source || tRoot("shared.empty_value")}
                        </div>
                      </>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs
              defaultValue={type === "api" ? "payload" : "context"}
              className="w-full overflow-hidden"
            >
              <TabsList className="mb-4">
                {type === "api" ? (
                  <>
                    <TabsTrigger value="payload">{t("tabs.payload")}</TabsTrigger>
                    <TabsTrigger value="error">{t("tabs.error")}</TabsTrigger>
                    <TabsTrigger value="meta">{t("tabs.meta")}</TabsTrigger>
                  </>
                ) : (
                  <>
                    <TabsTrigger value="context">{t("tabs.context")}</TabsTrigger>
                    <TabsTrigger value="meta">{t("tabs.meta")}</TabsTrigger>
                  </>
                )}
              </TabsList>

              {type === "api" && apiLog ? (
                <>
                  <TabsContent value="payload" className="mt-4">
                    <ScrollArea className="h-[480px] pr-4">
                      <div className="space-y-4">
                        <div>
                          <div className="mb-2 text-sm font-medium">{t("payload.params")}</div>
                          <JsonBlock content={safeJsonStringify(apiLog.params)} />
                        </div>
                        <div>
                          <div className="mb-2 text-sm font-medium">{t("payload.query")}</div>
                          <JsonBlock content={safeJsonStringify(apiLog.query)} />
                        </div>
                        <div>
                          <div className="mb-2 text-sm font-medium">{t("payload.body")}</div>
                          <JsonBlock content={safeJsonStringify(apiLog.body)} />
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="error" className="mt-4">
                    <ScrollArea className="h-[480px] pr-4">
                      <div className="space-y-4">
                        <div>
                          <div className="mb-2 text-sm font-medium">{t("payload.error_block")}</div>
                          <JsonBlock
                            content={safeJsonStringify({
                              name: apiLog.errorName,
                              message: apiLog.errorMessage,
                            })}
                          />
                        </div>
                        <div>
                          <div className="mb-2 text-sm font-medium">{t("payload.stack")}</div>
                          <JsonBlock content={apiLog.stack || t("payload.no_stack")} />
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="meta" className="mt-4">
                    <ScrollArea className="h-[480px] pr-4">
                      <JsonBlock
                        content={safeJsonStringify({
                          controller: apiLog.controller,
                          handler: apiLog.handler,
                          userAgent: apiLog.userAgent,
                          requestId: apiLog.requestId,
                          ip: apiLog.ip,
                          clientOrigin: apiLog.clientOrigin,
                        })}
                      />
                    </ScrollArea>
                  </TabsContent>
                </>
              ) : null}

              {type === "audit" && auditLog ? (
                <>
                  <TabsContent value="context" className="mt-4">
                    <ScrollArea className="h-[480px] pr-4">
                      <JsonBlock content={safeJsonStringify(auditLog.context)} />
                    </ScrollArea>
                  </TabsContent>
                  <TabsContent value="meta" className="mt-4">
                    <ScrollArea className="h-[480px] pr-4">
                      <JsonBlock
                        content={safeJsonStringify({
                          action: auditLog.action,
                          entity: auditLog.entity,
                          entityId: auditLog.entityId,
                          source: auditLog.source,
                          requestId: auditLog.requestId,
                          ip: auditLog.ip,
                          clientOrigin: auditLog.clientOrigin,
                        })}
                      />
                    </ScrollArea>
                  </TabsContent>
                </>
              ) : null}
            </Tabs>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
