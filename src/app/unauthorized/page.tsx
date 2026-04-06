"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { RouteErrorState } from "@/components/shared/route-error-state"
import {
  AUTH_REDIRECT_REASON,
  buildSignInPath,
} from "@/lib/auth-session"

const REDIRECT_DELAY_SECONDS = 5

export default function UnauthorizedPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [secondsRemaining, setSecondsRemaining] = useState(REDIRECT_DELAY_SECONDS)
  const reason = searchParams.get("reason")
  const next = searchParams.get("next")
  const isSessionExpired = reason === AUTH_REDIRECT_REASON.sessionExpired
  const isAuthRequired = reason === AUTH_REDIRECT_REASON.authRequired
  const shouldHideActions = isSessionExpired || isAuthRequired

  const redirectHref = useMemo(() => {
    const safeNext =
      next && next.startsWith("/") && !next.startsWith("//") ? next : null

    return buildSignInPath(
      safeNext,
      isSessionExpired ? AUTH_REDIRECT_REASON.sessionExpired : undefined,
    )
  }, [isSessionExpired, next])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setSecondsRemaining((current) => (current > 1 ? current - 1 : 0))
    }, 1000)

    const timeoutId = window.setTimeout(() => {
      router.replace(redirectHref)
    }, REDIRECT_DELAY_SECONDS * 1000)

    return () => {
      window.clearInterval(intervalId)
      window.clearTimeout(timeoutId)
    }
  }, [redirectHref, router])

  return (
    <RouteErrorState
      code="401"
      title={isSessionExpired ? "Sessão expirada" : "Não autenticado"}
      description={
        isSessionExpired
          ? `Sua sessão expirou e o acesso foi encerrado automaticamente. Você será redirecionado para o login em ${secondsRemaining} segundo${secondsRemaining === 1 ? "" : "s"}.`
          : isAuthRequired
            ? `Esta rota exige autenticação. Você será redirecionado para o login em ${secondsRemaining} segundo${secondsRemaining === 1 ? "" : "s"}.`
            : `Esta rota exige uma sessão válida. Você será redirecionado para o login em ${secondsRemaining} segundo${secondsRemaining === 1 ? "" : "s"}.`
      }
      icon="shieldAlert"
      primaryHref={redirectHref}
      primaryLabel="Ir para o login agora"
      secondaryHref={shouldHideActions ? undefined : "/"}
      secondaryLabel={shouldHideActions ? undefined : "Voltar ao início"}
      hideActions={shouldHideActions}
    />
  )
}
