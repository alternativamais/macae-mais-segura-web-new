import { resolveCompanyLogoUrl } from "@/lib/company-logo"
import { OperationalMapPoint } from "@/types/map"

export function resolveMapPinUrl(point: OperationalMapPoint) {
  const rawValue = point.totem?.id
    ? point.empresa?.totemPinUrl
    : point.empresa?.pointPinUrl

  return resolveCompanyLogoUrl(rawValue)
}
