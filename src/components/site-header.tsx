"use client"

import * as React from "react"
import { ArrowLeft } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { CommandSearch, SearchTrigger } from "@/components/command-search"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { useTranslator } from "@/lib/i18n"
import { cn } from "@/lib/utils"

export function SiteHeader({ floating = false }: { floating?: boolean }) {
  const [searchOpen, setSearchOpen] = React.useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslator("plate_sending")
  const isPlateSendingIntegrationRoute = pathname.startsWith(
    "/administration/integrations/plate-sending/",
  )

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setSearchOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <>
      <header
        className={cn(
          "flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)",
          floating &&
            "absolute inset-x-0 top-0 z-30 border-border/70 bg-background/90 shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-background/82",
        )}
      >
        <div className="flex w-full items-center gap-1 px-4 py-3 lg:gap-2 lg:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          {isPlateSendingIntegrationRoute ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="cursor-pointer"
                onClick={() => router.back()}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("actions.back_to_list")}
              </Button>
              <Separator
                orientation="vertical"
                className="mx-2 data-[orientation=vertical]:h-4"
              />
            </>
          ) : null}
          <div className="flex-1 max-w-sm">
            <SearchTrigger
              onClick={() => setSearchOpen(true)}
              className={
                floating
                  ? "border-border/70 bg-background/90 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-background/85"
                  : undefined
              }
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ModeToggle />
          </div>

        </div>
      </header>
      <CommandSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  )
}
