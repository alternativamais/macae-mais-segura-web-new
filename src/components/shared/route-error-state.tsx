"use client"

import Link from "next/link"
import {
  ArrowLeft,
  FileSearch,
  Home,
  RotateCcw,
  ServerCrash,
  ShieldAlert,
  ShieldX,
} from "lucide-react"
import { DataTag } from "@/components/shared/data-tag"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const iconMap = {
  fileSearch: FileSearch,
  serverCrash: ServerCrash,
  shieldAlert: ShieldAlert,
  shieldX: ShieldX,
} as const

interface RouteErrorStateProps {
  code: string
  title: string
  description: string
  icon: keyof typeof iconMap
  primaryHref?: string
  primaryLabel?: string
  secondaryHref?: string
  secondaryLabel?: string
  onRetry?: () => void
  retryLabel?: string
}

export function RouteErrorState({
  code,
  title,
  description,
  icon,
  primaryHref = "/dashboard",
  primaryLabel = "Ir para o dashboard",
  secondaryHref = "/sign-in",
  secondaryLabel = "Fazer login",
  onRetry,
  retryLabel = "Tentar novamente",
}: RouteErrorStateProps) {
  const Icon = iconMap[icon]

  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/20 px-4 py-10 lg:px-6">
      <Card className="w-full max-w-3xl overflow-hidden">
        <CardContent className="grid gap-8 p-6 md:grid-cols-[220px_minmax(0,1fr)] md:p-8">
          <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-muted/70 via-muted/40 to-background p-6">
            <div className="absolute right-4 top-4">
              <DataTag tone="neutral" monospace>
                {code}
              </DataTag>
            </div>
            <div className="flex h-full min-h-[180px] items-end">
              <div className="space-y-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl border bg-background/80 shadow-sm">
                  <Icon className="h-7 w-7 text-foreground" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Erro de rota
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Ocorreu um bloqueio ou interrupção ao abrir esta página.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <div className="space-y-3">
              <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
              <p className="max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
                {description}
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {onRetry ? (
                <Button onClick={onRetry} className="cursor-pointer">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {retryLabel}
                </Button>
              ) : (
                <Button asChild className="cursor-pointer">
                  <Link href={primaryHref}>
                    <Home className="mr-2 h-4 w-4" />
                    {primaryLabel}
                  </Link>
                </Button>
              )}

              <Button asChild variant="outline" className="cursor-pointer">
                <Link href={secondaryHref}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {secondaryLabel}
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
