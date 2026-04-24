"use client"

import Image from "next/image"
import * as React from "react"
import { ChevronsUpDown, Building2, Globe, Loader2 } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuthStore } from "@/store/auth-store"
import { BrandLogo } from "@/components/logo"
import { authService } from "@/services/auth.service"
import { notificationService } from "@/lib/notifications/notification-service"
import { getAuthSessionCompanyState } from "@/lib/auth-session-payload"
import { persistClientAuthToken } from "@/lib/auth-session"
import { resolveCompanyLogoUrl } from "@/lib/company-logo"
import { useTheme } from "@/hooks/use-theme"

function CompanySquareLogo({
  companyName,
  logoIconUrl,
  logoSquareLightUrl,
  logoSquareDarkUrl,
  darkMode,
  fallback,
  className,
}: {
  companyName: string
  logoIconUrl?: string | null
  logoSquareLightUrl?: string | null
  logoSquareDarkUrl?: string | null
  darkMode: boolean
  fallback: React.ReactNode
  className?: string
}) {
  const resolvedLogo = resolveCompanyLogoUrl(
    darkMode
      ? logoSquareDarkUrl || logoIconUrl
      : logoSquareLightUrl || logoIconUrl,
  )

  if (!resolvedLogo) {
    return <>{fallback}</>
  }

  return (
    <Image
      src={resolvedLogo}
      alt={companyName}
      width={16}
      height={16}
      unoptimized
      className={className ?? "size-4 object-contain"}
    />
  )
}

function CompanyWideLogo({
  companyName,
  logoUrl,
  logoLightUrl,
  logoDarkUrl,
  darkMode,
}: {
  companyName: string
  logoUrl?: string | null
  logoLightUrl?: string | null
  logoDarkUrl?: string | null
  darkMode: boolean
}) {
  const resolvedLogo = resolveCompanyLogoUrl(
    darkMode ? logoDarkUrl || logoUrl : logoLightUrl || logoUrl,
  )

  if (!resolvedLogo) {
    return (
      <div className="relative h-7 w-36 max-w-full">
        <BrandLogo width={144} height={28} className="h-7 w-36 max-w-full object-contain" priority />
      </div>
    )
  }

  return (
    <div className="relative h-7 w-36 max-w-full">
      <Image
        src={resolvedLogo}
        alt={companyName}
        fill
        sizes="144px"
        unoptimized
        className="block object-contain"
      />
    </div>
  )
}

export function CompanySwitcher() {
  const { isMobile } = useSidebar()
  const { theme } = useTheme()
  const [isSwitching, setIsSwitching] = React.useState(false)
  const [isDarkMode, setIsDarkMode] = React.useState(false)
  const {
    activeCompanyId,
    availableCompanies,
    login,
    setActiveCompanyId,
    token,
  } = useAuthStore()

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")

    const applyThemeMode = () => {
      setIsDarkMode(theme === "dark" || (theme === "system" && mediaQuery.matches))
    }

    applyThemeMode()

    mediaQuery.addEventListener("change", applyThemeMode)

    return () => {
      mediaQuery.removeEventListener("change", applyThemeMode)
    }
  }, [theme])

  if (!availableCompanies || availableCompanies.length === 0) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" asChild>
            <a href="/dashboard">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Building2 className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight ml-2">
                <div className="relative h-[30px] w-40 max-w-[160px]">
                  <BrandLogo width={160} height={30} className="h-[30px] w-40 object-contain" priority />
                </div>
              </div>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  const activeCompany = activeCompanyId === 'ALL' 
    ? { nome: 'Todas as Empresas', id: 'ALL' } 
    : availableCompanies.find(c => String(c.id) === String(activeCompanyId)) || availableCompanies[0]

  const onSelectCompany = async (empresaId: string | number) => {
    if (String(empresaId) === String(activeCompanyId)) {
      return
    }

    try {
      setIsSwitching(true)

      if (empresaId === "ALL") {
        setActiveCompanyId(empresaId)
        window.location.reload()
        return
      }

      if (!token) {
        throw new Error("Missing auth token")
      }

      const session = await authService.selectEmpresa(Number(empresaId), token)
      const { activeCompanyId: nextCompanyId, availableCompanies: nextCompanies } =
        getAuthSessionCompanyState(session)

      persistClientAuthToken(session.accessToken)
      login(
        session.accessToken,
        session.user,
        nextCompanyId ?? Number(empresaId),
        nextCompanies.length > 0 ? nextCompanies : availableCompanies,
        session.allowedScreens,
        session.permissions,
      )
      window.location.reload()
    } catch {
      notificationService.error('Erro ao trocar a empresa.')
    } finally {
      setIsSwitching(false)
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="justify-between data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              disabled={isSwitching}
            >
              <div className="flex min-w-0 flex-1 items-center">
                {isSwitching ? (
                  <div className="flex h-8 w-full items-center justify-center">
                    <Loader2 className="size-4 animate-spin" />
                  </div>
                ) : (
                  <div className="flex h-9 w-full items-center justify-center overflow-hidden">
                    <CompanyWideLogo
                      companyName={activeCompany?.nome || "Empresa"}
                      logoUrl={activeCompany && "logoUrl" in activeCompany ? activeCompany.logoUrl : null}
                      logoLightUrl={activeCompany && "logoLightUrl" in activeCompany ? activeCompany.logoLightUrl : null}
                      logoDarkUrl={activeCompany && "logoDarkUrl" in activeCompany ? activeCompany.logoDarkUrl : null}
                      darkMode={isDarkMode}
                    />
                  </div>
                )}
              </div>
              <ChevronsUpDown className="ml-2 size-4 shrink-0" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Alternar Visualização
            </DropdownMenuLabel>
            
            {/* Opção Visualização Global para multiplas empresas */}
            {availableCompanies.length > 1 && (
              <DropdownMenuItem
                onClick={() => onSelectCompany('ALL')}
                className="gap-2 p-2 cursor-pointer"
              >
                <div className="flex size-6 items-center justify-center rounded-sm border bg-background">
                  <Globe className="size-4 shrink-0 text-blue-500" />
                </div>
                <span className="font-semibold text-blue-500">Todas as Empresas</span>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            {availableCompanies.map((empresa) => (
              <DropdownMenuItem
                key={empresa.id}
                onClick={() => onSelectCompany(empresa.id)}
                className="gap-2 p-2 cursor-pointer"
              >
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  <CompanySquareLogo
                    companyName={empresa.nome}
                    logoIconUrl={empresa.logoIconUrl}
                    logoSquareLightUrl={empresa.logoSquareLightUrl}
                    logoSquareDarkUrl={empresa.logoSquareDarkUrl}
                    darkMode={isDarkMode}
                    fallback={<Building2 className="size-4 shrink-0" />}
                    className="size-4 shrink-0 object-contain"
                  />
                </div>
                <span className="truncate">{empresa.nome}</span>
              </DropdownMenuItem>
            ))}
            
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
