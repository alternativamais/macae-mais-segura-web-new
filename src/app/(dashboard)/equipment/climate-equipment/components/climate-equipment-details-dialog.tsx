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
import { ClimateEquipment } from "@/types/climate-equipment"
import {
  ClimateEquipmentStatusBadge,
  ClimateSensorAvailabilityBadge,
} from "./status-badges"
import {
  formatClimateDateTime,
  getClimateEquipmentDisplayName,
  getClimateLocationPrimaryLabel,
  getClimateLocationSecondaryLabel,
} from "./utils"

interface ClimateEquipmentDetailsDialogProps {
  item: ClimateEquipment | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ClimateEquipmentDetailsDialog({
  item,
  open,
  onOpenChange,
}: ClimateEquipmentDetailsDialogProps) {
  const t = useTranslator("climate_equipment.details")
  const locale = t.getLocale()
  const notInformed = t("not_informed")

  if (!item) return null

  const locationLabels = {
    point: t("location.point"),
    totem: t("location.totem"),
    noReference: t("location.no_reference"),
    unassigned: t("location.unassigned"),
    fallback: notInformed,
  }

  const sensorSummary =
    item.sensors.length > 0 ? (
      <div className="flex flex-col gap-2 sm:items-end">
        {item.sensors.map((sensor) => (
          <div
            key={`${sensor.id}-${sensor.type}`}
            className="flex flex-wrap items-center gap-2 sm:justify-end"
          >
            <span className="text-sm">{sensor.label}</span>
            <ClimateSensorAvailabilityBadge available={sensor.isAvailable} />
          </div>
        ))}
      </div>
    ) : (
      notInformed
    )

  const items = [
    {
      label: t("labels.name"),
      value: getClimateEquipmentDisplayName(item, notInformed),
    },
    {
      label: t("labels.home_assistant_device_key"),
      value: <span className="font-mono">{item.homeAssistantDeviceKey || notInformed}</span>,
    },
    {
      label: t("labels.home_assistant_label"),
      value: item.homeAssistantLabel || notInformed,
    },
    {
      label: t("labels.installation"),
      value: getClimateLocationPrimaryLabel(item, locationLabels),
    },
    {
      label: t("labels.reference"),
      value: getClimateLocationSecondaryLabel(item, locationLabels),
    },
    {
      label: t("labels.status"),
      value: <ClimateEquipmentStatusBadge status={item.status} />,
    },
    {
      label: t("labels.last_synced_at"),
      value: formatClimateDateTime(item.lastSyncedAt, locale),
    },
    {
      label: t("labels.sensors"),
      value: sensorSummary,
    },
    {
      label: t("labels.description"),
      value: item.descricao || notInformed,
    },
    {
      label: t("labels.id"),
      value: `#${item.id}`,
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description", {
              name: getClimateEquipmentDisplayName(item, notInformed),
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {items.map((entry, index) => (
            <div key={`${entry.label}-${index}`} className="space-y-3">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  {entry.label}
                </span>
                <div className="text-sm sm:max-w-[60%] sm:text-right">{entry.value}</div>
              </div>
              {index < items.length - 1 ? <Separator /> : null}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
