"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { RouteErrorState } from "@/components/shared/route-error-state"

const REDIRECT_DELAY_SECONDS = 5

export default function UnauthorizedPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [secondsRemaining, setSecondsRemaining] = useState(REDIRECT_DELAY_SECONDS)

  const redirectHref = useMemo(() => {
    const next = searchParams.get("next")

    if (next && next.startsWith("/") && !next.startsWith("//")) {
      return `/sign-in?next=${encodeURIComponent(next)}`
    }

    return "/sign-in"
  }, [searchParams])

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
      title="Não autenticado"
      description={`Esta rota exige uma sessão válida. Você será redirecionado para o login em ${secondsRemaining} segundo${secondsRemaining === 1 ? "" : "s"}.`}
      icon="shieldAlert"
      primaryHref={redirectHref}
      primaryLabel="Ir para o login agora"
      secondaryHref="/"
      secondaryLabel="Voltar ao início"
    />
  )
}
