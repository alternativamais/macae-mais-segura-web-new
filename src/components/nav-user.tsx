"use client"

import {
  EllipsisVertical,
  LogOut,
  CircleUser,
} from "lucide-react"
import { Logo } from "@/components/logo"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuthStore } from "@/store/auth-store"
import { useRouter } from "next/navigation"
import { useTranslator, locales, localeCookieName, Locale } from "@/lib/i18n"
import { setCookie } from "cookies-next"

const languageLabels: Record<Locale, string> = {
  "pt-BR": "PT",
  "en-US": "US",
}

const languageFlags: Record<Locale, string> = {
  "pt-BR": "🇧🇷 ",
  "en-US": "🇺🇸 ",
}

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()
  const logout = useAuthStore((state) => state.logout)
  const router = useRouter()
  const t = useTranslator("user")
  const currentLocale = t.getLocale() as Locale

  const handleLogout = () => {
    logout()
    router.push("/sign-in")
  }

  const handleLanguageChange = (nextLocale: string) => {
    setCookie(localeCookieName, nextLocale)
    window.location.reload()
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar || undefined} alt={user.name} />
                <AvatarFallback className="rounded-lg bg-transparent p-0">
                  <Logo size={28} />
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {user.email}
                </span>
              </div>
              <EllipsisVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar || undefined} alt={user.name} />
                  <AvatarFallback className="rounded-lg bg-transparent p-0">
                    <Logo size={28} />
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => router.push("/settings/account")}
              >
                  <CircleUser />
                  {t('account')}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <div className="">
              <Tabs className="gap-0" value={currentLocale} onValueChange={handleLanguageChange}>
                <TabsList className="h-8 w-full">
                  {locales.map((locale) => (
                    <TabsTrigger
                      key={locale}
                      value={locale}
                      className="h-full flex-1 cursor-pointer px-2.5 py-1.5 text-sm data-[state=active]:shadow-none"
                    >
                      <span className="text-sm leading-none">{languageFlags[locale as Locale]}</span>
                      <span>{languageLabels[locale as Locale]}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="cursor-pointer" 
              onClick={handleLogout}
            >
              <LogOut />
              {t('logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
