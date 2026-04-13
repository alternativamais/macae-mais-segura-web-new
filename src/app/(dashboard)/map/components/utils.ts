"use client"

import { Camera } from "@/types/camera"
import { SmartSwitch } from "@/types/smart-switch"
import { Totem } from "@/types/totem"
import {
  MapCoordinates,
  MapPointCameraSummary,
  OfficerLocation,
  OperationalMapMarker,
  OperationalMapPoint,
} from "@/types/map"

const DEFAULT_CENTER = { lat: -22.376534, lng: -41.794399 }

export function getMapDefaultCenter() {
  return DEFAULT_CENTER
}

export function parseCoordinates(input?: string | MapCoordinates | null) {
  if (!input) return null

  if (typeof input === "object") {
    const lat = Number(input.lat)
    const lng = Number(input.lng)

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null
    }

    return { lat, lng } satisfies MapCoordinates
  }

  const raw = String(input).trim()
  if (!raw) return null

  const normalized = raw.replace(/\s+/g, "")
  const parts = normalized.split(",")

  if (parts.length === 2) {
    const lat = Number.parseFloat(parts[0].replace(",", "."))
    const lng = Number.parseFloat(parts[1].replace(",", "."))

    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng } satisfies MapCoordinates
    }
  }

  const matches = raw.match(/-?\d+(?:\.\d+)?/g)
  if (!matches || matches.length < 2) {
    return null
  }

  const lat = Number.parseFloat(matches[0])
  const lng = Number.parseFloat(matches[1])

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null
  }

  return { lat, lng } satisfies MapCoordinates
}

export function normalizePointMarkers(points: OperationalMapPoint[]) {
  return points
    .map((point) => {
      const position = parseCoordinates(point.coordenadas)

      if (!position) {
        return null
      }

      return {
        id: point.id,
        position,
        point,
      } satisfies OperationalMapMarker
    })
    .filter((item): item is OperationalMapMarker => item !== null)
}

export function parseOfficerLocation(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null
  }

  const source = payload as Record<string, unknown>
  const id = Number(source.userId ?? source.id ?? source.user_id)
  const lat = Number(
    source.lat ??
      source.latitude ??
      ((source.coords as Record<string, unknown> | undefined)?.lat as number | string | undefined) ??
      ((source.coords as Record<string, unknown> | undefined)?.latitude as number | string | undefined),
  )
  const lng = Number(
    source.lng ??
      source.longitude ??
      ((source.coords as Record<string, unknown> | undefined)?.lng as number | string | undefined) ??
      ((source.coords as Record<string, unknown> | undefined)?.longitude as number | string | undefined),
  )

  if (!Number.isFinite(id) || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null
  }

  const updatedAt =
    typeof source.updatedAt === "string" && source.updatedAt
      ? source.updatedAt
      : typeof source.timestamp === "string" && source.timestamp
        ? source.timestamp
        : new Date().toISOString()

  return {
    userId: id,
    position: { lat, lng },
    name:
      typeof source.name === "string" && source.name
        ? source.name
        : typeof source.usuario === "string" && source.usuario
          ? source.usuario
          : `Policial #${id}`,
    updatedAt,
    disponivel:
      typeof source.disponivel === "boolean"
        ? source.disponivel
        : typeof source.available === "boolean"
          ? source.available
          : null,
    avatarUrl:
      typeof source.avatarUrl === "string"
        ? source.avatarUrl
        : typeof source.avatar_url === "string"
          ? source.avatar_url
          : null,
    tipo: typeof source.tipo === "string" ? source.tipo : "policial",
  } satisfies OfficerLocation
}

export function buildMapSearchIndex(marker: OperationalMapMarker) {
  const values = [
    marker.point.nome,
    marker.point.pontoDeReferencia,
    marker.point.empresa?.nome,
    marker.point.totem?.numero,
    marker.point.id,
  ]

  return values
    .filter(Boolean)
    .map((value) => String(value).toLowerCase())
    .join(" ")
}

export function matchesMapSearch(marker: OperationalMapMarker, query: string) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true

  return buildMapSearchIndex(marker).includes(normalized)
}

export function getPointReference(point: OperationalMapPoint, fallback: string) {
  return point.pontoDeReferencia?.trim() || point.nome?.trim() || fallback
}

