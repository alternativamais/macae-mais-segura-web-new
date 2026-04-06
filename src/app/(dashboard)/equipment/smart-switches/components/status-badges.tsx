import { Badge } from "@/components/ui/badge"
import { useTranslator } from "@/lib/i18n"
import { SmartSwitchPowerState } from "@/types/smart-switch"

interface SmartSwitchStatusBadgeProps {
  status?: string | null
}

interface SmartSwitchPowerBadgeProps {
  state: SmartSwitchPowerState
}

export function SmartSwitchStatusBadge({
  status,
}: SmartSwitchStatusBadgeProps) {
  const t = useTranslator("smart_switches.table")

  if (status === "active") {
    return <Badge variant="default">{t("status_active")}</Badge>
  }

  return <Badge variant="secondary">{t("status_inactive")}</Badge>
}

export function SmartSwitchPowerBadge({ state }: SmartSwitchPowerBadgeProps) {
  const t = useTranslator("smart_switches.table")

  if (state === "on") {
    return <Badge variant="default">{t("power_state.on")}</Badge>
  }

  if (state === "off") {
    return <Badge variant="secondary">{t("power_state.off")}</Badge>
  }

  if (state === "offline") {
    return <Badge variant="destructive">{t("power_state.offline")}</Badge>
  }

  return <Badge variant="outline">{t("power_state.unknown")}</Badge>
}
