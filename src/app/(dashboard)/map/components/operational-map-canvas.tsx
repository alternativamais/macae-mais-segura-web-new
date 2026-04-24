"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api"
import { Loader2, MapPinned } from "lucide-react"
import { MapMarkerOverlay } from "@/components/maps/map-marker-overlay"
import { resolveMapPinUrl } from "@/lib/company-map-pin"
import { useTranslator } from "@/lib/i18n"
import { GOOGLE_MAPS_LOADER_ID } from "@/lib/google-maps-loader"
import { OperationalMapMarker } from "@/types/map"
import { getMapDefaultCenter } from "./utils"

interface OperationalMapCanvasProps {
  markers: OperationalMapMarker[]
  selectedMarkerId: number | null
  showPoints: boolean
  onSelectMarker: (markerId: number) => void
}

const mapContainerStyle = {
  width: "100%",
  height: "100%",
}

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  fullscreenControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  clickableIcons: false,
  gestureHandling: "greedy",
  styles: [
    { featureType: "poi", stylers: [{ visibility: "off" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] },
    { featureType: "administrative", elementType: "labels.text.fill", stylers: [{ color: "#475569" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#dbe4ee" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#dbeafe" }] },
    { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#f8fafc" }] },
  ],
}

function buildMarkerSvg(fill: string, stroke: string) {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="44" height="54" viewBox="0 0 44 54" fill="none">
      <path d="M22 53C22 53 40 34.652 40 21C40 11.059 31.941 3 22 3C12.059 3 4 11.059 4 21C4 34.652 22 53 22 53Z" fill="${fill}" stroke="${stroke}" stroke-width="4"/>
      <circle cx="22" cy="21" r="7" fill="white"/>
    </svg>
  `
}

function buildMarkerStyle(url: string, size: number): React.CSSProperties {
  return {
    width: size,
    height: size,
    backgroundImage: `url("${url}")`,
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "contain",
  }
}

export function OperationalMapCanvas({
  markers,
  selectedMarkerId,
  showPoints,
  onSelectMarker,
}: OperationalMapCanvasProps) {
  const t = useTranslator("operational_map")
  const mapRef = useRef<google.maps.Map | null>(null)
  const [mapsReady, setMapsReady] = useState(false)

  const { isLoaded, loadError } = useJsApiLoader({
    id: GOOGLE_MAPS_LOADER_ID,
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  })

  const visibleMarkers = useMemo(
    () => (showPoints ? markers : []),
    [markers, showPoints],
  )

  useEffect(() => {
    if (!mapRef.current || !isLoaded || !mapsReady) {
      return
    }

    const map = mapRef.current

    const targets = visibleMarkers.map((marker) => marker.position)

    if (!targets.length) {
      map.panTo(getMapDefaultCenter())
      map.setZoom(13)
      return
    }

    if (targets.length === 1) {
      map.panTo(targets[0])
      map.setZoom(15)
      return
    }

    const bounds = new google.maps.LatLngBounds()
    targets.forEach((target) => bounds.extend(target))
    map.fitBounds(bounds, 72)
  }, [isLoaded, mapsReady, visibleMarkers])

  const pointIcon = useMemo(() => {
    if (!isLoaded || !window.google?.maps) return undefined

    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(buildMarkerSvg("#f97316", "#7c2d12"))}`,
      scaledSize: new window.google.maps.Size(44, 54),
      anchor: new window.google.maps.Point(22, 54),
    }
  }, [isLoaded])

  const selectedPointIcon = useMemo(() => {
    if (!isLoaded || !window.google?.maps) return undefined

    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(buildMarkerSvg("#111827", "#f59e0b"))}`,
      scaledSize: new window.google.maps.Size(50, 60),
      anchor: new window.google.maps.Point(25, 60),
    }
  }, [isLoaded])

  const standalonePointIcon = useMemo(() => {
    if (!isLoaded || !window.google?.maps) return undefined

    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(buildMarkerSvg("#0f766e", "#134e4a"))}`,
      scaledSize: new window.google.maps.Size(44, 54),
      anchor: new window.google.maps.Point(22, 54),
    }
  }, [isLoaded])

  const resolveMarkerIcon = (marker: OperationalMapMarker) => {
    if (!isLoaded || !window.google?.maps) {
      return undefined
    }

    const isSelected = marker.id === selectedMarkerId
    const companyPinUrl = resolveMapPinUrl(marker.point)

    if (companyPinUrl) {
      const size = isSelected ? 58 : 52

      return {
        url: companyPinUrl,
        scaledSize: new window.google.maps.Size(size, size),
        anchor: new window.google.maps.Point(size / 2, size),
      }
    }

    return isSelected
      ? selectedPointIcon
      : marker.point.totem?.id
        ? pointIcon
        : standalonePointIcon
  }

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center px-6 text-center">
        <MapPinned className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="font-medium">{t("map_missing_key_title")}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t("map_missing_key_desc")}</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center px-6 text-center">
        <MapPinned className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="font-medium">{t("map_load_error_title")}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t("map_load_error_desc")}</p>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("loading")}
        </span>
      </div>
    )
  }

  return (
    <div className="h-full min-h-0">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={getMapDefaultCenter()}
        zoom={13}
        options={mapOptions}
        onLoad={(map) => {
          mapRef.current = map
          setMapsReady(true)
        }}
        onUnmount={() => {
          mapRef.current = null
          setMapsReady(false)
        }}
      >
        {visibleMarkers.map((marker) => {
          const hasTotem = Boolean(marker.point.totem?.id)
          const isSelected = marker.id === selectedMarkerId
          const icon = resolveMarkerIcon(marker)
          const iconUrl = typeof icon?.url === "string" ? icon.url : null
          const width = icon?.scaledSize?.width ?? (isSelected ? 50 : 44)
          const height = icon?.scaledSize?.height ?? (isSelected ? 60 : 54)

          return (
            <MapMarkerOverlay
              key={`point-${marker.id}`}
              position={marker.position}
              title={marker.point.nome}
              zIndex={isSelected ? 20 : hasTotem ? 12 : 8}
              onClick={() => onSelectMarker(marker.id)}
            >
              <div
                className="cursor-pointer transition-transform hover:scale-[1.03]"
                style={
                  iconUrl
                    ? {
                        ...buildMarkerStyle(iconUrl, width),
                        width,
                        height,
                      }
                    : undefined
                }
              />
            </MapMarkerOverlay>
          )
        })}
      </GoogleMap>
    </div>
  )
}
