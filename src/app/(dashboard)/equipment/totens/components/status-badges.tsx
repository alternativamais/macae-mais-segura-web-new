import { Badge } from "@/components/ui/badge"
import { useTranslator } from "@/lib/i18n"

interface TotemStatusBadgeProps {
  status?: string | null
}

export function TotemStatusBadge({ status }: TotemStatusBadgeProps) {
  const t = useTranslator("totens.table")

  if (status === "active") {
    return <Badge variant="default">{t("status_active")}</Badge>
  }

  return <Badge variant="secondary">{t("status_inactive")}</Badge>
}
