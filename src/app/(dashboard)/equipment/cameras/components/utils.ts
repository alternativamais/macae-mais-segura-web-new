import type { Locale } from "@/lib/i18n"
import { formatLocalizedDateTime } from "@/lib/i18n/date"
import { Camera } from "@/types/camera"

interface CameraLocationLabels {
  point: string
  totem: string
  fallback: string
}

export function getCameraLocationLabel(
  item: Camera,
  labels: CameraLocationLabels
): string {
  if (item.totemId) {
    return `${labels.totem} #${item.totem?.numero || item.totemId}`
  }

  if (item.pontoId) {
    return `${labels.point}: ${item.ponto?.nome || item.pontoId}`
  }

  return labels.fallback
}

export function getRtspUrl(item: Camera): string {
  if (!item.ip) return "-"

  const scheme = item.rtspScheme || "rtsp"
  const credentials = item.usuario ? `${item.usuario}:****@` : ""
  const port = item.rtspPort ? `:${item.rtspPort}` : ""
  const path = item.rtspPath
    ? item.rtspPath.startsWith("/")
      ? item.rtspPath
      : `/${item.rtspPath}`
    : ""

  return `${scheme}://${credentials}${item.ip}${port}${path}`
}

export function formatCameraDateTime(
  value?: string | null,
  locale: Locale = "pt-BR"
) {
  if (!value) return "-"

  return formatLocalizedDateTime(new Date(value), locale)
}
