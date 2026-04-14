"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  Camera,
  ChevronDown,
  ChevronUp,
  Code2,
  Loader2,
  RefreshCcw,
  Zap,
} from "lucide-react"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { useTranslator } from "@/lib/i18n"
import { formatLocalizedDateTime } from "@/lib/i18n/date"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { IntegrationCameraSummary, PlateCameraConfig } from "@/types/integration"
import { integrationService } from "@/services/integration.service"
import { getCameraLocationLabel } from "./utils"
import { PresetManager } from "./preset-manager"
import { FieldMappingRow } from "./field-mapping-row"
import { JsonEditorModal } from "./json-editor-modal"

interface PlateCameraConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  camera: IntegrationCameraSummary | null
  onSuccess: () => Promise<void> | void
}

/**
 * Campos do banco lpr_detections que o usuário pode mapear.
 * label = nome amigável, field = nome da coluna.
 */
const DB_FIELDS_BASIC = [
  { field: "plateText", labelKey: "db_fields.plate_text" },
  { field: "confidence", labelKey: "db_fields.confidence" },
  { field: "detectedAt", labelKey: "db_fields.detected_at" },
  { field: "direction", labelKey: "db_fields.direction" },
  { field: "deviceId", labelKey: "db_fields.device_id" },
]

const DB_FIELDS_ADVANCED = [
  { field: "plateColor", labelKey: "db_fields.plate_color" },
  { field: "vehicleColor", labelKey: "db_fields.vehicle_color" },
  { field: "vehicleType", labelKey: "db_fields.vehicle_type" },
  { field: "vehicleBrand", labelKey: "db_fields.vehicle_brand" },
  { field: "plateType", labelKey: "db_fields.plate_type" },
  { field: "region", labelKey: "db_fields.region" },
  { field: "channel", labelKey: "db_fields.channel" },
  { field: "isExist", labelKey: "db_fields.is_exist" },
  { field: "snapAddress", labelKey: "db_fields.snap_address" },
  { field: "vehicleSeries", labelKey: "db_fields.vehicle_series" },
]

