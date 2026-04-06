"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { GoogleMap, MarkerF, useJsApiLoader } from "@react-google-maps/api"
import { Loader2, MapPinned, MousePointerClick } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PointCoordinates, formatPointCoordinates } from "./utils"
import { useTranslator } from "@/lib/i18n"

interface PointMapPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialCoordinates?: PointCoordinates | null
  onConfirm: (coordinates: string) => void
}

const DEFAULT_CENTER = { lat: -22.376534, lng: -41.794399 }

const mapContainerStyle = {
  width: "100%",
  height: "60vh",
}

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  fullscreenControl: true,
  streetViewControl: false,
  mapTypeControl: true,
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

export function PointMapPickerDialog({
  open,
  onOpenChange,
  initialCoordinates,
  onConfirm,
}: PointMapPickerDialogProps) {
  const t = useTranslator("points.form.map_picker")
  const mapRef = useRef<google.maps.Map | null>(null)
  const [selectedPosition, setSelectedPosition] = useState<PointCoordinates | null>(
    initialCoordinates || null,
  )

  const { isLoaded, loadError } = useJsApiLoader({
    id: "alternativa-base-google-maps-point-picker",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  })

  useEffect(() => {
    if (!open) {
      return
    }

    setSelectedPosition(initialCoordinates || null)
  }, [initialCoordinates, open])

  const center = useMemo(() => {
    return selectedPosition || initialCoordinates || DEFAULT_CENTER
  }, [initialCoordinates, selectedPosition])

  useEffect(() => {
    if (!mapRef.current || !selectedPosition) {
      return
    }

    mapRef.current.panTo(selectedPosition)
  }, [selectedPosition])

  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    if (!event.latLng) {
      return
    }

    setSelectedPosition({
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    })
  }

  const handleMarkerDragEnd = (event: google.maps.MapMouseEvent) => {
    if (!event.latLng) {
      return
    }

    setSelectedPosition({
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    })
  }

  const handleConfirm = () => {
    if (!selectedPosition) {
      return
    }

    onConfirm(formatPointCoordinates(selectedPosition))
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/30 px-6 text-center">
            <MapPinned className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium">{t("missing_key_title")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("missing_key_desc")}
            </p>
          </div>
        ) : loadError ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/30 px-6 text-center">
            <MapPinned className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium">{t("load_error_title")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("load_error_desc")}
            </p>
          </div>
        ) : !isLoaded ? (
          <div className="flex min-h-[360px] items-center justify-center rounded-xl border bg-muted/20 text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("loading")}
            </span>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/20 px-4 py-3">
              <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <MousePointerClick className="h-4 w-4" />
                {t("instructions")}
              </div>
              <div className="rounded-md border bg-background px-3 py-1.5 text-xs text-muted-foreground">
                {selectedPosition
                  ? formatPointCoordinates(selectedPosition)
                  : t("no_selection")}
              </div>
            </div>

            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={center}
              zoom={selectedPosition ? 16 : 13}
              options={mapOptions}
              onClick={handleMapClick}
              onLoad={(map) => {
                mapRef.current = map
              }}
              onUnmount={() => {
                mapRef.current = null
              }}
            >
              {selectedPosition ? (
                <MarkerF
                  position={selectedPosition}
                  draggable
                  onDragEnd={handleMarkerDragEnd}
                />
              ) : null}
            </GoogleMap>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="cursor-pointer"
          >
            {t("buttons.cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedPosition || !isLoaded || !!loadError}
            className="cursor-pointer"
          >
            {t("buttons.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
