"use client"

import { DataTag, resolveDataTagDefinition } from "@/components/shared/data-tag"
import { BackupRecord } from "@/types/backup"
import { getInitiatedByLabel, getStatusDescription } from "./utils"
import { useTranslator } from "@/lib/i18n"

export function BackupStatusBadge({ status }: { status: BackupRecord["status"] }) {
  const t = useTranslator("backup.utils")
  const backupStatusTagMap = {
    completed: { label: t("status_completed"), tone: "success" },
    failed: { label: t("status_failed"), tone: "danger" },
    running: { label: t("status_running"), tone: "warning" },
  } as const
  const tag = resolveDataTagDefinition(status, backupStatusTagMap, {
    label: getStatusDescription(t, status),
    tone: "neutral",
  })

  return <DataTag tone={tag.tone}>{tag.label}</DataTag>
}

export function BackupOriginBadge({ initiatedBy }: { initiatedBy?: string | null }) {
  const t = useTranslator("backup.utils")
  const backupOriginTagMap = {
    scheduled: { label: t("origin_scheduled"), tone: "accent" },
    manual: { label: t("origin_manual"), tone: "neutral" },
  } as const
  const tag = resolveDataTagDefinition(initiatedBy, backupOriginTagMap, {
    label: getInitiatedByLabel(t, initiatedBy),
    tone: "neutral",
  })

  return <DataTag tone={tag.tone}>{tag.label}</DataTag>
}

export function BackupStorageProviderBadge({
  storageProvider,
}: {
  storageProvider?: BackupRecord["storageProvider"]
}) {
  const t = useTranslator("backup.utils")
  const backupStorageProviderTagMap = {
    local: { label: t("badge_local"), tone: "neutral" },
    external: { label: t("badge_external"), tone: "info" },
  } as const
  const tag = resolveDataTagDefinition(storageProvider, backupStorageProviderTagMap, {
    label: storageProvider === "external" ? t("badge_external") : t("badge_local"),
    tone: storageProvider === "external" ? "info" : "neutral",
  })

  return <DataTag tone={tag.tone}>{tag.label}</DataTag>
}

export function BackupDropboxBadge({
  uploadedToDropbox,
}: {
  uploadedToDropbox?: boolean
}) {
  const t = useTranslator("backup.utils")
  const normalized = uploadedToDropbox ? "true" : "false"
  const backupDropboxTagMap = {
    true: { label: t("badge_dropbox_yes"), tone: "info" },
    false: { label: t("badge_dropbox_no"), tone: "warning" },
  } as const
  const tag = resolveDataTagDefinition(normalized, backupDropboxTagMap, {
    label: uploadedToDropbox ? t("badge_dropbox_yes") : t("badge_dropbox_no"),
    tone: uploadedToDropbox ? "info" : "warning",
  })

  return <DataTag tone={tag.tone}>{tag.label}</DataTag>
}
