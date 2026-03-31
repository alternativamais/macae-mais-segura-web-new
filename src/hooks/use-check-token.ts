"use client"

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import axios from 'axios'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/store/auth-store'

export function useCheckToken() {
  const pathname = usePathname()
  const logout = useAuthStore((state) => state.logout)
  const syncSession = useAuthStore((state) => state.syncSession)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const token = useAuthStore((state) => state.token)

  useEffect(() => {
    let cancelled = false

    const runCheck = async () => {
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
        }
      }
    }

    if (isAuthenticated && token && pathname !== '/sign-in') {
      void runCheck()
    }

    return () => {
      cancelled = true
    }
  }, [pathname, logout, isAuthenticated, syncSession, token])
}
