import type { Locale } from "@/lib/i18n"
import { CompanyMap, getCompanyNameById } from "@/lib/company-display"
import { formatLocalizedDateTime } from "@/lib/i18n/date"
import { Totem, TotemCallCenterExtension } from "@/types/totem"

interface ExtensionLabelMessages {
  inactiveSuffix: string
  assignedSuffix: string
}

export function getTotemIntegratedEquipmentCount(totem: Totem) {
  return (
    (totem.cameras?.length || 0) +
    (totem.smartSwitches?.length || 0) +
    (totem.climateEquipments?.length || 0)
  )
}

export function getTotemPointLabel(totem: Totem, fallback: string) {
  if (totem.ponto?.nome) {
    return totem.ponto.nome
  }

  if (typeof totem.pontoId === "number") {
    return `#${totem.pontoId}`
  }

  return fallback
}

export function getTotemPointReference(totem: Totem, fallback: string) {
  return totem.ponto?.pontoDeReferencia || fallback
}

export function getTotemExtensionLabel(totem: Totem, fallback: string) {
  if (totem.callCenterExtension?.numeroRamal) {
    return totem.callCenterExtension.numeroRamal
  }

  if (totem.numeroRamal) {
    return totem.numeroRamal
  }

  return fallback
}

export function getTotemCompanyName(
  totem: Totem,
  companiesById: CompanyMap,
  fallback: string,
) {
  return getCompanyNameById(
    totem.empresaId ?? totem.ponto?.empresaId,
    companiesById,
    fallback,
  )
}

export function buildCallCenterExtensionLabel(
  extension: TotemCallCenterExtension,
  messages: ExtensionLabelMessages,
) {
  const occupied = Boolean(extension.assignedTotemId)
  const inactive = extension.status !== "active"

  return [
    extension.numeroRamal,
    extension.descricao || null,
    extension.queueName || null,
    inactive ? messages.inactiveSuffix : null,
    occupied && extension.assignedTotemNumero
      ? messages.assignedSuffix.replace("{numero}", extension.assignedTotemNumero)
      : null,
  ]
    .filter(Boolean)
    .join(" - ")
}

export function isCallCenterExtensionDisabled(
  extension: TotemCallCenterExtension,
  currentTotemId?: number,
) {
  const occupiedByAnotherTotem =
    typeof extension.assignedTotemId === "number" &&
    extension.assignedTotemId !== currentTotemId

  return extension.status !== "active" || occupiedByAnotherTotem
}

export function formatTotemDateTime(
  value?: string | null,
  locale: Locale = "pt-BR",
) {
  if (!value) {
    return "-"
  }

  return formatLocalizedDateTime(new Date(value), locale)
}
