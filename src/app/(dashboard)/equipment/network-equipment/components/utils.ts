import type { Locale } from "@/lib/i18n"
import { formatLocalizedDateTime } from "@/lib/i18n/date"
import {
  NetworkEquipment,
  NetworkEquipmentDestination,
  NetworkEquipmentType,
} from "@/types/network-equipment"
import { Ponto } from "@/types/ponto"
import { Totem } from "@/types/totem"

export interface NetworkEquipmentTypeLabels {
  router: string
  onu: string
  radio: string
  switch: string
  unknown: string
}

export interface NetworkEquipmentLocationLabels {
  point: string
  totem: string
  noReference: string
  fallback: string
}

export interface NetworkEquipmentFormValuesLike {
  nome: string
  ip: string
  status: "active" | "inactive"
  online: boolean
  destino: NetworkEquipmentDestination
  pontoId: string
  totemId: string
  tipoEquipamento: NetworkEquipmentType
  macAddress?: string
  usuarioGerencia?: string
  senhaGerencia?: string
  numeroPortas?: string
  ssid?: string
  senhaWifi?: string
  modoOnu?: string
  pppoeUser?: string
  pppoePass?: string
  modoRadio?: string
  frequencia?: string
  gerenciavel?: boolean
  vlans?: string
}

export function formatNetworkEquipmentDateTime(
  value?: string | null,
  locale: Locale = "pt-BR",
) {
  if (!value) {
    return "-"
  }

  return formatLocalizedDateTime(new Date(value), locale)
}

export function getPointLabel(point: Ponto | null | undefined, fallback: string) {
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

export function getPointReference(point: Ponto | null | undefined, fallback: string) {
  return point?.pontoDeReferencia?.trim() || fallback
}

export function getTotemLabel(totem: Totem | null | undefined, fallback: string) {
  if (totem?.numero) {
    return totem.numero
  }

  if (typeof totem?.id === "number") {
    return `#${totem.id}`
  }

  return fallback
}

export function getNetworkEquipmentDestination(
  item: NetworkEquipment,
): NetworkEquipmentDestination {
  if (typeof item.totemId === "number") {
    return "totem"
  }

  return "ponto"
}

export function getNetworkEquipmentLocationPrimaryLabel(
  item: NetworkEquipment,
  labels: NetworkEquipmentLocationLabels,
) {
  if (typeof item.totemId === "number" || item.totem) {
    return `${labels.totem}: ${getTotemLabel(item.totem, labels.fallback)}`
  }

  if (typeof item.pontoId === "number" || item.ponto) {
    return `${labels.point}: ${getPointLabel(item.ponto, labels.fallback)}`
  }

  return labels.fallback
}

export function getNetworkEquipmentLocationSecondaryLabel(
  item: NetworkEquipment,
  labels: NetworkEquipmentLocationLabels,
) {
  if (typeof item.totemId === "number" || item.totem) {
    return item.totem?.ponto
      ? getPointReference(item.totem.ponto as Ponto, labels.noReference)
      : labels.noReference
  }

  if (typeof item.pontoId === "number" || item.ponto) {
    return getPointReference(item.ponto, labels.noReference)
  }

  return labels.noReference
}

export function getNetworkEquipmentTypeLabel(
  type: string | null | undefined,
  labels: NetworkEquipmentTypeLabels,
) {
  switch ((type || "").toLowerCase()) {
    case "roteador":
      return labels.router
    case "onu":
      return labels.onu
    case "radio":
      return labels.radio
    case "switch":
      return labels.switch
    default:
      return labels.unknown
  }
}

export function buildPointOptionLabel(point: Ponto, fallback: string) {
  const reference = getPointReference(point, "")
  return [getPointLabel(point, fallback), reference].filter(Boolean).join(" - ")
}

export function buildTotemOptionLabel(totem: Totem, fallback: string) {
  const pointLabel = getPointLabel(totem.ponto as Ponto | undefined, fallback)
  return [getTotemLabel(totem, fallback), pointLabel].filter(Boolean).join(" - ")
}

function normalizeOptionalString(value?: string | null) {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

function normalizeOptionalNumber(value?: string | null) {
  const normalized = value?.trim()
  if (!normalized) {
    return null
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

export function maskSecret(value?: string | null, fallback = "-") {
  const normalized = value?.trim()
  if (!normalized) {
    return fallback
  }

  if (normalized.length <= 4) {
    return "•".repeat(normalized.length)
  }

  return `${"•".repeat(Math.max(4, normalized.length - 2))}${normalized.slice(-2)}`
}

export function buildNetworkEquipmentPayload(values: NetworkEquipmentFormValuesLike) {
  const tipoEquipamento = values.tipoEquipamento
  const destination = values.destino

  const payload = {
    nome: values.nome.trim(),
    ip: values.ip.trim(),
    status: values.status,
    online: values.online,
    tipoEquipamento,
    pontoId:
      destination === "ponto" ? normalizeOptionalNumber(values.pontoId) : null,
    totemId:
      destination === "totem" ? normalizeOptionalNumber(values.totemId) : null,
    macAddress: normalizeOptionalString(values.macAddress),
    usuarioGerencia: normalizeOptionalString(values.usuarioGerencia),
    senhaGerencia: normalizeOptionalString(values.senhaGerencia),
    numeroPortas:
      tipoEquipamento === "roteador" ||
      tipoEquipamento === "onu" ||
      tipoEquipamento === "switch"
        ? normalizeOptionalNumber(values.numeroPortas)
        : null,
    ssid:
      tipoEquipamento === "roteador" || tipoEquipamento === "radio"
        ? normalizeOptionalString(values.ssid)
        : null,
    senhaWifi:
      tipoEquipamento === "roteador" || tipoEquipamento === "radio"
        ? normalizeOptionalString(values.senhaWifi)
        : null,
    modoOnu:
      tipoEquipamento === "onu" ? normalizeOptionalString(values.modoOnu) : null,
    pppoeUser:
      tipoEquipamento === "onu" && values.modoOnu === "roteada"
        ? normalizeOptionalString(values.pppoeUser)
        : null,
    pppoePass:
      tipoEquipamento === "onu" && values.modoOnu === "roteada"
        ? normalizeOptionalString(values.pppoePass)
        : null,
    modoRadio:
      tipoEquipamento === "radio"
        ? normalizeOptionalString(values.modoRadio)
        : null,
    frequencia:
      tipoEquipamento === "radio"
        ? normalizeOptionalString(values.frequencia)
        : null,
    gerenciavel: tipoEquipamento === "switch" ? !!values.gerenciavel : false,
    vlans:
      tipoEquipamento === "switch" && values.gerenciavel
        ? normalizeOptionalString(values.vlans)
        : null,
  }

  return payload
}
