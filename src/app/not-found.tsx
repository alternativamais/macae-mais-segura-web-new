import { RouteErrorState } from "@/components/shared/route-error-state"

export default function NotFound() {
  return (
    <RouteErrorState
      code="404"
      title="Rota não encontrada"
      description="A página solicitada não existe mais, foi movida ou o endereço informado é inválido."
      icon="fileSearch"
      primaryHref="/dashboard"
      primaryLabel="Ir para o dashboard"
      secondaryHref="/sign-in"
      secondaryLabel="Ir para o login"
    />
  )
}
