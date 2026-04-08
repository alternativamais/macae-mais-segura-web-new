"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { CircleF, GoogleMap, MarkerF, useJsApiLoader } from "@react-google-maps/api"
import { Loader2, MapPin, MousePointerClick, Radius, TimerReset } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { GOOGLE_MAPS_LOADER_ID } from "@/lib/google-maps-loader"
import { useTranslator } from "@/lib/i18n"
import {
  formatPointCoordinates,
  type PointCoordinates,
} from "@/app/(dashboard)/administration/points/components/utils"

interface LocalityMapSelection {
  coordinates: string
  radiusKm: number
  maxLocationAgeMinutes: number
}

interface LocalityMapPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialCoordinates?: PointCoordinates | null
  initialRadiusKm?: number
  initialMaxLocationAgeMinutes?: number
  onConfirm: (selection: LocalityMapSelection) => void
}

const DEFAULT_CENTER = { lat: -22.376534, lng: -41.794399 }

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

export function LocalityMapPickerDialog({
  open,
  onOpenChange,
  initialCoordinates,
  initialRadiusKm = 2,
  initialMaxLocationAgeMinutes = 120,
  onConfirm,
}: LocalityMapPickerDialogProps) {
  const t = useTranslator("notification_center.localities.form.map_picker")
  const mapRef = useRef<google.maps.Map | null>(null)
  const [selectedPosition, setSelectedPosition] = useState<PointCoordinates | null>(
    initialCoordinates || null,
  )
  const [radiusKm, setRadiusKm] = useState(initialRadiusKm)
  const [maxLocationAgeMinutes, setMaxLocationAgeMinutes] = useState(
    initialMaxLocationAgeMinutes,
  )

  const { isLoaded, loadError } = useJsApiLoader({
    id: GOOGLE_MAPS_LOADER_ID,
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  })

  useEffect(() => {
    if (!open) return

    setSelectedPosition(initialCoordinates || null)
    setRadiusKm(initialRadiusKm)
    setMaxLocationAgeMinutes(initialMaxLocationAgeMinutes)
  }, [initialCoordinates, initialMaxLocationAgeMinutes, initialRadiusKm, open])

  const center = useMemo(
    () => selectedPosition || initialCoordinates || DEFAULT_CENTER,
    [initialCoordinates, selectedPosition],
  )

  const radiusMeters = useMemo(() => {
    return Number.isFinite(radiusKm) && radiusKm > 0 ? radiusKm * 1000 : 0
  }, [radiusKm])

  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    if (!event.latLng) return

    setSelectedPosition({
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    })
  }

  const handleConfirm = () => {
    if (!selectedPosition) return

    onConfirm({
      coordinates: formatPointCoordinates(selectedPosition),
      radiusKm,
      maxLocationAgeMinutes,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-hidden sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
          <div className="flex h-[360px] flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/30 px-6 text-center">
            <MapPin className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium">{t("missing_key_title")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("missing_key_desc")}</p>
          </div>
        ) : loadError ? (
          <div className="flex h-[360px] flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/30 px-6 text-center">
            <MapPin className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium">{t("load_error_title")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("load_error_desc")}</p>
          </div>
        ) : !isLoaded ? (
          <div className="flex h-[360px] items-center justify-center rounded-xl border bg-muted/20 text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("loading")}
            </span>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.95fr)]">
            <Card className="gap-0 overflow-hidden py-0">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b bg-muted/20 px-4 py-3">
                <div className="space-y-1">
                  <div className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                    {t("map_title")}
                  </div>
                  <div className="inline-flex items-center gap-2 text-sm text-foreground">
                    <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                    {t("instructions")}
                  </div>
                </div>

                <div className="rounded-md border bg-background px-3 py-1.5 text-xs text-muted-foreground">
                  {selectedPosition
                    ? formatPointCoordinates(selectedPosition)
                    : t("no_selection")}
                </div>
              </div>

              <CardContent className="px-0">
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={center}
                  zoom={selectedPosition ? 15 : 13}
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
                    <>
                      <MarkerF position={selectedPosition} />
                      {radiusMeters > 0 ? (
                        <CircleF
                          center={selectedPosition}
                          radius={radiusMeters}
                          options={{
                            fillColor: "#f97316",
                            fillOpacity: 0.14,
                            strokeColor: "#ea580c",
                            strokeOpacity: 0.9,
                            strokeWeight: 2,
                            clickable: false,
                          }}
                        />
                      ) : null}
                    </>
                  ) : null}
                </GoogleMap>
              </CardContent>
            </Card>

            <Card className="gap-0 overflow-hidden py-0">
              <div className="border-b bg-muted/20 px-4 py-3">
                <div className="text-sm font-medium">{t("settings_title")}</div>
                <div className="text-xs text-muted-foreground">{t("settings_desc")}</div>
              </div>

              <CardContent className="space-y-4 p-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("labels.coordinates")}</label>
                  <div>
                    <Input
                      value={selectedPosition ? formatPointCoordinates(selectedPosition) : ""}
                      readOnly
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <label className="text-sm font-medium">{t("labels.radius")}</label>
                      <div className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-xs text-muted-foreground">
                        <Radius className="h-3.5 w-3.5" />
                        {radiusKm.toFixed(1)} km
                      </div>
                    </div>
                    <Slider
                      min={0.5}
                      max={20}
                      step={0.5}
                      value={[radiusKm]}
                      onValueChange={(values) => setRadiusKm(values[0] ?? radiusKm)}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <label className="text-sm font-medium">{t("labels.max_age")}</label>
                      <div className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-xs text-muted-foreground">
                        <TimerReset className="h-3.5 w-3.5" />
                        {maxLocationAgeMinutes} min
                      </div>
                    </div>
                    <Slider
                      min={5}
                      max={1440}
                      step={5}
                      value={[maxLocationAgeMinutes]}
                      onValueChange={(values) =>
                        setMaxLocationAgeMinutes(values[0] ?? maxLocationAgeMinutes)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
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
            disabled={!selectedPosition || !radiusMeters || !maxLocationAgeMinutes}
            className="cursor-pointer"
          >
            {t("buttons.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
