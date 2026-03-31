"use client"

import * as React from "react"
import Link from "next/link"
import { BrandLogo } from "@/components/logo"
import { useAuthStore } from "@/store/auth-store"
import {
  appNavigation,
  filterNavigationGroupsByAccess,
  getSidebarNavigation,
} from "@/lib/navigation"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import { useTranslator } from "@/lib/i18n"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const allowedScreens = useAuthStore((state) => state.allowedScreens)
  const authUser = useAuthStore((state) => state.user)
  const t = useTranslator("navigation")

  const filteredNavGroups = React.useMemo(() => {
    return getSidebarNavigation(filterNavigationGroupsByAccess(appNavigation, allowedScreens))
  }, [allowedScreens])

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <BrandLogo width={176} height={34} className="max-w-[176px]" priority />
                  <span className="truncate text-xs">Admin Dashboard</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {filteredNavGroups.map((group) => (
          <NavMain key={group.labelKey} label={t(group.labelKey)} items={group.items} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: authUser?.name || "Usuário",
            email: authUser?.email || "sem-email@local",
            avatar: authUser?.avatarUrl || "",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
