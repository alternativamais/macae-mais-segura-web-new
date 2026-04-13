"use client"

import type { ReactNode } from "react"
import { ChevronDown, Globe, LayoutGrid } from "lucide-react"
import { BrandLogo, Logo } from "@/components/logo"
import { resolveCompanyLogoUrl } from "@/lib/company-logo"
import { cn } from "@/lib/utils"

function LogoImage({
  src,
  alt,
  className,
  fallback,
}: {
  src?: string | null
  alt: string
  className: string
  fallback: ReactNode
}) {
  const resolvedSrc = resolveCompanyLogoUrl(src)

  if (!resolvedSrc) {
    return <>{fallback}</>
  }

  return <img src={resolvedSrc} alt={alt} className={className} />
}

export function CompanySelectorButtonPreview({
  companyName,
  logoUrl,
  darkMode,
}: {
  companyName: string
  logoUrl?: string | null
  darkMode: boolean
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-3 shadow-sm",
        darkMode ? "border-zinc-800 bg-zinc-950" : "border-zinc-200 bg-zinc-50",
      )}
    >
      <div
        className={cn(
          "flex h-14 items-center justify-between rounded-lg border px-4",
          darkMode ? "border-zinc-800 bg-zinc-900" : "border-zinc-200 bg-white",
        )}
      >
        <div className="flex min-w-0 flex-1 items-center justify-center overflow-hidden">
          <LogoImage
            src={logoUrl}
            alt={companyName}
            className="block h-8 w-auto max-w-full object-contain"
            fallback={<BrandLogo width={164} height={40} className="h-8 w-auto max-w-full" />}
          />
        </div>
        <ChevronDown className={cn("ml-3 h-4 w-4 shrink-0", darkMode ? "text-zinc-400" : "text-zinc-500")} />
      </div>
    </div>
  )
}

export function CompanyDropdownPreview({
  companyName,
  logoUrl,
  darkMode,
}: {
  companyName: string
  logoUrl?: string | null
  darkMode: boolean
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-3 shadow-sm",
        darkMode ? "border-zinc-800 bg-zinc-950" : "border-zinc-200 bg-zinc-50",
      )}
    >
      <div
        className={cn(
          "min-w-0 rounded-lg border",
          darkMode ? "border-zinc-800 bg-zinc-900" : "border-zinc-200 bg-white",
        )}
      >
        <div className="border-b px-3 py-2 text-xs text-muted-foreground">
          Alternar Visualização
        </div>
        <div className="space-y-1 p-2">
          <div className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-primary">
            <div className="flex h-7 w-7 items-center justify-center rounded-md border border-primary/30 bg-primary/10">
              <Globe className="h-4 w-4" />
            </div>
            Todas as Empresas
          </div>

          {["Exemplo 1", "Exemplo 2", "Exemplo 3"].map((label, index) => (
            <div
              key={label}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-2 text-sm",
                index === 0 ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-md border",
                  darkMode ? "border-zinc-800 bg-zinc-950" : "border-zinc-200 bg-zinc-50",
                )}
              >
                {index === 0 ? (
                  <LogoImage
                    src={logoUrl}
                    alt={companyName}
                    className="h-4 w-4 object-contain"
                    fallback={<Logo size={20} className="h-4 w-4" />}
                  />
                ) : (
                  <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function CompanyMapPinPreview({
  companyName,
  logoUrl,
  totem,
  darkMode,
}: {
  companyName: string
  logoUrl?: string | null
  totem?: boolean
  darkMode: boolean
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-3 shadow-sm",
        darkMode ? "border-zinc-800 bg-zinc-950" : "border-zinc-200 bg-zinc-50",
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-lg border p-4",
          darkMode ? "border-zinc-800 bg-zinc-900" : "border-zinc-200 bg-white",
        )}
      >
        <div className="grid grid-cols-6 gap-px bg-border/30 p-px">
          {Array.from({ length: 24 }).map((_, index) => (
            <div
              key={index}
              className={cn(
                "h-8 rounded-[2px]",
                darkMode ? "bg-zinc-900" : "bg-zinc-50",
              )}
            />
          ))}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <LogoImage
            src={logoUrl}
            alt={companyName}
            className="max-h-24 max-w-24 object-contain"
            fallback={<Logo size={64} className="h-14 w-14 opacity-70" />}
          />
        </div>
        <div className="absolute right-3 bottom-3 rounded-md bg-black/70 px-2 py-1 text-[11px] text-white">
          {totem ? "Totem" : "Ponto"}
        </div>
      </div>
    </div>
  )
}
