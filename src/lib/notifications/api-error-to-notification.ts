import type { ParsedApiError } from "@/lib/api-error"
import type { NotificationPort, NotifyOptions } from "./types"

export function notifyApiError(
  notifier: NotificationPort,
  parsedError: ParsedApiError,
  options?: NotifyOptions
) {
  if (
    parsedError.code === "missing_permissions" &&
    Array.isArray(parsedError.requiredPermissions) &&
    parsedError.requiredPermissions.length > 0
  ) {
    notifier.permissionError(
      {
        message: parsedError.message,
        requiredPermissions: parsedError.requiredPermissions,
      },
      options
    )
    return
  }

  notifier.error(parsedError.message, options)
}
