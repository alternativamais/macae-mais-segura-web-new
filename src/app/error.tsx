"use client"

import { RouteErrorState } from "@/components/shared/route-error-state"

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  console.error(error)

  return (
    <RouteErrorState
      code="500"
      title="Erro interno da aplicação"
      description="Ocorreu uma falha inesperada ao renderizar esta rota. Tente novamente ou volte para uma área estável do sistema."
      icon="serverCrash"
      onRetry={reset}
      retryLabel="Recarregar rota"
      secondaryHref="/dashboard"
      secondaryLabel="Voltar ao dashboard"
    />
  )
}
