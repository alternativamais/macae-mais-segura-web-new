import axios from "axios"

export interface ParsedApiError {
  statusCode?: number
  code?: string
  message: string
  error?: string
  requiredPermissions?: string[]
}

export function parseApiError(
  error: unknown,
  fallback = "Ocorreu um erro inesperado."
): ParsedApiError {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | {
          statusCode?: number
          code?: string
          message?: string | string[]
          error?: string
          requiredPermissions?: string[]
        }
      | undefined

    const message = Array.isArray(data?.message)
      ? data.message.join(" ")
      : typeof data?.message === "string" && data.message.trim()
        ? data.message
        : typeof data?.error === "string" && data.error.trim()
          ? data.error
          : fallback

    return {
      statusCode: error.response?.status || data?.statusCode,
      code: data?.code,
      message,
      error: data?.error,
      requiredPermissions: Array.isArray(data?.requiredPermissions)
        ? data.requiredPermissions
        : undefined,
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return {
      message: error.message,
    }
  }

  return {
    message: fallback,
  }
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Ocorreu um erro inesperado."
) {
  return parseApiError(error, fallback).message
}
