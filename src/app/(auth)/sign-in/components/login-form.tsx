"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
import Image from "next/image"
import { setCookie } from "cookies-next"
import { collectFrontendScreens } from "@/lib/frontend-screens"
import {
  AUTH_COOKIE_KEY,
  AUTH_REDIRECT_REASON,
  AUTH_TOKEN_KEY,
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
  const router = useRouter()
  const searchParams = useSearchParams()
  const login = useAuthStore((state) => state.login)
  const reason = searchParams.get("reason")

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true)
    try {
      const response = await authService.login(data)
      const { accessToken, user, allowedScreens, permissions } = response

      if (accessToken) {
        localStorage.setItem(AUTH_TOKEN_KEY, accessToken)
        // O cookie é essencial para o Middleware do Nextjs
        setCookie(AUTH_COOKIE_KEY, accessToken, { 
          maxAge: 60 * 60 * 24 * 7, // 7 dias
          path: '/',
        })

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

        const roleName =
          typeof user?.role?.name === "string" ? user.role.name.toLowerCase() : ""

        if (roleName === "admin") {
          const frontendScreens = collectFrontendScreens()
          const screenKeys = frontendScreens.map((screen) => screen.screenKey)

          if (frontendScreens.length) {
            try {
              await authService.syncClientScreens(frontendScreens)
            } catch (error) {
              console.warn("Falha ao sincronizar telas do frontend", error)
            }
          }

          if (screenKeys.length) {
            finalAllowedScreens = Array.from(
              new Set([...finalAllowedScreens, ...screenKeys]),
            )
          }
        }

        login(accessToken, user, finalAllowedScreens, permissions)
        toast.success("Login realizado com sucesso!")
        const next = searchParams.get("next")
        if (next && next.startsWith("/") && !next.startsWith("//")) {
          router.push(next)
        } else {
          router.push("/dashboard")
        }
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
          <div className="bg-muted relative hidden md:block">
            <Image
              src="https://ui.shadcn.com/placeholder.svg"
              alt="Image"
              fill
              className="object-cover dark:brightness-[0.95] dark:invert"
            />
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
