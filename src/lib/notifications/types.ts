export interface NotificationAction {
  label: string
  onClick: () => void | Promise<void>
  variant?: "default" | "outline"
}

export interface PermissionErrorPayload {
  message: string
  requiredPermissions: string[]
}

export interface NotifyOptions {
  title?: string
  description?: string
  duration?: number
}

export interface NotificationPort {
  success(message: string, options?: NotifyOptions): void
  error(message: string, options?: NotifyOptions): void
  warning(message: string, options?: NotifyOptions): void
  info(message: string, options?: NotifyOptions): void
  permissionError(payload: PermissionErrorPayload, options?: NotifyOptions): void
  apiError(error: unknown, fallback?: string, options?: NotifyOptions): void
  promise<T>(
    promise: Promise<T>,
    config: {
      loading: string
      success: string | ((value: T) => string)
      error: string | ((error: unknown) => string)
    }
  ): Promise<T>
}
