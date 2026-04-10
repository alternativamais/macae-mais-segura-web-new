"use client"

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

export function CompanySwitcher() {
  const { isMobile } = useSidebar()
  const [isSwitching, setIsSwitching] = React.useState(false)
  const {
    activeCompanyId,
    availableCompanies,
    login,
    setActiveCompanyId,
    token,
  } = useAuthStore()

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
                <BrandLogo width={160} height={30} className="max-w-[160px]" priority />
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
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              disabled={isSwitching}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                 {isSwitching ? (
                   <Loader2 className="size-4 animate-spin" />
                 ) : activeCompanyId === 'ALL' ? (
                   <Globe className="size-4" />
                 ) : (
                   <Building2 className="size-4" />
                 )}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight ml-2">
                <BrandLogo width={120} height={20} className="w-[120px] mb-1" priority />
                <span className="truncate text-xs font-medium">{activeCompany?.nome || "Selecione..."}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
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
                  <Building2 className="size-4 shrink-0" />
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
