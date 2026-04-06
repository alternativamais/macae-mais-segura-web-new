"use client"

import { useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import axios from 'axios'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/store/auth-store'
import {
  AUTH_REDIRECT_REASON,
  buildSafeNextPath,
  buildSignInPath,
  isTokenExpired,
} from '@/lib/auth-session'

export function useCheckToken() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const logout = useAuthStore((state) => state.logout)
  const syncSession = useAuthStore((state) => state.syncSession)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const token = useAuthStore((state) => state.token)
  const hasHydrated = useAuthStore((state) => state.hasHydrated)

  useEffect(() => {
    let cancelled = false
    const query = searchParams.toString()
    const currentPath = buildSafeNextPath(pathname, query ? `?${query}` : "")

    const runCheck = async () => {
      if (token && isTokenExpired(token)) {
        logout()
        router.replace(buildSignInPath(currentPath, AUTH_REDIRECT_REASON.sessionExpired))
        return
      }

      try {
        const snapshot = await authService.checkToken()
        if (!cancelled) {
          syncSession(snapshot)
        }
      } catch (error) {
        if (
          !cancelled &&
          axios.isAxiosError(error) &&
          error.response?.status === 401
        ) {
          logout()
          router.replace(buildSignInPath(currentPath, AUTH_REDIRECT_REASON.sessionExpired))
        }
      }
    }

    if (hasHydrated && isAuthenticated && token && pathname !== '/sign-in') {
      void runCheck()
    }

    return () => {
      cancelled = true
    }
  }, [hasHydrated, isAuthenticated, logout, pathname, router, searchParams, syncSession, token])
}
