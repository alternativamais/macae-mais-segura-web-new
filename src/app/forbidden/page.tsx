import { RouteErrorState } from "@/components/shared/route-error-state"

export default function ForbiddenPage() {
  return (
    <RouteErrorState
      code="403"
      title="Acesso negado"
      description="Seu perfil não possui permissão para acessar esta rota do sistema. Se isso estiver incorreto, revise as telas liberadas para o usuário."
      icon="shieldX"
      primaryHref="/dashboard"
      primaryLabel="Voltar ao dashboard"
      secondaryHref="/sign-in"
      secondaryLabel="Trocar de conta"
    />
  )
}
