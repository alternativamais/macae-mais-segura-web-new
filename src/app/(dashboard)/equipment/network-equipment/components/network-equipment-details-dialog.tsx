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
import { NetworkEquipment } from "@/types/network-equipment"
import {
  NetworkEquipmentOnlineBadge,
  NetworkEquipmentStatusBadge,
  NetworkEquipmentTypeBadge,
} from "./status-badges"
import {
  formatNetworkEquipmentDateTime,
  getNetworkEquipmentLocationPrimaryLabel,
  getNetworkEquipmentLocationSecondaryLabel,
  maskSecret,
} from "./utils"

interface NetworkEquipmentDetailsDialogProps {
  item: NetworkEquipment | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NetworkEquipmentDetailsDialog({
  item,
  open,
  onOpenChange,
}: NetworkEquipmentDetailsDialogProps) {
  const t = useTranslator("network_equipment.details")
  const locale = t.getLocale()
  const notInformed = t("not_informed")

  if (!item) return null

  const locationLabels = {
    point: t("location.point"),
    totem: t("location.totem"),
    noReference: t("location.no_reference"),
    fallback: notInformed,
  }

  const items = [
    { label: t("labels.name"), value: item.nome || notInformed },
    {
      label: t("labels.type"),
      value: <NetworkEquipmentTypeBadge type={item.tipoEquipamento} />,
    },
    {
      label: t("labels.location"),
      value: getNetworkEquipmentLocationPrimaryLabel(item, locationLabels),
    },
    {
      label: t("labels.location_reference"),
      value: getNetworkEquipmentLocationSecondaryLabel(item, locationLabels),
    },
    {
      label: t("labels.ip"),
      value: <span className="font-mono">{item.ip || notInformed}</span>,
    },
    {
      label: t("labels.mac"),
      value: <span className="font-mono">{item.macAddress || notInformed}</span>,
    },
    { label: t("labels.management_user"), value: item.usuarioGerencia || notInformed },
    {
      label: t("labels.management_password"),
      value: maskSecret(item.senhaGerencia, notInformed),
    },
    {
      label: t("labels.status"),
      value: <NetworkEquipmentStatusBadge status={item.status} />,
    },
    {
      label: t("labels.online"),
      value: <NetworkEquipmentOnlineBadge online={item.online} />,
    },
    {
      label: t("labels.ports"),
      value:
        typeof item.numeroPortas === "number" ? String(item.numeroPortas) : notInformed,
    },
    { label: t("labels.ssid"), value: item.ssid || notInformed },
    { label: t("labels.wifi_password"), value: maskSecret(item.senhaWifi, notInformed) },
    { label: t("labels.onu_mode"), value: item.modoOnu || notInformed },
    { label: t("labels.pppoe_user"), value: item.pppoeUser || notInformed },
    { label: t("labels.pppoe_password"), value: maskSecret(item.pppoePass, notInformed) },
    { label: t("labels.radio_mode"), value: item.modoRadio || notInformed },
    { label: t("labels.frequency"), value: item.frequencia || notInformed },
    {
      label: t("labels.managed"),
      value: item.gerenciavel ? t("values.yes") : t("values.no"),
    },
    { label: t("labels.vlans"), value: item.vlans || notInformed },
    {
      label: t("labels.created_at"),
      value: formatNetworkEquipmentDateTime(item.createdAt, locale),
    },
    {
      label: t("labels.updated_at"),
      value: formatNetworkEquipmentDateTime(item.updatedAt, locale),
    },
    { label: t("labels.id"), value: `#${item.id}` },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description", { name: item.nome || notInformed })}
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
