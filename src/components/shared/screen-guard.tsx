"use client"

import { useAuthStore } from "@/store/auth-store"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

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
  const { allowedScreens, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Se o usuário não está logado ou não tem a tela na lista, ele não pode acessar.
  const hasAccess = isAuthenticated && allowedScreens.includes(screenKey)
  const shouldRedirect = mounted && !hasAccess && fallbackAction === "redirect"

  useEffect(() => {
    if (!shouldRedirect) {
      return
    }

    router.replace(fallbackRedirectUrl)
  }, [fallbackRedirectUrl, router, shouldRedirect])

  // Só checamos após a hidratação
  if (!mounted) return null

  if (!hasAccess) {
    if (shouldRedirect) {
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
