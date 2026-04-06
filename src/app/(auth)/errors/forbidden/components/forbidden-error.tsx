import { RouteErrorState } from "@/components/shared/route-error-state"

export function ForbiddenError() {
  return (
    <RouteErrorState
      code="403"
      title="Acesso negado"
      description="Seu usuário está autenticado, mas não possui permissão para abrir esta área."
      icon="shieldX"
      primaryHref="/dashboard"
      primaryLabel="Voltar ao dashboard"
    />
  )
}
