import { AUTH_TOKEN_KEY } from "@/lib/auth-session"
import { useAuthStore } from "@/store/auth-store"
import {
  Integration,
  IntegrationCameraBinding,
  IntegrationCameraSummary,
  IntegrationDirectionFilter,
  IntegrationLog,
  IntegrationRealtimeLogLine,
} from "@/types/integration"

const LEGACY_AUTH_TOKEN_KEY = "@macaemaissegura:token"

export function getIntegrationBadgeVariant(enabled: boolean) {
  return enabled ? "default" : "secondary"
}

export function getIntegrationSearchIndex(integration: Integration) {
  return [integration.name, integration.code, integration.description]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
}

export function getCameraLocationLabel(
  camera: IntegrationCameraSummary | null | undefined,
  fallback: string,
) {
  if (!camera) return fallback

  if (camera.totem?.numero) {
    const pointReference =
      camera.totem.ponto?.pontoDeReferencia || camera.totem.ponto?.nome
    return pointReference
      ? `Totem ${camera.totem.numero} • ${pointReference}`
      : `Totem ${camera.totem.numero}`
  }

  if (camera.ponto?.pontoDeReferencia || camera.ponto?.nome) {
    return camera.ponto.pontoDeReferencia || camera.ponto.nome
  }

  return fallback
}

export function countConfiguredCameras(integrations: IntegrationCameraBinding[]) {
  return integrations.length
}

export function countActiveBindings(integrations: IntegrationCameraBinding[]) {
  return integrations.filter((binding) => binding.active).length
}

export function countActiveTokens(integrations: IntegrationCameraBinding[]) {
  return integrations.reduce((sum, binding) => {
    const activeTokens =
      binding.tokens?.filter((token) => !token.revoked).length ?? 0
    return sum + activeTokens
  }, 0)
}

export function formatDirectionFilter(
  value?: string | null,
  fallback: IntegrationDirectionFilter = "ALL",
): IntegrationDirectionFilter {
  const normalized = value?.trim().toUpperCase()

  if (normalized === "OBVERSE" || normalized === "REVERSE") {
    return normalized
  }

  return fallback
}

export function getDirectionalIdentifier(
  binding: IntegrationCameraBinding,
  direction: IntegrationDirectionFilter,
) {
  const fallback = binding.codCet || binding.camera?.nome || "-"

  if (direction === "OBVERSE") {
    return binding.codCetObverse || fallback
  }

  if (direction === "REVERSE") {
    return binding.codCetReverse || fallback
  }

  return fallback
}

export function buildDirectionalCodePayload({
  directionFilter,
  singleCode,
  obverseCode,
  reverseCode,
  keepEmpty = false,
}: {
  directionFilter: IntegrationDirectionFilter
  singleCode?: string
  obverseCode?: string
  reverseCode?: string
  keepEmpty?: boolean
}) {
  const normalizeCode = (value?: string, allowEmpty = false) => {
    const trimmed = value?.trim() || ""
    if (allowEmpty) return trimmed
    return trimmed || undefined
  }

  const normalizedSingle = normalizeCode(singleCode, keepEmpty)
  const normalizedObverse = normalizeCode(obverseCode, keepEmpty)
  const normalizedReverse = normalizeCode(reverseCode, keepEmpty)

  if (directionFilter === "ALL") {
    return {
      codCet: normalizedSingle,
      codCetObverse:
        normalizedObverse === undefined ? normalizedSingle : normalizedObverse,
      codCetReverse:
        normalizedReverse === undefined ? normalizedSingle : normalizedReverse,
    }
  }

  if (directionFilter === "OBVERSE") {
    return {
      codCet: normalizedSingle,
      codCetObverse: normalizedSingle,
    }
  }

  return {
    codCet: normalizedSingle,
    codCetReverse: normalizedSingle,
  }
}

export function formatJsonPayload(value?: string | null) {
  if (!value) return "N/A"

  try {
    return JSON.stringify(JSON.parse(value), null, 2)
  } catch {
    return value
  }
}

export function getSocketBaseUrl() {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:6001/api/"

  return baseUrl.replace(/\/api\/?$/, "")
}

export function getAuthTokenForRealtime() {
  if (typeof window === "undefined") return null

  return (
    localStorage.getItem(AUTH_TOKEN_KEY) ||
    localStorage.getItem(LEGACY_AUTH_TOKEN_KEY)
  )
}

export function getRealtimeSocketAuth() {
  const token = getAuthTokenForRealtime()
  if (!token) return null

  const { activeCompanyId } = useAuthStore.getState()

  return {
    token,
    ...(activeCompanyId ? { empresaId: String(activeCompanyId) } : {}),
  }
}

export function getRealtimeEventName(integrationCode: string) {
  switch (integrationCode.trim().toLowerCase()) {
    case "prf":
      return "integration:prf-event"
    case "pmrj":
    default:
      return "integration:pmrj-event"
  }
}

export function getLogStatusVariant(success: boolean) {
  return success ? "default" : "destructive"
}

export function getRealtimeLogColor(type: IntegrationRealtimeLogLine["type"]) {
  switch (type) {
    case "success":
      return "text-emerald-400"
    case "error":
      return "text-red-400"
    case "running":
      return "text-amber-400"
    case "header":
      return "text-sky-400"
    case "warning":
      return "text-yellow-300"
    case "separator":
      return "text-zinc-600"
    case "detail":
      return "text-zinc-400"
    default:
      return "text-zinc-200"
  }
}

export function getUniqueIdentifierCount(integrations: Integration[]) {
  return new Set(integrations.map((integration) => integration.code)).size
}

export function getIntegrationReferenceLabel(code: string, name: string) {
  const normalized = code.trim().toLowerCase()

  if (normalized === "pmrj") return "PMRJ"
  if (normalized === "prf") return "PRF"

  return name
}

export function buildConfiguredSearchIndex(
  binding: IntegrationCameraBinding,
  fallback: string,
) {
  return [
    binding.camera?.nome,
    binding.camera?.ip,
    binding.camera?.totem?.numero,
    binding.camera?.totem?.ponto?.pontoDeReferencia,
    binding.camera?.ponto?.pontoDeReferencia,
    getDirectionalIdentifier(binding, "ALL"),
    getDirectionalIdentifier(binding, "OBVERSE"),
    getDirectionalIdentifier(binding, "REVERSE"),
    getCameraLocationLabel(binding.camera, fallback),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
}

export function buildAvailableSearchIndex(
  camera: IntegrationCameraSummary,
  fallback: string,
) {
  return [
    camera.nome,
    camera.ip,
    camera.totem?.numero,
    camera.totem?.ponto?.pontoDeReferencia,
    camera.ponto?.pontoDeReferencia,
    getCameraLocationLabel(camera, fallback),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
}

export function getCameraTokenCount(binding: IntegrationCameraBinding) {
  return binding.tokens?.filter((token) => !token.revoked).length ?? 0
}

export function formatLogDirection(direction?: string | null) {
  if (direction === "Obverse") return "OBVERSE"
  if (direction === "Reverse") return "REVERSE"
  return "ALL"
}

export function getLatestLogTimestamp(logs: IntegrationLog[]) {
  return logs[0]?.sentAt || logs[0]?.createdAt || null
}
