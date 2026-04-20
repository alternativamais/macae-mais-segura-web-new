"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { DataTag } from "@/components/shared/data-tag"
import { useTranslator } from "@/lib/i18n"
import { DashboardWidget } from "@/types/dashboard-widget"
import { Camera } from "@/types/camera"

interface DashboardWidgetDetailsDialogProps {
  widget: DashboardWidget | null
  cameras: Camera[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DashboardWidgetDetailsDialog({
  widget,
  cameras,
  open,
  onOpenChange,
}: DashboardWidgetDetailsDialogProps) {
  const t = useTranslator("dashboard_management.details")

  if (!widget) return null

  const selectedCameraIds = widget.config?.cameraIds ?? []
  const selectedCameraNames =
    selectedCameraIds.length > 0
      ? cameras
          .filter((camera) => selectedCameraIds.includes(camera.id))
          .map((camera) => camera.nome || `Câmera ${camera.id}`)
      : [t("all_company_cameras")]

  const items = [
    {
      label: t("labels.company"),
      value: widget.empresa?.nome || "-",
    },
    {
      label: t("labels.type"),
      value: t("type_lpr_vehicle_count"),
    },
    {
      label: t("labels.layout"),
      value: widget.size === "full" ? t("sizes.full") : t("sizes.half"),
    },
    {
      label: t("labels.position"),
      value: String(widget.position),
    },
    {
      label: t("labels.period"),
      value: t(`periods.${widget.config?.period || "7d"}`),
    },
    {
      label: t("labels.granularity"),
      value: t(`granularities.${widget.config?.granularity || "day"}`),
    },
    {
      label: t("labels.chart_type"),
      value: t(`chart_types.${widget.config?.chartType || "bar"}`),
    },
    {
      label: t("labels.show_total"),
      value: (
        <DataTag tone={(widget.config?.showTotal ?? true) ? "success" : "neutral"}>
          {(widget.config?.showTotal ?? true) ? t("status.enabled") : t("status.disabled")}
        </DataTag>
      ),
    },
    {
      label: t("labels.status"),
      value: (
        <div className="flex flex-wrap justify-start gap-2 sm:justify-end">
          <DataTag tone={widget.enabled ? "success" : "neutral"}>
            {widget.enabled ? t("status.enabled") : t("status.disabled")}
          </DataTag>
          <DataTag tone="info">{t("type_lpr_vehicle_count")}</DataTag>
        </div>
      ),
    },
    {
      label: t("labels.cameras"),
      value: (
        <div className="flex flex-wrap justify-start gap-2 sm:justify-end">
          {selectedCameraNames.map((cameraName) => (
            <DataTag key={cameraName} tone="neutral">
              {cameraName}
            </DataTag>
          ))}
        </div>
      ),
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("title", { name: widget.title })}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
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
