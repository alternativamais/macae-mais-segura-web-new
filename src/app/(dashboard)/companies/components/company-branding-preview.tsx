"use client"

import Image from "next/image"
import type { ReactNode } from "react"
import { ChevronDown, Globe, LayoutGrid, Loader2, MapPinned } from "lucide-react"
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api"
import { MapMarkerOverlay } from "@/components/maps/map-marker-overlay"
import { BrandLogo, Logo } from "@/components/logo"
import { resolveCompanyLogoUrl } from "@/lib/company-logo"
import { cn } from "@/lib/utils"
import { GOOGLE_MAPS_LOADER_ID } from "@/lib/google-maps-loader"

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

  return (
    <Image
      src={resolvedSrc}
      alt={alt}
      width={256}
      height={128}
      unoptimized
      className={className}
      style={{ width: "auto", height: "auto" }}
    />
  )
}

const PIN_PREVIEW_CENTER = {
  lat: -22.33259,
  lng: -41.752212,
}

const pinMapOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: false,
  fullscreenControl: false,
  streetViewControl: false,
  mapTypeControl: false,
  clickableIcons: false,
  gestureHandling: "none",
  draggable: false,
  scrollwheel: false,
  disableDoubleClickZoom: true,
}

function CompanyMapPinCanvas({
  companyName,
  logoUrl,
  compact = false,
}: {
  companyName: string
  logoUrl?: string | null
  compact?: boolean
}) {
  const resolvedSrc = resolveCompanyLogoUrl(logoUrl)
  const { isLoaded, loadError } = useJsApiLoader({
    id: GOOGLE_MAPS_LOADER_ID,
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  })

  if (!resolvedSrc) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        Sem imagem
      </div>
    )
  }

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || loadError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
        <MapPinned className={cn(compact ? "h-5 w-5" : "h-6 w-6")} />
        {!compact ? <span className="text-xs">Mapa indisponível</span> : null}
      </div>
    )
  }

  if (!isLoaded || !window.google?.maps) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <Loader2 className={cn("animate-spin", compact ? "h-4 w-4" : "h-5 w-5")} />
      </div>
    )
  }

  const size = compact ? 34 : 48

  return (
    <GoogleMap
      mapContainerStyle={{ width: "100%", height: "100%" }}
      center={PIN_PREVIEW_CENTER}
      zoom={16}
      options={pinMapOptions}
    >
      <MapMarkerOverlay
        position={PIN_PREVIEW_CENTER}
        title={companyName}
      >
        <div
          style={{
            width: size,
            height: size,
            backgroundImage: `url("${resolvedSrc}")`,
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "contain",
          }}
        />
      </MapMarkerOverlay>
    </GoogleMap>
  )
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
          darkMode
            ? "border-zinc-800 bg-[#171717]"
            : "border-zinc-200 bg-white shadow-sm",
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
        <ChevronDown
          className={cn(
            "ml-3 h-4 w-4 shrink-0",
            darkMode ? "text-zinc-500" : "text-zinc-400",
          )}
        />
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
          darkMode
            ? "border-zinc-700 bg-[#1b1b1d]"
            : "border-zinc-200 bg-white shadow-sm",
        )}
      >
        <div
          className={cn(
            "border-b px-3 py-2 text-xs",
            darkMode
              ? "border-zinc-700 text-zinc-400"
              : "border-zinc-200 text-zinc-500",
          )}
        >
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
                index === 0
                  ? darkMode
                    ? "text-zinc-200"
                    : "text-zinc-900"
                  : darkMode
                    ? "text-zinc-500"
                    : "text-zinc-500",
              )}
            >
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-md border",
                  darkMode
                    ? "border-zinc-700 bg-zinc-950"
                    : "border-zinc-200 bg-zinc-50",
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
  compact = false,
}: {
  companyName: string
  logoUrl?: string | null
  totem?: boolean
  darkMode: boolean
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        compact ? "h-full w-full overflow-hidden rounded-lg" : "h-full w-full overflow-hidden rounded-xl",
        darkMode ? "border-zinc-800 bg-zinc-950" : "border-zinc-200 bg-zinc-50",
      )}
    >
      <div
        className={cn(
          compact
            ? "relative h-full overflow-hidden"
            : "relative h-full overflow-hidden",
          darkMode
            ? "bg-[#171717]"
            : "bg-white",
        )}
      >
        <div className={cn(compact ? "h-full min-h-24" : "h-64")}>
          <CompanyMapPinCanvas
            companyName={companyName}
            logoUrl={logoUrl}
            compact={compact}
          />
        </div>
        <div
          className={cn(
            "absolute rounded-md bg-black/70 text-white",
            compact
              ? "right-2 bottom-2 px-1.5 py-0.5 text-[10px]"
              : "right-3 bottom-3 px-2 py-1 text-[11px]",
          )}
        >
          {totem ? "Totem" : "Ponto"}
        </div>
      </div>
    </div>
  )
}