export function getPointCompanyName(point: OperationalMapPoint, fallback: string) {
  return point.empresa?.nome?.trim() || fallback
}

export function countPointCameras(point: OperationalMapPoint) {
  const totemCameras = point.totem?.devices?.cameras?.filter((camera) => camera?.status !== "inactive").length ?? 0
  const directCameras = point.devices?.cameras?.filter((camera) => camera?.status !== "inactive").length ?? 0

  return totemCameras + directCameras
}

export function countPointSmartSwitches(point: OperationalMapPoint) {
  return (point.totem?.devices?.smartSwitches ?? 0) + (point.devices?.smartSwitches ?? 0)
}

export function countPointClimateEquipments(point: OperationalMapPoint) {
  return (point.totem?.devices?.climateEquipments ?? 0) + (point.devices?.climateEquipments ?? 0)
}

export function countTotalPointAssets(point: OperationalMapPoint) {
  return (
    countPointCameras(point) +
    countPointSmartSwitches(point) +
    countPointClimateEquipments(point)
  )
}

export function buildOperationalMapSummary(markers: OperationalMapMarker[]) {
  const points = markers.map((marker) => marker.point)
  const totalPoints = points.length
  const activePoints = points.filter((point) => point.status !== "inactive").length
  const inactivePoints = totalPoints - activePoints
  const pointsWithTotem = points.filter((point) => Boolean(point.totem?.id)).length
  const pointsWithoutTotem = totalPoints - pointsWithTotem
  const totalCameras = points.reduce((sum, point) => sum + countPointCameras(point), 0)
  const totalSmartSwitches = points.reduce((sum, point) => sum + countPointSmartSwitches(point), 0)
  const totalClimateEquipments = points.reduce((sum, point) => sum + countPointClimateEquipments(point), 0)
  const totalAssets = totalCameras + totalSmartSwitches + totalClimateEquipments
  const busiestPoint = points.reduce<OperationalMapPoint | null>((current, point) => {
    if (!current) {
      return point
    }

    return countTotalPointAssets(point) > countTotalPointAssets(current) ? point : current
  }, null)

  return {
    totalPoints,
    activePoints,
    inactivePoints,
    pointsWithTotem,
    pointsWithoutTotem,
    totalCameras,
    totalSmartSwitches,
    totalClimateEquipments,
    totalAssets,
    averageAssetsPerPoint: totalPoints > 0 ? totalAssets / totalPoints : 0,
    totemCoverage: totalPoints > 0 ? (pointsWithTotem / totalPoints) * 100 : 0,
    activeCoverage: totalPoints > 0 ? (activePoints / totalPoints) * 100 : 0,
    busiestPoint,
  }
}

export function formatPointCoordinatesShort(coordinates?: string | null) {
  const parsed = parseCoordinates(coordinates)
  if (!parsed) {
    return null
  }

  return `${parsed.lat.toFixed(5)}, ${parsed.lng.toFixed(5)}`
}

export function getPreviewCameras(
  point: OperationalMapPoint,
  totemDetails: Totem | null,
) {
  const totemCameras = ((totemDetails?.cameras ?? []) as Camera[])
    .filter((camera) => camera?.status !== "inactive")
  const directCameras = ((point.devices?.cameras ?? []) as MapPointCameraSummary[])
    .filter((camera) => camera?.status !== "inactive")
    .map((camera) => ({
      id: camera.id,
      nome: camera.nome ?? undefined,
      status: camera.status ?? "active",
      createdAt: "",
      updatedAt: "",
    }))

  return [...totemCameras, ...directCameras].filter(
    (camera, index, list) => list.findIndex((item) => item.id === camera.id) === index,
  )
}

export function getPrimarySmartSwitch(totemDetails: Totem | null) {
  const list = (totemDetails?.smartSwitches ?? []) as SmartSwitch[]
  return list.find((item) => item?.status !== "inactive") ?? list[0] ?? null
}

export function formatRelativePointStatus(status?: string | null, activeLabel?: string, inactiveLabel?: string) {
  if (status === "inactive") {
    return inactiveLabel || "Inativo"
  }

  return activeLabel || "Ativo"
}
