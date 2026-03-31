"use client"

import { toast } from "sonner"
import { ActionNotification, type ActionNotificationVariant } from "@/components/shared/action-notification"
import { parseApiError } from "@/lib/api-error"
import { notifyApiError } from "./api-error-to-notification"
import { NotificationPort, NotifyOptions, PermissionErrorPayload } from "./types"

const notificationDefaults: Record<ActionNotificationVariant, number> = {
  success: 3500,
  info: 4500,
  warning: 5500,
  error: 6500,
  "permission-error": 8000,
  loading: 10000,
}

export class SonnerNotificationAdapter implements NotificationPort {
  private show(
    variant: ActionNotificationVariant,
    message: string,
    options?: NotifyOptions & {
      requiredPermissions?: string[]
      copyValue?: string
    }
  ) {
    const title = options?.title || this.getDefaultTitle(variant)
    const duration = options?.duration ?? notificationDefaults[variant]

    return toast.custom(
      (id) => (
        <ActionNotification
          variant={variant}
          title={title}
          description={options?.description || message}
          requiredPermissions={options?.requiredPermissions}
          copyValue={options?.copyValue}
          onDismiss={() => toast.dismiss(id)}
        />
      ),
      {
        duration,
      }
    )
  }

  private getDefaultTitle(variant: ActionNotificationVariant) {
    if (variant === "success") return "Ação concluída"
    if (variant === "warning") return "Atenção"
    if (variant === "info") return "Informação"
    if (variant === "permission-error") return "Permissão necessária"
    if (variant === "loading") return "Processando"
    return "Erro na ação"
  }

  success(message: string, options?: NotifyOptions) {
    this.show("success", message, options)
  }

  error(message: string, options?: NotifyOptions) {
    this.show("error", message, options)
  }

  warning(message: string, options?: NotifyOptions) {
    this.show("warning", message, options)
  }

  info(message: string, options?: NotifyOptions) {
    this.show("info", message, options)
  }

  permissionError(payload: PermissionErrorPayload, options?: NotifyOptions) {
    const copyValue = payload.requiredPermissions.join("\n")

    this.show("permission-error", payload.message, {
      ...options,
      requiredPermissions: payload.requiredPermissions,
      copyValue,
    })
  }

  apiError(error: unknown, fallback = "Ocorreu um erro inesperado.", options?: NotifyOptions) {
    const parsed = parseApiError(error, fallback)
    notifyApiError(this, parsed, options)
  }

  async promise<T>(
    promise: Promise<T>,
    config: {
      loading: string
      success: string | ((value: T) => string)
      error: string | ((error: unknown) => string)
    }
  ) {
    const loadingId = this.show("loading", config.loading)

    try {
      const result = await promise
      toast.dismiss(loadingId)
      this.success(typeof config.success === "function" ? config.success(result) : config.success)
      return result
    } catch (error) {
      toast.dismiss(loadingId)
      const message = typeof config.error === "function" ? config.error(error) : config.error
      this.apiError(error, message)
      throw error
    }
  }
}
