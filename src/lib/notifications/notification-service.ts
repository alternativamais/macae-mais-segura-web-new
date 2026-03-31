import { NotificationPort } from "./types"

class NoopNotificationPort implements NotificationPort {
  private warn(method: string) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[notification-service] NotificationPort ainda não registrado: ${method}`)
    }
  }

  success() {
    this.warn("success")
  }

  error() {
    this.warn("error")
  }

  warning() {
    this.warn("warning")
  }

  info() {
    this.warn("info")
  }

  permissionError() {
    this.warn("permissionError")
  }

  apiError() {
    this.warn("apiError")
  }

  async promise<T>(promise: Promise<T>) {
    this.warn("promise")
    return promise
  }
}

class NotificationService implements NotificationPort {
  private port: NotificationPort = new NoopNotificationPort()

  setPort(port: NotificationPort) {
    this.port = port
  }

  resetPort() {
    this.port = new NoopNotificationPort()
  }

  success(message: string, options?: Parameters<NotificationPort["success"]>[1]) {
    this.port.success(message, options)
  }

  error(message: string, options?: Parameters<NotificationPort["error"]>[1]) {
    this.port.error(message, options)
  }

  warning(message: string, options?: Parameters<NotificationPort["warning"]>[1]) {
    this.port.warning(message, options)
  }

  info(message: string, options?: Parameters<NotificationPort["info"]>[1]) {
    this.port.info(message, options)
  }

  permissionError(
    payload: Parameters<NotificationPort["permissionError"]>[0],
    options?: Parameters<NotificationPort["permissionError"]>[1]
  ) {
    this.port.permissionError(payload, options)
  }

  apiError(
    error: unknown,
    fallback?: string,
    options?: Parameters<NotificationPort["apiError"]>[2]
  ) {
    this.port.apiError(error, fallback, options)
  }

  promise<T>(
    promise: Promise<T>,
    config: Parameters<NotificationPort["promise"]>[1]
  ) {
    return this.port.promise(promise, config)
  }
}

export const notificationService = new NotificationService()
