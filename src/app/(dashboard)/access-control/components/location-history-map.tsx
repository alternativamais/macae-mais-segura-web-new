"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { GoogleMap, MarkerF, PolylineF, useJsApiLoader } from "@react-google-maps/api"
import { Loader2, MapPinned } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslator } from "@/lib/i18n"
import { UserLocationRecord } from "@/types/access-control"
import { formatDateTime } from "./utils"

interface LocationPoint {
  id: number
  latitude: number
  longitude: number
  createdAt: string
}

interface LocationHistoryMapProps {
  records: UserLocationRecord[]
  selectedRecordId?: number | null
  onSelectRecord?: (recordId: number) => void
}

const mapContainerStyle = {
  width: "100%",
  height: "360px",
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

function normalizeRecord(record: UserLocationRecord): LocationPoint | null {
  const latitude =
    typeof record.latitude === "number"
      ? record.latitude
      : Number.parseFloat(String(record.latitude).replace(",", "."))
  const longitude =
    typeof record.longitude === "number"
      ? record.longitude
      : Number.parseFloat(String(record.longitude).replace(",", "."))

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null
  }

  return {
    id: record.id,
    latitude,
    longitude,
    createdAt: record.createdAt,
  }
}

export function LocationHistoryMap({
  records,
  selectedRecordId,
  onSelectRecord,
}: LocationHistoryMapProps) {
  const t = useTranslator("access_control.location_report_dialog")
  const currentLocale = t.getLocale()
  const mapRef = useRef<google.maps.Map | null>(null)
  const [mapsReady, setMapsReady] = useState(false)
  const { isLoaded, loadError } = useJsApiLoader({
    id: "alternativa-base-google-maps",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  })

  const points = useMemo(
    () => records.map(normalizeRecord).filter((point): point is LocationPoint => point !== null),
    [records]
  )

  const center = points[0]
    ? ({ lat: points[0].latitude, lng: points[0].longitude } satisfies google.maps.LatLngLiteral)
    : ({ lat: -22.376534, lng: -41.794399 } satisfies google.maps.LatLngLiteral)

  const path = points.map((point) => ({
    lat: point.latitude,
    lng: point.longitude,
  }))

  useEffect(() => {
    if (!mapRef.current || !isLoaded || !points.length || !mapsReady) return

    const selectedPoint = selectedRecordId
      ? points.find((point) => point.id === selectedRecordId)
      : null

    if (selectedPoint) {
      mapRef.current.panTo({
        lat: selectedPoint.latitude,
        lng: selectedPoint.longitude,
      })
      mapRef.current.setZoom(16)
      return
    }

    const bounds = new google.maps.LatLngBounds()
    points.forEach((point) => {
      bounds.extend({ lat: point.latitude, lng: point.longitude })
    })

    mapRef.current.fitBounds(bounds, 56)
  }, [isLoaded, mapsReady, points, selectedRecordId])

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="flex h-[360px] flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/30 px-6 text-center">
        <MapPinned className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="font-medium">{t("map_missing_key_title")}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("map_missing_key_desc")}
        </p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex h-[360px] flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/30 px-6 text-center">
        <MapPinned className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="font-medium">{t("map_load_error_title")}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("map_load_error_desc")}
        </p>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex h-[360px] items-center justify-center rounded-xl border bg-muted/20 text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("loading_map")}
        </span>
      </div>
    )
  }

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b bg-muted/20 px-4 py-3">
        <div className="space-y-1">
          <div className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
            {t("map_card_title")}
          </div>
          <div className="text-sm text-foreground">
            {t("map_points_count", { count: points.length })}
          </div>
        </div>

        {points[0] ? (
          <div className="rounded-md border bg-background px-3 py-1.5 text-xs text-muted-foreground">
            {t("map_last_point")}: {formatDateTime(points[0].createdAt, currentLocale)}
          </div>
        ) : null}
      </div>

      <CardContent className="px-0">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
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
          {path.length > 1 ? (
            <PolylineF
              path={path}
              options={{
                strokeColor: "#0f172a",
                strokeOpacity: 0.75,
                strokeWeight: 4,
              }}
            />
          ) : null}

          {points.map((point, index) => {
            const isSelected = selectedRecordId === point.id
            const isLast = index === 0

            return (
              <MarkerF
                key={point.id}
                position={{ lat: point.latitude, lng: point.longitude }}
                onClick={() => onSelectRecord?.(point.id)}
                title={`${formatDateTime(point.createdAt, currentLocale)} • ${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)}`}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  fillColor: isSelected ? "#111827" : isLast ? "#0f766e" : "#2563eb",
                  fillOpacity: 1,
                  strokeColor: "#ffffff",
                  strokeOpacity: 1,
                  strokeWeight: isSelected ? 3 : 2,
                  scale: isSelected ? 9 : isLast ? 7 : 6,
                }}
              />
            )
          })}
        </GoogleMap>
      </CardContent>
    </Card>
  )
}
