import { Badge } from "@/components/ui/badge"
import { useTranslator } from "@/lib/i18n"
import { CALL_CENTER_STATUS_META } from "./utils"

export function CallCenterStatusBadge({ status }: { status?: string | null }) {
  const t = useTranslator("call_center")
  const meta = CALL_CENTER_STATUS_META[status || ""]

  if (!meta) {
    return <Badge variant="outline">{String(status || t("shared.not_informed"))}</Badge>
  }

  const variant =
    meta.tone === "success"
      ? "default"
      : meta.tone === "warning"
        ? "secondary"
        : meta.tone === "destructive"
          ? "destructive"
          : "outline"

  return <Badge variant={variant}>{t(meta.labelKey)}</Badge>
}
