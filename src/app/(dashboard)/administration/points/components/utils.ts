import { formatLocalizedDateTime } from "@/lib/i18n/date"
import { Locale } from "@/lib/i18n"
import { CompanyMap, getCompanyNameById } from "@/lib/company-display"
import { Ponto } from "@/types/ponto"

export interface PointCoordinates {
  lat: number
  lng: number
}

export function getPointEquipmentCount(point: Ponto) {
  return (point.cameras?.length || 0) + (point.totens?.length || 0)
}

export function getPointCompanyName(
  point: Ponto,
  companiesById: CompanyMap,
  fallback: string,
) {
  if (point.empresa?.nome) {
    return point.empresa.nome
  }

  return getCompanyNameById(point.empresaId, companiesById, fallback)
}

export function formatPointDateTime(value: string | undefined, locale: Locale) {
  if (!value) {
    return "-"
  }

  return formatLocalizedDateTime(new Date(value), locale)
}

export function parsePointCoordinates(
  value?: string | null,
): PointCoordinates | null {
  if (!value) {
    return null
  }

  const [rawLat, rawLng] = value.split(",")

  if (!rawLat || !rawLng) {
    return null
  }

  const lat = Number.parseFloat(rawLat.trim().replace(",", "."))
  const lng = Number.parseFloat(rawLng.trim().replace(",", "."))

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null
  }

  return { lat, lng }
}

export function formatPointCoordinates(
  coordinates: PointCoordinates,
  precision = 6,
) {
  return `${coordinates.lat.toFixed(precision)},${coordinates.lng.toFixed(precision)}`
}
