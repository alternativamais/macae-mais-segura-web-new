"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { BackupRecord } from "@/types/backup"
import {
  BackupDropboxBadge,
  BackupOriginBadge,
  BackupStatusBadge,
  BackupStorageProviderBadge,
} from "./status-badges"
import {
  formatBytes,
  formatDateTime,
  formatLocaleNumber,
  getBackupSummary,
} from "./utils"
import { useTranslator } from "@/lib/i18n"

interface BackupDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  backup: BackupRecord | null
}

export function BackupDetailsDialog({
  open,
  onOpenChange,
  backup,
}: BackupDetailsDialogProps) {
  const t = useTranslator("backup.details_dialog")
  const currentLocale = t.getLocale()

  if (!backup) return null

  const summary = getBackupSummary(backup)

  const items = [
    { label: t("file"), value: backup.fileName || t("no_name") },
    { label: t("status"), value: <BackupStatusBadge status={backup.status} /> },
    { label: t("origin"), value: <BackupOriginBadge initiatedBy={backup.initiatedBy} /> },
    { label: t("created_at"), value: formatDateTime(backup.createdAt, currentLocale) },
    { label: t("updated_at"), value: formatDateTime(backup.updatedAt, currentLocale) },
    { label: t("size"), value: formatBytes(backup.fileSizeBytes) },
    {
      label: t("provider"),
      value: <BackupStorageProviderBadge storageProvider={backup.storageProvider} />,
    },
    {
      label: t("dropbox"),
      value: <BackupDropboxBadge uploadedToDropbox={backup.uploadedToDropbox} />,
    },
    { label: t("format"), value: summary.format || "-" },
    { label: t("rows"), value: formatLocaleNumber(summary.rowCount, currentLocale) },
    { label: t("tables"), value: formatLocaleNumber(summary.tableCount, currentLocale) },
    { label: t("sequences"), value: formatLocaleNumber(summary.sequenceCount, currentLocale) },
    { label: t("generated_at"), value: summary.generatedAt ? formatDateTime(summary.generatedAt, currentLocale) : "-" },
    { label: t("checksum"), value: backup.checksumSha256 || "-" },
    { label: t("notes"), value: summary.notes || "-" },
    { label: t("failure"), value: backup.failureReason || "-" },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("desc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={`${item.label}-${index}`} className="space-y-3">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <span className="text-sm font-medium text-muted-foreground">{item.label}</span>
                <div className="text-sm sm:max-w-[60%] sm:text-right">{item.value}</div>
              </div>
              {index < items.length - 1 ? <Separator /> : null}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
