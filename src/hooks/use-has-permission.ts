"use client"

import { useCallback } from "react"
import { useAuthStore } from "@/store/auth-store"

export function useHasPermission() {
  const permissions = useAuthStore((state) => state.permissions)

  const hasPermission = useCallback(
    (permission: string) => permissions.includes(permission),
    [permissions]
  )

  const hasAnyPermission = useCallback(
    (requiredPermissions: string[]) =>
      requiredPermissions.some((permission) => permissions.includes(permission)),
    [permissions]
  )

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
  }
}
