"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useTranslator } from "@/lib/i18n"
import { formatLocalizedDateTime } from "@/lib/i18n/date"
import { parseISO } from "date-fns"
import { NotificationDetails } from "@/types/notification-center"
import { formatNotificationAudience, formatNotificationTarget } from "./utils"

interface NotificationHistoryDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: NotificationDetails | null
  isLoading?: boolean
}

const STATUS_LABELS: Record<string, string> = {
  sent: "history.details.status_sent",
  failed: "history.details.status_failed",
  pending: "history.details.status_pending",
  no_token: "history.details.status_no_token",
}

export function NotificationHistoryDetailsDialog({
  open,
  onOpenChange,
  data,
  isLoading,
}: NotificationHistoryDetailsDialogProps) {
  const t = useTranslator("notification_center")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{t("history.details.title")}</DialogTitle>
          <DialogDescription>{t("history.details.description")}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-sm text-muted-foreground">{t("history.details.loading")}</div>
        ) : data ? (
          <div className="space-y-6">
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="space-y-2">
                <div className="text-lg font-semibold">{data.notification.title}</div>
                <p className="text-sm text-muted-foreground">{data.notification.body}</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Badge variant="outline">
                    {formatNotificationTarget(data.notification, (key) => t(key))}
                  </Badge>
                  <Badge variant="outline">
                    {formatNotificationAudience(data.notification.audience, (key) => t(key))}
                  </Badge>
                  <Badge variant="secondary">
                    {formatLocalizedDateTime(parseISO(data.notification.createdAt), t.getLocale())}
                  </Badge>
                </div>
              </div>

              {data.notification.data ? (
                <div className="mt-4 rounded-md border bg-background p-3">
                  <div className="mb-2 text-sm font-medium">{t("history.details.extra_data")}</div>
                  <pre className="overflow-x-auto whitespace-pre-wrap text-xs text-muted-foreground">
                    {JSON.stringify(data.notification.data, null, 2)}
                  </pre>
                </div>
              ) : null}
            </div>

            <div className="rounded-md border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("history.details.columns.user")}</TableHead>
                    <TableHead>{t("history.details.columns.status")}</TableHead>
                    <TableHead>{t("history.details.columns.read_at")}</TableHead>
                    <TableHead>{t("history.details.columns.error")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recipients.length > 0 ? (
                    data.recipients.map((recipient) => (
                      <TableRow key={recipient.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">
                              {recipient.userApp?.name || t("shared.not_informed")}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {recipient.userApp?.email || t("shared.not_informed")}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {t(STATUS_LABELS[recipient.deliveryStatus] || "shared.not_informed")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {recipient.readAt
                            ? formatLocalizedDateTime(parseISO(recipient.readAt), t.getLocale())
                            : "—"}
                        </TableCell>
                        <TableCell>{recipient.lastError || "—"}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        {t("history.details.empty")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="py-8 text-sm text-muted-foreground">{t("history.details.empty")}</div>
        )}
      </DialogContent>
    </Dialog>
  )
}
