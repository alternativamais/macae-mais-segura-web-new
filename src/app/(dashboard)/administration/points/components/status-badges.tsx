import { Badge } from "@/components/ui/badge"
import { useTranslator } from "@/lib/i18n"

interface PointStatusBadgeProps {
  status?: string | null
}

export function PointStatusBadge({ status }: PointStatusBadgeProps) {
  const t = useTranslator("points.table")

  if (status === "active") {
    return <Badge variant="default">{t("status_active")}</Badge>
  }

  return <Badge variant="secondary">{t("status_inactive")}</Badge>
}
