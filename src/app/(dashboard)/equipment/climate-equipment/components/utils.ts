import type { Locale } from "@/lib/i18n"
import { CompanyMap, getCompanyNameById } from "@/lib/company-display"
import { formatLocalizedDateTime } from "@/lib/i18n/date"
import {
  ClimateDashboardRange,
  ClimateEquipment,
  ClimateEquipmentDestination,
  ClimateSensorType,
} from "@/types/climate-equipment"
import { Ponto } from "@/types/ponto"
import { Totem } from "@/types/totem"

export interface ClimateLocationLabels {
  point: string
  totem: string
  noReference: string
  unassigned: string
  fallback: string
}

export interface ClimateSensorTypeLabels {
  temperature: string
  probe_temperature: string
  humidity: string
  outdoor_humidity: string
  air_pressure: string
  wind_speed: string
  precipitation_intensity: string
  total_precipitation_today: string
  uv_index: string
  sound_pressure: string
  unknown: string
}

export interface ClimateEquipmentFormValuesLike {
  nome: string
  empresaId?: string
  homeAssistantDeviceKey: string
  homeAssistantLabel?: string
  descricao?: string
  destino: ClimateEquipmentDestination
  pontoId?: string
  totemId?: string
  status: "active" | "inactive"
}

export function formatClimateDateTime(
  value?: string | Date | null,
  locale: Locale = "pt-BR",
) {
  if (!value) {
    return "-"
  }

  return formatLocalizedDateTime(
    value instanceof Date ? value : new Date(value),
    locale,
  )
}

export function getClimatePointLabel(
  point: Ponto | null | undefined,
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

export function getClimatePointReference(
  point: Ponto | null | undefined,
  fallback: string,
) {
  return point?.pontoDeReferencia?.trim() || fallback
}

export function getClimateTotemLabel(
  totem: Totem | null | undefined,
  fallback: string,
) {
  if (totem?.numero) {
    return totem.numero
  }

  if (typeof totem?.id === "number") {
    return `#${totem.id}`
  }

  return fallback
}

export function getClimateEquipmentDisplayName(
  item: Pick<ClimateEquipment, "nome" | "homeAssistantLabel" | "homeAssistantDeviceKey">,
  fallback: string,
) {
  return (
    item.nome?.trim() ||
    item.homeAssistantLabel?.trim() ||
    item.homeAssistantDeviceKey?.trim() ||
    fallback
  )
}

export function getClimateEquipmentDestination(
  item: ClimateEquipment,
): ClimateEquipmentDestination {
  if (typeof item.totem?.id === "number") {
    return "totem"
  }

  return "ponto"
}

export function getClimateLocationPrimaryLabel(
  item: ClimateEquipment,
  labels: ClimateLocationLabels,
) {
  if (item.totem) {
    return `${labels.totem}: ${getClimateTotemLabel(item.totem, labels.fallback)}`
  }

  if (item.ponto || typeof item.pontoId === "number") {
    return `${labels.point}: ${getClimatePointLabel(item.ponto, labels.fallback)}`
  }

  return labels.unassigned
}

export function getClimateLocationSecondaryLabel(
  item: ClimateEquipment,
  labels: ClimateLocationLabels,
) {
  if (item.totem?.ponto) {
    return getClimatePointReference(item.totem.ponto as Ponto, labels.noReference)
  }

  if (item.ponto) {
    return getClimatePointReference(item.ponto, labels.noReference)
  }

  return labels.noReference
}

export function getClimateEquipmentCompanyName(
  item: ClimateEquipment,
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

export function buildClimatePointOptionLabel(point: Ponto, fallback: string) {
  return [getClimatePointLabel(point, fallback), getClimatePointReference(point, "")]
    .filter(Boolean)
    .join(" - ")
}

export function buildClimateTotemOptionLabel(totem: Totem, fallback: string) {
  const pointLabel = getClimatePointLabel(totem.ponto as Ponto | undefined, fallback)
  return [getClimateTotemLabel(totem, fallback), pointLabel].filter(Boolean).join(" - ")
}

function normalizeOptionalString(value?: string | null) {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

function normalizeOptionalNumber(value?: string | null) {
  const normalized = value?.trim()
  if (!normalized) {
    return null
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

export function buildClimateEquipmentPayload(values: ClimateEquipmentFormValuesLike) {
  const destination = values.destino

  return {
    nome: values.nome.trim(),
    empresaId: normalizeOptionalNumber(values.empresaId) ?? undefined,
    homeAssistantDeviceKey: values.homeAssistantDeviceKey.trim(),
    homeAssistantLabel: normalizeOptionalString(values.homeAssistantLabel),
    descricao: normalizeOptionalString(values.descricao),
    status: values.status,
    totemId:
      destination === "totem" ? normalizeOptionalNumber(values.totemId) : null,
    pontoId:
      destination === "ponto" ? normalizeOptionalNumber(values.pontoId) : null,
  }
}

export function buildClimateDashboardParams(range: ClimateDashboardRange) {
  const now = new Date()
  const from = new Date(now)

  switch (range) {
    case "30m":
      from.setMinutes(from.getMinutes() - 30)
      break
    case "1h":
      from.setHours(from.getHours() - 1)
      break
    case "12h":
      from.setHours(from.getHours() - 12)
      break
    case "1d":
      from.setDate(from.getDate() - 1)
      break
    case "1s":
      from.setDate(from.getDate() - 7)
      break
    case "1m":
      from.setMonth(from.getMonth() - 1)
      break
    default:
      from.setMinutes(from.getMinutes() - 30)
      break
  }

  return {
    from: from.toISOString(),
    to: now.toISOString(),
  }
}

export function getClimateSensorTypeLabel(
  type: string | null | undefined,
  labels: ClimateSensorTypeLabels,
) {
  switch ((type || "") as ClimateSensorType) {
    case "temperature":
      return labels.temperature
    case "probe_temperature":
      return labels.probe_temperature
    case "humidity":
      return labels.humidity
    case "outdoor_humidity":
      return labels.outdoor_humidity
    case "air_pressure":
      return labels.air_pressure
    case "wind_speed":
      return labels.wind_speed
    case "precipitation_intensity":
      return labels.precipitation_intensity
    case "total_precipitation_today":
      return labels.total_precipitation_today
    case "uv_index":
      return labels.uv_index
    case "sound_pressure":
      return labels.sound_pressure
    default:
      return labels.unknown
  }
}

export function getClimateSensorColor(type?: string | null) {
  return "var(--primary)"
}
