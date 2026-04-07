import { NotificationAudience, NotificationHistoryItem } from "@/types/notification-center"

export const DEFAULT_MAP_CENTER = { lat: -22.376534, lng: -41.794399 }
export const MIN_AREA_RADIUS_KM = 0.25
export const MAX_AREA_RADIUS_KM = 15
export const MAX_LOCATION_AGE_MINUTES = 24 * 60

export function formatNotificationTarget(item: Pick<NotificationHistoryItem, "targetType">, t: (key: string) => string) {
  switch (item.targetType) {
    case "all":
      return t("shared.target_all")
    case "user":
      return t("shared.target_user")
    case "locality":
      return t("shared.target_locality")
    case "area":
      return t("shared.target_area")
    default:
      return item.targetType
  }
}

export function formatNotificationAudience(
  audience: NotificationAudience | null | undefined,
  t: (key: string) => string,
) {
  switch (audience) {
    case "policial":
      return t("shared.audience_policial")
    case "cidadao":
      return t("shared.audience_cidadao")
    case "all":
    default:
      return t("shared.audience_all")
  }
}
