import { useTranslator } from "@/lib/i18n"
import { DataTag, resolveDataTagDefinition } from "@/components/shared/data-tag"
import { ClientOrigin, LogLevel } from "@/types/log"
import { getLogLevelLabel, getOriginLabel } from "./utils"

export function LogLevelBadge({ level }: { level?: LogLevel }) {
  const t = useTranslator("logs")
  const logLevelTagMap = {
    error: { label: t("shared.levels.error"), tone: "danger" },
    warn: { label: t("shared.levels.warn"), tone: "warning" },
    info: { label: t("shared.levels.info"), tone: "info" },
    debug: { label: t("shared.levels.debug"), tone: "neutral" },
  } as const

  const tag = resolveDataTagDefinition(level, logLevelTagMap, {
    label: getLogLevelLabel(level, t),
    tone: "neutral",
  })

  return <DataTag tone={tag.tone}>{tag.label}</DataTag>
}

export function OriginBadge({ origin }: { origin?: ClientOrigin }) {
  const t = useTranslator("logs")
  const originTagMap = {
    app: { label: t("shared.origins.app"), tone: "success" },
    web: { label: t("shared.origins.web"), tone: "info" },
    unknown: { label: t("shared.origins.unknown"), tone: "neutral" },
  } as const

  const tag = resolveDataTagDefinition(origin, originTagMap, {
    label: getOriginLabel(origin, t),
    tone: "neutral",
  })

  return <DataTag tone={tag.tone}>{tag.label}</DataTag>
}

export function MethodBadge({ method }: { method?: string }) {
  const methodTagMap = {
    get: { label: "GET", tone: "success" },
    post: { label: "POST", tone: "info" },
    put: { label: "PUT", tone: "warning" },
    patch: { label: "PATCH", tone: "accent" },
    delete: { label: "DELETE", tone: "danger" },
  } as const

  const tag = resolveDataTagDefinition(method, methodTagMap, {
    label: String(method || "-").toUpperCase(),
    tone: "neutral",
  })

  return <DataTag tone={tag.tone}>{tag.label}</DataTag>
}

export function StatusCodeBadge({ statusCode }: { statusCode?: number }) {
  const tone =
    typeof statusCode !== "number"
      ? "neutral"
      : statusCode >= 500
        ? "danger"
        : statusCode >= 400
          ? "warning"
          : statusCode >= 200
            ? "success"
            : "neutral"

  return (
    <DataTag tone={tone} monospace>
      {statusCode ?? "-"}
    </DataTag>
  )
}
