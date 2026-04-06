"use client"

import { useAuthStore } from "@/store/auth-store"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  AUTH_REDIRECT_REASON,
  buildSafeNextPath,
  buildSignInPath,
  isTokenExpired,
} from "@/lib/auth-session"

interface ScreenGuardProps {
  screenKey: string
  children: React.ReactNode
  fallbackAction?: "redirect" | "message"
  fallbackRedirectUrl?: string
}

export function ScreenGuard({ 
  screenKey, 
  children, 
  fallbackAction = "redirect",
  fallbackRedirectUrl = "/forbidden"
}: ScreenGuardProps) {
  const allowedScreens = useAuthStore((state) => state.allowedScreens)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const token = useAuthStore((state) => state.token)
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [mounted, setMounted] = useState(false)
  const currentPath = useMemo(() => {
    const query = searchParams.toString()
    return buildSafeNextPath(pathname, query ? `?${query}` : "")
  }, [pathname, searchParams])

  useEffect(() => {
    setMounted(true)
  }, [])

  const tokenExpired = token ? isTokenExpired(token) : false
  const needsAuthentication = mounted && hasHydrated && (!isAuthenticated || !token || tokenExpired)
  const hasAccess = hasHydrated && isAuthenticated && !tokenExpired && allowedScreens.includes(screenKey)
  const shouldRedirectToForbidden =
    mounted && hasHydrated && !needsAuthentication && !hasAccess && fallbackAction === "redirect"

  useEffect(() => {
    if (!mounted || !hasHydrated) {
      return
    }

    if (needsAuthentication) {
      router.replace(
        buildSignInPath(
          currentPath,
          tokenExpired
            ? AUTH_REDIRECT_REASON.sessionExpired
            : AUTH_REDIRECT_REASON.authRequired,
        ),
      )
      return
    }

    if (!shouldRedirectToForbidden) {
      return
    }

    router.replace(fallbackRedirectUrl)
  }, [
    currentPath,
    fallbackRedirectUrl,
    hasHydrated,
    mounted,
    needsAuthentication,
    router,
    shouldRedirectToForbidden,
    tokenExpired,
  ])

  // Só checamos após a hidratação
  if (!mounted || !hasHydrated) return null

  if (!hasAccess) {
    if (needsAuthentication || shouldRedirectToForbidden) {
      return null
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="bg-destructive/10 p-4 rounded-full mb-4">
          <ShieldAlert className="h-12 w-12 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">Acesso Negado</h2>
        <p className="text-muted-foreground mb-6 max-w-sm">
          Você não possui privilégios suficientes para acessar esta tela ({screenKey}). 
          Se acredita ser um erro, contate o administrador.
        </p>
        <Button asChild>
          <Link href={fallbackRedirectUrl}>Voltar ao Início</Link>
        </Button>
      </div>
    )
  }

  return <>{children}</>
}
