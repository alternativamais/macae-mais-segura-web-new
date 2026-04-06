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
import { SmartSwitch, SmartSwitchPowerState } from "@/types/smart-switch"
import { Totem } from "@/types/totem"
import { SmartSwitchPowerBadge, SmartSwitchStatusBadge } from "./status-badges"
import {
  formatSmartSwitchDateTime,
  getSmartSwitchDestination,
  getSmartSwitchDisplayName,
  getSmartSwitchLocationPrimaryLabel,
  getSmartSwitchPointLabel,
  getSmartSwitchTotemLabel,
} from "./utils"

interface SmartSwitchDetailsDialogProps {
  item: SmartSwitch | null
  powerState: SmartSwitchPowerState
  totemsById: Map<number, Totem>
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SmartSwitchDetailsDialog({
  item,
  powerState,
  totemsById,
  open,
  onOpenChange,
}: SmartSwitchDetailsDialogProps) {
  const t = useTranslator("smart_switches.details")
  const locale = t.getLocale()
  const notInformed = t("not_informed")

  if (!item) return null

  const items = [
    {
      label: t("labels.name"),
      value: getSmartSwitchDisplayName(item, notInformed),
    },
    {
      label: t("labels.entity_id"),
      value: <span className="break-all font-mono text-xs">{item.homeAssistantEntityId}</span>,
    },
    {
      label: t("labels.installation_type"),
      value:
        getSmartSwitchDestination(item) === "ponto"
          ? t("values.install_in_point")
          : t("values.install_in_totem"),
    },
    {
      label: t("labels.installation"),
      value: getSmartSwitchLocationPrimaryLabel(item, totemsById, notInformed),
    },
    {
      label: t("labels.totem"),
      value:
        getSmartSwitchDestination(item) === "ponto"
          ? notInformed
          : getSmartSwitchTotemLabel(item, totemsById, notInformed),
    },
    {
      label: t("labels.point"),
      value: getSmartSwitchPointLabel(item, totemsById, notInformed),
    },
    {
      label: t("labels.status"),
      value: <SmartSwitchStatusBadge status={item.status} />,
    },
    {
      label: t("labels.power_state"),
      value: <SmartSwitchPowerBadge state={powerState} />,
    },
    {
      label: t("labels.created_at"),
      value: formatSmartSwitchDateTime(item.createdAt, locale),
    },
    {
      label: t("labels.updated_at"),
      value: formatSmartSwitchDateTime(item.updatedAt, locale),
    },
    {
      label: t("labels.id"),
      value: `#${item.id}`,
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description", {
              name: getSmartSwitchDisplayName(item, notInformed),
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
