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
import { Camera } from "@/types/camera"
import { CameraStatusBadge } from "./status-badges"
import { formatCameraDateTime, getCameraLocationLabel, getRtspUrl } from "./utils"

interface CameraDetailsDialogProps {
  camera: Camera | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CameraDetailsDialog({
  camera,
  open,
  onOpenChange,
}: CameraDetailsDialogProps) {
  const t = useTranslator("cameras.details")
  const locale = t.getLocale()
  const notInformed = t("not_informed")

  if (!camera) return null

  const items = [
    { label: t("labels.name"), value: camera.nome || notInformed },
    { label: t("labels.brand"), value: camera.marca || notInformed },
    { label: t("labels.status"), value: <CameraStatusBadge status={camera.status} /> },
    {
      label: t("labels.ip"),
      value: <span className="font-mono">{camera.ip || notInformed}</span>,
    },
    { label: t("labels.user"), value: camera.usuario || notInformed },
    {
      label: t("labels.location"),
      value: getCameraLocationLabel(camera, {
        point: t("location.point"),
        totem: t("location.totem"),
        fallback: notInformed,
      }),
    },
    { label: t("labels.scheme"), value: camera.rtspScheme || "rtsp" },
    { label: t("labels.port"), value: camera.rtspPort ? String(camera.rtspPort) : notInformed },
    { label: t("labels.path"), value: camera.rtspPath || t("no_path") },
    {
      label: t("labels.stream_url"),
      value: <span className="break-all font-mono text-xs">{getRtspUrl(camera)}</span>,
    },
    {
      label: t("labels.created_at"),
      value: formatCameraDateTime(camera.createdAt, locale),
    },
    {
      label: t("labels.updated_at"),
      value: formatCameraDateTime(camera.updatedAt, locale),
    },
    { label: t("labels.id"), value: `#${camera.id}` },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description", { name: camera.nome || notInformed })}
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
