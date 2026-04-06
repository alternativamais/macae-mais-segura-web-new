"use client"

import { useEffect, useMemo, useState } from "react"
import { Camera, Loader2, Power, RadioTower, Thermometer, Video } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { smartSwitchService } from "@/services/smart-switch.service"
import { totemService } from "@/services/totem.service"
import { SmartSwitchPowerState } from "@/types/smart-switch"
import { Totem } from "@/types/totem"
import { OperationalMapMarker } from "@/types/map"
import { CameraStreamTile } from "./camera-stream-tile"
import {
  formatRelativePointStatus,
  getPointReference,
  getPreviewCameras,
  getPrimarySmartSwitch,
} from "./utils"
import { useTranslator } from "@/lib/i18n"

interface PointPreviewDialogProps {
  open: boolean
  marker: OperationalMapMarker | null
  onOpenChange: (open: boolean) => void
}

export function PointPreviewDialog({
  open,
  marker,
  onOpenChange,
}: PointPreviewDialogProps) {
  const t = useTranslator("operational_map.preview")
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState("")
  const [totemDetails, setTotemDetails] = useState<Totem | null>(null)
  const [switchState, setSwitchState] = useState<SmartSwitchPowerState>("unknown")
  const [switchLoading, setSwitchLoading] = useState(false)

  useEffect(() => {
    if (!open || !marker?.point.totem?.id) {
      setTotemDetails(null)
      setLoadError("")
      setIsLoading(false)
      return
    }

    let disposed = false
    setIsLoading(true)
    setLoadError("")

    void totemService
      .findOne(marker.point.totem.id)
      .then((response) => {
        if (disposed) return
        setTotemDetails(response)
      })
      .catch(() => {
        if (disposed) return
        setLoadError(t("errors.load_totem"))
      })
      .finally(() => {
        if (!disposed) {
          setIsLoading(false)
        }
      })

    return () => {
      disposed = true
    }
  }, [marker?.point.totem?.id, open, t])

  const smartSwitch = useMemo(() => getPrimarySmartSwitch(totemDetails), [totemDetails])
  const cameras = useMemo(() => {
    if (!marker) return []
    return getPreviewCameras(marker.point, totemDetails)
  }, [marker, totemDetails])

  useEffect(() => {
    if (!open || !smartSwitch?.id) {
      setSwitchState("unknown")
      setSwitchLoading(false)
      return
    }

    let disposed = false
    setSwitchLoading(true)

    void smartSwitchService
      .getPowerState(smartSwitch.id)
      .then((response) => {
        if (disposed) return
        setSwitchState(response.on ? "on" : "off")
      })
      .catch(() => {
        if (disposed) return
        setSwitchState("offline")
      })
      .finally(() => {
        if (!disposed) {
          setSwitchLoading(false)
        }
      })

    return () => {
      disposed = true
    }
  }, [open, smartSwitch?.id])

  const handleToggleSmartSwitch = async () => {
    if (!smartSwitch?.id) {
      return
    }

    setSwitchLoading(true)

    try {
      const response = await smartSwitchService.togglePower(smartSwitch.id)
      setSwitchState(response.on ? "on" : "off")
      toast.success(t("notifications.switch_toggle_success"))
    } catch (error) {
      setSwitchState("offline")
      toast.apiError(error, t("notifications.switch_toggle_error"))
    } finally {
      setSwitchLoading(false)
    }
  }

  const point = marker?.point ?? null
  const title = point?.totem?.numero
    ? t("title_totem", { value: point.totem.numero })
    : point?.nome || t("title_point_fallback")

  const summaryCards = point
    ? [
        {
          title: t("summary.reference"),
          value: getPointReference(point, t("not_informed")),
          icon: RadioTower,
        },
        {
          title: t("summary.cameras"),
          value: String(cameras.length),
          icon: Video,
        },
        {
          title: t("summary.smart_switch"),
          value: smartSwitch?.nome || t("summary.unavailable"),
          icon: Power,
        },
        {
          title: t("summary.climate"),
          value: String(point.totem?.devices?.climateEquipments ?? 0),
          icon: Thermometer,
        },
      ]
    : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {point
              ? t("description", {
                  value: getPointReference(point, t("not_informed")),
                })
              : t("empty")}
          </DialogDescription>
        </DialogHeader>

        {!marker || !point ? (
          <div className="rounded-lg border-2 border-dashed bg-muted/30 px-6 py-10 text-center text-sm text-muted-foreground">
            {t("empty")}
          </div>
        ) : (
          <ScrollArea className="max-h-[75vh] pr-4">
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {summaryCards.map((card) => (
                  <Card key={card.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                      <card.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm font-semibold">{card.value}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
                <Card>
                  <CardHeader>
                    <CardTitle>{t("details.title")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="space-y-1">
                      <p className="text-muted-foreground">{t("details.point_name")}</p>
                      <p className="font-medium">{point.nome || t("not_informed")}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">{t("details.reference")}</p>
                      <p className="font-medium">
                        {getPointReference(point, t("not_informed"))}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">{t("details.coordinates")}</p>
                      <p className="font-medium">{point.coordenadas || t("not_informed")}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">{t("details.status")}</p>
                      <Badge variant="secondary">
                        {formatRelativePointStatus(
                          point.status,
                          t("status.active"),
                          t("status.inactive"),
                        )}
                      </Badge>
                    </div>

                    {point.totem?.numero ? (
                      <div className="space-y-1">
                        <p className="text-muted-foreground">{t("details.totem")}</p>
                        <p className="font-medium">{point.totem.numero}</p>
                      </div>
                    ) : null}

                    <div className="space-y-2 rounded-lg border bg-muted/20 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{t("details.smart_switch_title")}</p>
                          <p className="text-xs text-muted-foreground">
                            {smartSwitch?.nome || t("details.smart_switch_unavailable")}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {switchLoading
                            ? t("switch.verifying")
                            : switchState === "on"
                              ? t("switch.on")
                              : switchState === "off"
                                ? t("switch.off")
                                : switchState === "offline"
                                  ? t("switch.offline")
                                  : t("switch.unknown")}
                        </Badge>
                      </div>

                      <Button
                        type="button"
                        onClick={() => void handleToggleSmartSwitch()}
                        disabled={!smartSwitch?.id || switchLoading}
                        className="w-full cursor-pointer"
                        variant={switchState === "on" ? "destructive" : "default"}
                      >
                        {switchLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t("switch.processing")}
                          </>
                        ) : switchState === "on" ? (
                          t("switch.turn_off")
                        ) : (
                          t("switch.turn_on")
                        )}
                      </Button>
                    </div>

                    {isLoading ? (
                      <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t("loading")}
                      </div>
                    ) : null}

                    {loadError ? (
                      <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                        {loadError}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t("cameras.title")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {cameras.length > 0 ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        {cameras.map((camera) => (
                          <CameraStreamTile key={camera.id} camera={camera} />
                        ))}
                      </div>
                    ) : (
                      <div className="flex min-h-[240px] items-center justify-center rounded-lg border-2 border-dashed bg-muted/30 px-6 text-center text-sm text-muted-foreground">
                        {t("cameras.empty")}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}
