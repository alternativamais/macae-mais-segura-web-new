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
import { Totem } from "@/types/totem"
import { TotemStatusBadge } from "./status-badges"
import {
  formatTotemDateTime,
  getTotemCompanyName,
  getTotemExtensionLabel,
  getTotemIntegratedEquipmentCount,
  getTotemPointLabel,
  getTotemPointReference,
} from "./utils"

interface TotemDetailsDialogProps {
  totem: Totem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TotemDetailsDialog({
  totem,
  open,
  onOpenChange,
}: TotemDetailsDialogProps) {
  const t = useTranslator("totens.details")
  const { isAllCompanies, companiesById } = useCompanyVisibility()
  const locale = t.getLocale()
  const notInformed = t("not_informed")

  if (!totem) return null

  const items = [
    { label: t("labels.number"), value: totem.numero || notInformed },
    {
      label: t("labels.point"),
      value: getTotemPointLabel(totem, notInformed),
    },
    {
      label: t("labels.reference"),
      value: getTotemPointReference(totem, notInformed),
    },
    {
      label: t("labels.extension"),
      value: getTotemExtensionLabel(totem, t("unassigned_extension")),
    },
    {
      label: t("labels.queue"),
      value: totem.callCenterExtension?.queueName || notInformed,
    },
    {
      label: t("labels.cameras"),
      value: String(totem.cameras?.length || 0),
    },
    {
      label: t("labels.smart_switches"),
      value: String(totem.smartSwitches?.length || 0),
    },
    {
      label: t("labels.climate_equipments"),
      value: String(totem.climateEquipments?.length || 0),
    },
    {
      label: t("labels.total_integrations"),
      value: String(getTotemIntegratedEquipmentCount(totem)),
    },
    {
      label: t("labels.status"),
      value: <TotemStatusBadge status={totem.status} />,
    },
    {
      label: t("labels.created_at"),
      value: formatTotemDateTime(totem.createdAt, locale),
    },
    {
      label: t("labels.updated_at"),
      value: formatTotemDateTime(totem.updatedAt, locale),
    },
    {
      label: t("labels.id"),
      value: `#${totem.id}`,
    },
  ]

  if (isAllCompanies) {
    items.splice(3, 0, {
      label: t("labels.company"),
      value: getTotemCompanyName(totem, companiesById, notInformed),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description", { number: totem.numero || notInformed })}
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