export function PlateCameraConfigDialog({
  open,
  onOpenChange,
  camera,
  onSuccess,
}: PlateCameraConfigDialogProps) {
  const t = useTranslator("plate_sending")
  const locale = t.getLocale()
  const [config, setConfig] = useState<PlateCameraConfig | null>(null)
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [isEnabled, setIsEnabled] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isArming, setIsArming] = useState(false)
  const [isJsonEditorOpen, setIsJsonEditorOpen] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const locationLabel = useMemo(
    () => getCameraLocationLabel(camera, t("shared.not_informed")),
    [camera, t],
  )

  const hasSample = Boolean(config?.samplePayload)

  const loadConfig = useCallback(async () => {
    if (!camera?.id) return

    setIsLoading(true)

    try {
      const response = await integrationService.getPlateCameraConfig(camera.id)
      setConfig(response)
      setIsEnabled(response.enabled)
      setMapping(response.saveMapping && typeof response.saveMapping === "object"
        ? response.saveMapping as unknown as Record<string, string>
        : {})
    } catch (error) {
      setConfig(null)
      toast.apiError(error, t("studio.cameras.notifications.load_config_error"))
    } finally {
      setIsLoading(false)
    }
  }, [camera?.id, t])

  useEffect(() => {
    if (!open || !camera?.id) return
    void loadConfig()
  }, [camera?.id, loadConfig, open])

  useEffect(() => {
    if (open) return

    setConfig(null)
    setIsLoading(false)
    setIsSaving(false)
    setIsArming(false)
    setMapping({})
    setShowAdvanced(false)
  }, [open])

  const handleSave = async () => {
    if (!camera?.id) return

    setIsSaving(true)

    try {
      const response = await integrationService.updatePlateCameraConfig(camera.id, {
        enabled: isEnabled,
        saveMapping: JSON.stringify(mapping, null, 2),
      })
      setConfig(response)
      setMapping(response.saveMapping && typeof response.saveMapping === "object"
        ? response.saveMapping as unknown as Record<string, string>
        : {})
      toast.success(t("studio.cameras.notifications.save_success"))
      await onSuccess()
    } catch (error) {
      toast.apiError(error, t("studio.cameras.notifications.save_error"))
    } finally {
      setIsSaving(false)
    }
  }

  const handleArmCapture = async () => {
    if (!camera?.id) return

    setIsArming(true)

    try {
      await integrationService.armPlateCameraCapture(camera.id)
      toast.success(t("studio.cameras.notifications.arm_success"))
      await loadConfig()
      await onSuccess()
    } catch (error) {
      toast.apiError(error, t("studio.cameras.notifications.arm_error"))
    } finally {
      setIsArming(false)
    }
  }

  const handleLoadPreset = (presetMapping: Record<string, string>) => {
    setMapping(presetMapping)
  }

  const handleFieldMappingChange = (field: string, newPath: string) => {
    setMapping((current) => {
      const next = { ...current }
      if (!newPath) {
        delete next[field]
      } else {
        next[field] = newPath
      }
      return next
    })
  }

  const handleJsonSave = (val: string) => {
    try {
      const parsed = JSON.parse(val)
      if (typeof parsed === "object" && parsed !== null) {
        setMapping(parsed as Record<string, string>)
      }
    } catch {
      toast.error(t("studio.cameras.notifications.mapping_invalid"))
    }
  }

  const mappingText = useMemo(() => JSON.stringify(mapping, null, 2), [mapping])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("studio.cameras.dialog.title")}</DialogTitle>
          <DialogDescription>
            {t("studio.cameras.dialog.description")}
          </DialogDescription>
        </DialogHeader>

        {/* Camera info card */}
        <div className="rounded-lg border bg-muted/20 p-4 text-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">
                  {camera?.nome || t("management.camera_name_fallback", { id: camera?.id ?? 0 })}
                </p>
              </div>
              <p className="text-muted-foreground">{locationLabel}</p>
              <p className="text-muted-foreground">
                {camera?.ip || t("shared.not_informed")}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {config?.captureNextRequest ? (
                <Badge variant="secondary">
                  {t("studio.cameras.status.capture_armed")}
                </Badge>
              ) : null}
              {config?.lastSampledAt ? (
                <Badge variant="outline">
                  {t("studio.cameras.status.last_sampled", {
                    date: formatLocalizedDateTime(new Date(config.lastSampledAt), locale),
                  })}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>

        {/* Enable toggle */}
        <div className="flex items-center justify-between rounded-lg border bg-card p-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">{t("studio.cameras.form.enabled")}</p>
            <p className="text-sm text-muted-foreground">
              {t("studio.cameras.form.enabled_help")}
            </p>
          </div>
          <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
        </div>

        {/* Sample section */}
        <div className="rounded-lg border bg-card">
          <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">{t("studio.cameras.form.sample_payload")}</p>
              <p className="text-sm text-muted-foreground">
                {t("studio.cameras.form.sample_payload_help")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={() => void loadConfig()}
                disabled={isLoading}
              >
                <RefreshCcw className="mr-2 h-3.5 w-3.5" />
                {t("actions.reload")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={() => void handleArmCapture()}
                disabled={isArming}
              >
                <Zap className="mr-2 h-3.5 w-3.5" />
                {t("studio.cameras.actions.arm_capture")}
              </Button>
            </div>
          </div>

          <div className="p-4">
            {config?.samplePayload ? (
              <pre className="overflow-x-auto rounded-md border bg-muted/20 p-4 text-xs leading-5 whitespace-pre-wrap break-all max-h-[200px] overflow-y-auto">
                {config.samplePayload}
              </pre>
            ) : (
              <div className="flex items-center gap-3 rounded-lg border-2 border-dashed bg-muted/30 p-6 text-sm text-muted-foreground justify-center">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{t("studio.cameras.empty.no_sample")}</span>
              </div>
            )}
          </div>
        </div>

        {/* DB mapping section — only visible when sample exists */}
        {hasSample ? (
          <div className="rounded-lg border bg-card">
            <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">{t("studio.cameras.form.db_mapping_title")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("studio.cameras.form.db_mapping_help")}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="cursor-pointer"
                  onClick={() => setIsJsonEditorOpen(true)}
                >
                  <Code2 className="mr-2 h-3.5 w-3.5" />
                  JSON
                </Button>
              </div>
            </div>

            <div className="space-y-4 p-4">
              {/* Preset Manager */}
              <PresetManager
                currentMapping={mapping}
                onLoadPreset={handleLoadPreset}
              />

              {/* Basic DB fields */}
              <div className="space-y-2">
                {DB_FIELDS_BASIC.map(({ field, labelKey }) => (
                  <FieldMappingRow
                    key={field}
                    label={t(labelKey)}
                    field={field}
                    value={mapping[field] || ""}
                    catalog={config?.sampleCatalog || []}
                    onChange={handleFieldMappingChange}
                  />
                ))}
              </div>

              {/* Advanced DB fields toggle */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <span className="text-sm">
                  {t("studio.cameras.form.advanced_fields", { count: DB_FIELDS_ADVANCED.length })}
                </span>
                {showAdvanced ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>

              {showAdvanced && (
                <div className="space-y-2 pl-2 border-l-2 border-muted">
                  {DB_FIELDS_ADVANCED.map(({ field, labelKey }) => (
                    <FieldMappingRow
                      key={field}
                      label={t(labelKey)}
                      field={field}
                      value={mapping[field] || ""}
                      catalog={config?.sampleCatalog || []}
                      onChange={handleFieldMappingChange}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            {t("management.form.cancel")}
          </Button>
          <Button
            type="button"
            className="cursor-pointer"
            onClick={() => void handleSave()}
            disabled={isSaving || isLoading}
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isSaving
              ? t("studio.cameras.actions.saving")
              : t("management.form.save")}
          </Button>
        </DialogFooter>

        <JsonEditorModal
          open={isJsonEditorOpen}
          onOpenChange={setIsJsonEditorOpen}
          title={t("studio.cameras.form.db_mapping_title")}
          initialValue={mappingText}
          onSave={handleJsonSave}
        />
      </DialogContent>
    </Dialog>
  )
}
