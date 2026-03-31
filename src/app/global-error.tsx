"use client"

import { RouteErrorState } from "@/components/shared/route-error-state"

interface GlobalErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalErrorPage({ error, reset }: GlobalErrorPageProps) {
  console.error(error)

  return (
    <html lang="pt-BR">
      <body>
        <RouteErrorState
          code="500"
          title="Erro crítico da aplicação"
          description="A aplicação encontrou uma falha global ao abrir esta rota. Tente recarregar a página ou volte ao dashboard."
          icon="serverCrash"
          onRetry={reset}
          retryLabel="Tentar novamente"
          secondaryHref="/dashboard"
          secondaryLabel="Voltar ao dashboard"
        />
      </body>
    </html>
  )
}
