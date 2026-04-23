"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Activity, Camera, KeyRound, Send } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { TableLoadingOverlay } from "@/app/(dashboard)/access-control/components/table-loading-overlay"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { integrationService } from "@/services/integration.service"
import { MODAL_EXIT_DURATION_MS } from "@/lib/modal"
import { Integration, IntegrationCameraBinding, IntegrationCameraDetails } from "@/types/integration"
import { useTranslator } from "@/lib/i18n"
import {
  countActiveBindings,
  countActiveTokens,
  countConfiguredCameras,
  formatDirectionFilter,
  getCameraLocationLabel,
  getIntegrationBadgeVariant,
} from "./utils"

interface IntegrationDetailsDialogProps {
  integration: Integration | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function MetricsRow({
  configured,
  active,
  tokens,
  available,
}: {
  configured: number
  active: number
  tokens: number
  available: number
}) {
  const t = useTranslator("plate_sending.details.metrics")

  const metrics = [
    { title: t("configured"), value: configured, icon: Camera },
    { title: t("active"), value: active, icon: Activity },
    { title: t("tokens"), value: tokens, icon: KeyRound },
    { title: t("available"), value: available, icon: Send },
  ]

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <div key={metric.title} className="rounded-lg border bg-muted/20 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">{metric.title}</p>
            <metric.icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 text-2xl font-semibold">{metric.value}</p>
        </div>
      ))}
    </div>
  )
}

function ConfiguredCameraCard({ binding }: { binding: IntegrationCameraBinding }) {
  const t = useTranslator("plate_sending.details")
  const cameraName =
    binding.camera?.nome || t("camera_name_fallback", { id: binding.cameraId })
  const fallback = t("not_informed")
  const activeToken = binding.tokens?.find((token) => !token.revoked) ?? null

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">{cameraName}</p>
          <p className="text-sm text-muted-foreground">
            {getCameraLocationLabel(binding.camera, fallback)}
          </p>
        </div>
        <Badge variant={binding.active ? "default" : "secondary"}>
          {binding.active ? t("statuses.active") : t("statuses.inactive")}
        </Badge>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs text-muted-foreground">{t("fields.direction")}</p>
          <p className="text-sm font-medium">
            {t(`directions.${formatDirectionFilter(binding.directionFilter).toLowerCase()}`)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t("fields.cod_cet")}</p>
          <p className="text-sm font-medium">{binding.codCet || fallback}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t("fields.cod_cet_obverse")}</p>
          <p className="text-sm font-medium">{binding.codCetObverse || fallback}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t("fields.cod_cet_reverse")}</p>
          <p className="text-sm font-medium">{binding.codCetReverse || fallback}</p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-xs text-muted-foreground">{t("fields.token")}</p>
          <p className="text-sm font-medium">
            {activeToken?.tokenPreview || t("token_unavailable")}
          </p>
        </div>
      </div>
    </div>
  )
}

export function IntegrationDetailsDialog({
  integration,
  open,
  onOpenChange,
}: IntegrationDetailsDialogProps) {
  const t = useTranslator("plate_sending.details")
  const [details, setDetails] = useState<IntegrationCameraDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState("")

  const loadDetails = useCallback(async (code: string) => {
    setIsLoading(true)
    setLoadError("")

    try {
      const response = await integrationService.getIntegrationCameraDetails(code)
      setDetails(response)
    } catch {
      setDetails(null)
      setLoadError(t("load_error"))
    } finally {
      setIsLoading(false)
    }
  }, [t])

  useEffect(() => {
    if (!open || !integration?.code) {
      return
    }

    void loadDetails(integration.code)
  }, [integration?.code, loadDetails, open])

  useEffect(() => {
    if (open) return

    const timeout = window.setTimeout(() => {
      setDetails(null)
      setLoadError("")
      setIsLoading(false)
    }, MODAL_EXIT_DURATION_MS)

    return () => window.clearTimeout(timeout)
  }, [open])

  const configured = useMemo(
    () => details?.configured ?? [],
    [details],
  )

  const metrics = useMemo(() => {
    return {
      configured: countConfiguredCameras(configured),
      active: countActiveBindings(configured),
      tokens: countActiveTokens(configured),
      available: details?.availableCameras.length ?? 0,
    }
  }, [configured, details?.availableCameras.length])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[88vh] flex-col overflow-hidden sm:max-w-5xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle>{integration?.name || t("title")}</DialogTitle>
            {integration ? (
              <Badge variant={getIntegrationBadgeVariant(integration.enabled)}>
                {integration.enabled ? t("enabled") : t("disabled")}
              </Badge>
            ) : null}
          </div>
          <DialogDescription>
            {integration?.description || t("description")}
          </DialogDescription>
        </DialogHeader>

        <div className="relative flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
          {isLoading ? <TableLoadingOverlay /> : null}

          <MetricsRow
            configured={metrics.configured}
            active={metrics.active}
            tokens={metrics.tokens}
            available={metrics.available}
          />

          <div className="grid min-h-0 gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
            <Card className="min-h-0">
              <CardHeader>
                <CardTitle>{t("overview_title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground">{t("fields.code")}</p>
                  <p className="font-medium">{integration?.code?.toUpperCase() || t("not_informed")}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">{t("fields.name")}</p>
                  <p className="font-medium">{integration?.name || t("not_informed")}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">{t("fields.description_label")}</p>
                  <p className="font-medium">{integration?.description || t("not_informed")}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">{t("fields.status")}</p>
                  <p className="font-medium">
                    {integration?.enabled ? t("enabled") : t("disabled")}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/20 p-4">
                  <p className="text-sm font-medium">{t("available_cameras_title")}</p>
                  <p className="mt-1 text-2xl font-semibold">{metrics.available}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("available_cameras_desc")}
                  </p>
                </div>

                {loadError ? (
                  <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                    {loadError}
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="min-h-0 overflow-hidden">
              <CardHeader>
                <CardTitle>{t("configured_title")}</CardTitle>
              </CardHeader>
              <CardContent className="min-h-0">
                {configured.length > 0 ? (
                  <div className="max-h-[52vh] space-y-3 overflow-y-auto pr-1">
                    {configured.map((binding) => (
                      <ConfiguredCameraCard key={binding.id} binding={binding} />
                    ))}
                  </div>
                ) : (
                  <div className="flex min-h-[220px] items-center justify-center rounded-lg border-2 border-dashed bg-muted/30 px-6 text-center text-sm text-muted-foreground">
                    {t("empty_configured")}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
