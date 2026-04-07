"use client"

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
import { CallCenterExtension } from "@/types/call-center-extension"
import { ExtensionStatusBadge, ExtensionTypeBadge } from "./status-badges"
import { getExtensionTotemLabel } from "./utils"

interface ExtensionDetailsDialogProps {
  extension: CallCenterExtension | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExtensionDetailsDialog({
  extension,
  open,
  onOpenChange,
}: ExtensionDetailsDialogProps) {
  const t = useTranslator("call_center_extensions.details")
  const locale = t.getLocale()
  const notInformed = t("not_informed")

  if (!extension) return null

  const items = [
    { label: t("labels.number"), value: extension.numeroRamal || notInformed },
    { label: t("labels.description"), value: extension.descricao || notInformed },
    { label: t("labels.queue"), value: extension.queueName || notInformed },
    { label: t("labels.type"), value: <ExtensionTypeBadge type={extension.type} /> },
    { label: t("labels.status"), value: <ExtensionStatusBadge status={extension.status} /> },
    {
      label: t("labels.totem"),
      value: getExtensionTotemLabel(extension, notInformed),
    },
    {
      label: t("labels.updated_at"),
      value: extension.updatedAt
        ? formatLocalizedDateTime(parseISO(extension.updatedAt), locale)
        : notInformed,
    },
    {
      label: t("labels.created_at"),
      value: extension.createdAt
        ? formatLocalizedDateTime(parseISO(extension.createdAt), locale)
        : notInformed,
    },
    { label: t("labels.id"), value: `#${extension.id}` },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description", { number: extension.numeroRamal || notInformed })}
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
