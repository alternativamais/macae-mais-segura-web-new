"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BrandLogo } from "@/components/logo"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { authService } from "@/services/auth.service"
import { useAuthStore } from "@/store/auth-store"
import Link from "next/link"
import { captureBrowserLocation } from "@/lib/browser-location"
import { getAuthSessionCompanyState } from "@/lib/auth-session-payload"
import {
  AUTH_REDIRECT_REASON,
  buildSafeNextPath,
  isTokenExpired,
  persistClientAuthToken,
} from "@/lib/auth-session"

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams()
  const login = useAuthStore((state) => state.login)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const token = useAuthStore((state) => state.token)
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const reason = searchParams.get("reason")
  const nextPath = useMemo(() => {
    const next = searchParams.get("next")

    if (!next) {
      return "/dashboard"
    }

    return buildSafeNextPath(next) || "/dashboard"
  }, [searchParams])

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated || !token || isTokenExpired(token)) {
      return
    }

    window.location.replace(new URL(nextPath, window.location.origin).toString())
  }, [hasHydrated, isAuthenticated, nextPath, token])

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true)
    try {
      const coordinates = await captureBrowserLocation()
      const response = await authService.login({
        email: data.email,
        password: data.password,
        latitude: coordinates?.latitude,
        longitude: coordinates?.longitude,
      })
      const { accessToken, user, allowedScreens, permissions } = response

      if (accessToken) {
        persistClientAuthToken(accessToken)

        let finalAllowedScreens = Array.isArray(allowedScreens)
          ? Array.from(
              new Set(
                allowedScreens
                  .filter((screenKey) => typeof screenKey === "string")
                  .map((screenKey) => screenKey.trim())
                  .filter(Boolean),
              ),
            )
          : []

        const { activeCompanyId, availableCompanies } =
          getAuthSessionCompanyState(response)

        login(accessToken, user, activeCompanyId, availableCompanies, finalAllowedScreens, permissions)
        toast.success("Login realizado com sucesso!")
        window.location.replace(new URL(nextPath, window.location.origin).toString())
      }
    } catch (error: any) {
      toast.apiError(error, "Erro ao realizar login")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-6">
              <div className="flex justify-center mb-2">
                <Link href="/" className="flex items-center gap-2 font-medium">
                  <BrandLogo width={176} height={34} priority />
                </Link>
              </div>
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Bem-vindo de volta</h1>
                <p className="text-muted-foreground text-balance">
                  Acesse sua conta para continuar
                </p>
              </div>
              {reason === AUTH_REDIRECT_REASON.sessionExpired ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  Sua sessão expirou. Entre novamente para continuar.
                </div>
              ) : null}
              <div className="grid gap-3">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="exemplo@email.com"
                  {...form.register("email")}
                  required
                />
                {form.formState.errors.email && (
                  <span className="text-xs text-destructive">{form.formState.errors.email.message}</span>
                )}
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Senha</Label>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  {...form.register("password")} 
                  required 
                />
                {form.formState.errors.password && (
                  <span className="text-xs text-destructive">{form.formState.errors.password.message}</span>
                )}
              </div>
              <Button type="submit" className="w-full cursor-pointer" disabled={isLoading}>
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            </div>
          </form>
          <div className="bg-primary/5 relative hidden md:flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent mix-blend-multiply dark:mix-blend-color-burn" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 aspect-square bg-primary/20 rounded-full blur-3xl opacity-50" />
            <div className="relative z-10 flex flex-col items-center justify-center text-center p-8">
              <div className="rounded-full bg-primary/10 p-6 mb-8 ring-1 ring-primary/20 hidden">
                 {/* Decorative element shape */}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="text-muted-foreground text-center text-xs text-balance">
        Ao entrar, você concorda com nossos <a href="#" className="underline underline-offset-4">Termos de Serviço</a>{" "}
        e <a href="#" className="underline underline-offset-4">Política de Privacidade</a>.
      </div>
    </div>
  )
}
