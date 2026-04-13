import type { Locale } from "@/lib/i18n"
import { CompanyMap, getCompanyNameById } from "@/lib/company-display"
import { formatLocalizedDateTime } from "@/lib/i18n/date"
import { Totem } from "@/types/totem"
import {
  HomeAssistantSwitchEntity,
  SmartSwitchDestination,
  SmartSwitch,
  SmartSwitchPowerState,
} from "@/types/smart-switch"

export interface SmartSwitchEntityLabelMessages {
  friendlyNameFallback: string
}

export function truncateWithEllipsis(value: string, maxLength = 40) {
  const normalized = value.trim()

  if (normalized.length <= maxLength) {
    return normalized
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`
}

export function formatSmartSwitchDateTime(
  value?: string | null,
  locale: Locale = "pt-BR",
) {
  if (!value) {
    return "-"
  }

  return formatLocalizedDateTime(new Date(value), locale)
}

export function getSmartSwitchDisplayName(
  item: SmartSwitch,
  fallback: string,
) {
  return item.nome?.trim() || fallback
}

export function getPointDisplayName(
  point: SmartSwitchPointLike | null | undefined,
  fallback: string,
) {
  if (point?.nome) {
    return point.nome
  }

  if (point?.pontoDeReferencia) {
    return point.pontoDeReferencia
  }

  if (typeof point?.id === "number") {
    return `#${point.id}`
  }

  return fallback
}

export function getSmartSwitchDestination(item: SmartSwitch): SmartSwitchDestination {
  if (typeof item.pontoId === "number" && typeof item.totemId !== "number") {
    return "ponto"
  }

  return "totem"
}

export function getSmartSwitchTotemLabel(
  item: SmartSwitch,
  totemsById: Map<number, Totem>,
  fallback: string,
) {
  const totem =
    typeof item.totemId === "number" ? totemsById.get(item.totemId) || item.totem : item.totem

  if (totem?.numero) {
    return totem.numero
  }

  if (typeof item.totemId === "number") {
    return `#${item.totemId}`
  }

  return fallback
}

export function getSmartSwitchPointLabel(
  item: SmartSwitch,
  totemsById: Map<number, Totem>,
  fallback: string,
) {
  if (typeof item.pontoId === "number" || item.ponto) {
    return getPointDisplayName(item.ponto, fallback)
  }

  const totem =
    typeof item.totemId === "number" ? totemsById.get(item.totemId) || item.totem : item.totem

  if (totem?.ponto?.nome) {
    return totem.ponto.nome
  }

  if (totem?.ponto?.pontoDeReferencia) {
    return totem.ponto.pontoDeReferencia
  }

  if (typeof totem?.pontoId === "number") {
    return `#${totem.pontoId}`
  }

  return fallback
}

export function getSmartSwitchLocationPrimaryLabel(
  item: SmartSwitch,
  totemsById: Map<number, Totem>,
  fallback: string,
) {
  if (getSmartSwitchDestination(item) === "ponto") {
    return getSmartSwitchPointLabel(item, totemsById, fallback)
  }

  return getSmartSwitchTotemLabel(item, totemsById, fallback)
}

export function getSmartSwitchCompanyName(
  item: SmartSwitch,
  companiesById: CompanyMap,
  fallback: string,
) {
  return getCompanyNameById(
    item.empresaId ??
      item.ponto?.empresaId ??
      item.totem?.empresaId ??
      item.totem?.ponto?.empresaId,
    companiesById,
    fallback,
  )
}

export function normalizePowerState(on?: boolean | null): SmartSwitchPowerState {
  if (on === true) return "on"
  if (on === false) return "off"
  return "unknown"
}

export function buildHomeAssistantEntityLabel(
  entity: HomeAssistantSwitchEntity,
  messages: SmartSwitchEntityLabelMessages,
) {
  const friendlyName = entity.friendlyName?.trim()

  if (friendlyName) {
    return `${friendlyName} (${entity.entityId})`
  }

  return `${messages.friendlyNameFallback} (${entity.entityId})`
}
interface SmartSwitchPointLike {
  id?: number | null
  nome?: string | null
  pontoDeReferencia?: string | null
}
