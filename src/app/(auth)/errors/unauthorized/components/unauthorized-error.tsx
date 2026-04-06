import { RouteErrorState } from "@/components/shared/route-error-state"

export function UnauthorizedError() {
  return (
    <RouteErrorState
      code="401"
      title="Não autenticado"
      description="Esta área exige uma sessão válida. Entre novamente para continuar."
      icon="shieldAlert"
      primaryHref="/sign-in"
      primaryLabel="Ir para o login"
      secondaryHref="/"
      secondaryLabel="Voltar ao início"
    />
  )
}
