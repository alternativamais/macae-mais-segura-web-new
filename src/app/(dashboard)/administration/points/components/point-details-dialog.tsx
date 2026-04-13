"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { useCompanyVisibility } from "@/hooks/use-company-visibility"
import { useTranslator } from "@/lib/i18n"
import { Ponto } from "@/types/ponto"
import { PointStatusBadge } from "./status-badges"
import {
  formatPointDateTime,
  getPointCompanyName,
  getPointEquipmentCount,
} from "./utils"

interface PointDetailsDialogProps {
  point: Ponto | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PointDetailsDialog({
  point,
  open,
  onOpenChange,
}: PointDetailsDialogProps) {
  const t = useTranslator("points.details")
  const { isAllCompanies, companiesById } = useCompanyVisibility()
  const locale = t.getLocale()
  const notInformed = t("not_informed")

  if (!point) return null

  const camerasCount = point.cameras?.length || 0
  const totemsCount = point.totens?.length || 0

  const items = [
    { label: t("labels.name"), value: point.nome || notInformed },
    {
      label: t("labels.reference"),
      value: point.pontoDeReferencia || notInformed,
    },
    {
      label: t("labels.coordinates"),
      value: point.coordenadas || notInformed,
    },
    {
      label: t("labels.cameras"),
      value: String(camerasCount),
    },
    {
      label: t("labels.totems"),
      value: String(totemsCount),
    },
    {
      label: t("labels.total_equipment"),
      value: String(getPointEquipmentCount(point)),
    },
    {
      label: t("labels.status"),
      value: <PointStatusBadge status={point.status} />,
    },
    {
      label: t("labels.created_at"),
      value: formatPointDateTime(point.createdAt, locale),
    },
    {
      label: t("labels.updated_at"),
      value: formatPointDateTime(point.updatedAt, locale),
    },
    { label: t("labels.id"), value: `#${point.id}` },
  ]

  if (isAllCompanies) {
    items.splice(3, 0, {
      label: t("labels.company"),
      value: getPointCompanyName(point, companiesById, t("system_default")),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description", { name: point.nome || notInformed })}
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
