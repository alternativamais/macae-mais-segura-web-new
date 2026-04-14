"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  ArrowRight,
  EllipsisVertical,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Settings2,
  Trash2,
  Zap,
} from "lucide-react"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { useTranslator } from "@/lib/i18n"
import { formatLocalizedDateTime } from "@/lib/i18n/date"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { TableLoadingOverlay } from "@/app/(dashboard)/access-control/components/table-loading-overlay"
import { TablePaginationFooter } from "@/app/(dashboard)/access-control/components/table-pagination-footer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useHasPermission } from "@/hooks/use-has-permission"
import { cameraService } from "@/services/camera.service"
import { integrationService } from "@/services/integration.service"
import { Integration, IntegrationCameraSummary, PlateCameraConfig } from "@/types/integration"
import { CustomIntegrationFormDialog } from "./custom-integration-form-dialog"
import { PlateCameraConfigDialog } from "./plate-camera-config-dialog"
import { getCameraLocationLabel } from "./utils"

interface ConfigurableStudioTabProps {
  integrations: Integration[]
  isLoadingIntegrations?: boolean
  onReloadIntegrations: () => Promise<void> | void
}

function isCustomIntegration(integration: Integration) {
  return integration.driver === "custom_webhook" || integration.editable === true
}

export function ConfigurableStudioTab({
  integrations,
  isLoadingIntegrations = false,
  onReloadIntegrations,
}: ConfigurableStudioTabProps) {
  const t = useTranslator("plate_sending")
  const locale = t.getLocale()
  const router = useRouter()
  const pathname = usePathname()
  const { hasPermission } = useHasPermission()
  const canManage = hasPermission("configurar_integracao")

  const [tabValue, setTabValue] = useState("integrations")

  const [integrationSearch, setIntegrationSearch] = useState("")
  const [cameraSearch, setCameraSearch] = useState("")
  const [integrationPage, setIntegrationPage] = useState(1)
  const [integrationPageSize, setIntegrationPageSize] = useState(10)
  const [cameraPage, setCameraPage] = useState(1)
  const [cameraPageSize, setCameraPageSize] = useState(10)

  const [cameras, setCameras] = useState<IntegrationCameraSummary[]>([])
  const [isLoadingCameras, setIsLoadingCameras] = useState(true)
  const [cameraConfigs, setCameraConfigs] = useState<Record<number, PlateCameraConfig>>({})
  const [loadingCameraIds, setLoadingCameraIds] = useState<number[]>([])

  const [formIntegration, setFormIntegration] = useState<Integration | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [integrationToDelete, setIntegrationToDelete] = useState<Integration | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [selectedCamera, setSelectedCamera] = useState<IntegrationCameraSummary | null>(null)
  const [isCameraConfigOpen, setIsCameraConfigOpen] = useState(false)

  const customIntegrations = useMemo(
    () => integrations.filter(isCustomIntegration),
    [integrations],
  )

  const loadCameras = useCallback(async () => {
    setIsLoadingCameras(true)

    try {
      const response = await cameraService.findAll({ page: 1, limit: 500 })
      setCameras(
        (response.data || []).map((camera) => ({
          id: camera.id,
          nome: camera.nome,
          ip: camera.ip,
          status: camera.status,
          ponto: camera.ponto,
          totem: camera.totem,
        })),
      )
    } catch (error) {
      setCameras([])
      toast.apiError(error, t("studio.cameras.notifications.load_error"))
    } finally {
      setIsLoadingCameras(false)
    }
  }, [t])

  useEffect(() => {
    void loadCameras()
  }, [loadCameras])

  useEffect(() => {
    setIntegrationPage(1)
  }, [integrationPageSize, integrationSearch])

  useEffect(() => {
    setCameraPage(1)
  }, [cameraPageSize, cameraSearch])

  const filteredIntegrations = useMemo(() => {
    const normalizedSearch = integrationSearch.trim().toLowerCase()
    if (!normalizedSearch) return customIntegrations

    return customIntegrations.filter((integration) =>
      [integration.name, integration.code, integration.description, integration.endpointUrl]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    )
  }, [customIntegrations, integrationSearch])

  const paginatedIntegrations = useMemo(() => {
    const startIndex = (integrationPage - 1) * integrationPageSize
    return filteredIntegrations.slice(startIndex, startIndex + integrationPageSize)
  }, [filteredIntegrations, integrationPage, integrationPageSize])

  const filteredCameras = useMemo(() => {
    const normalizedSearch = cameraSearch.trim().toLowerCase()
    if (!normalizedSearch) return cameras

    return cameras.filter((camera) =>
      [camera.nome, camera.ip, camera.totem?.numero, camera.totem?.ponto?.pontoDeReferencia, camera.ponto?.pontoDeReferencia]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    )
  }, [cameraSearch, cameras])

  const paginatedCameras = useMemo(() => {
    const startIndex = (cameraPage - 1) * cameraPageSize
    return filteredCameras.slice(startIndex, startIndex + cameraPageSize)
  }, [cameraPage, cameraPageSize, filteredCameras])

  const loadCameraConfigs = useCallback(
    async (cameraIds: number[]) => {
      if (cameraIds.length === 0) return

      setLoadingCameraIds((current) => Array.from(new Set([...current, ...cameraIds])))

      const results = await Promise.all(
        cameraIds.map(async (cameraId) => {
          try {
            return await integrationService.getPlateCameraConfig(cameraId)
          } catch {
            return null
          }
        }),
      )

      setCameraConfigs((current) => {
        const next = { ...current }
        results.forEach((result) => {
          if (result) {
            next[result.cameraId] = result
          }
        })
        return next
      })

      setLoadingCameraIds((current) => current.filter((id) => !cameraIds.includes(id)))
    },
    [],
  )

  useEffect(() => {
    const idsToLoad = paginatedCameras
      .map((camera) => camera.id)
      .filter((cameraId) => !cameraConfigs[cameraId])

    if (idsToLoad.length === 0) return
    void loadCameraConfigs(idsToLoad)
  }, [cameraConfigs, loadCameraConfigs, paginatedCameras])

  const handleDeleteIntegration = async () => {
    if (!integrationToDelete) return

    setIsDeleting(true)

    try {
      await integrationService.removeIntegration(integrationToDelete.code)
      toast.success(t("studio.integrations.notifications.delete_success"))
      await onReloadIntegrations()
      setIsDeleteDialogOpen(false)
    } catch (error) {
      toast.apiError(error, t("studio.integrations.notifications.delete_error"))
    } finally {
      setIsDeleting(false)
    }
  }

  const handleArmCapture = async (cameraId: number) => {
    try {
      await integrationService.armPlateCameraCapture(cameraId)
      toast.success(t("studio.cameras.notifications.arm_success"))
      await loadCameraConfigs([cameraId])
    } catch (error) {
      toast.apiError(error, t("studio.cameras.notifications.arm_error"))
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-4">
        <div className="flex flex-col gap-2">
          <h3 className="text-xl font-semibold">{t("studio.title")}</h3>
          <p className="text-sm text-muted-foreground">{t("studio.description")}</p>
        </div>
      </div>

      <Tabs value={tabValue} onValueChange={setTabValue} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="integrations">
            {t("studio.tabs.integrations", { count: customIntegrations.length })}
          </TabsTrigger>
          <TabsTrigger value="cameras">
            {t("studio.tabs.cameras", { count: cameras.length })}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("studio.integrations.search_placeholder")}
                value={integrationSearch}
                onChange={(event) => setIntegrationSearch(event.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer"
                onClick={() => void onReloadIntegrations()}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                {t("actions.reload")}
              </Button>
              {canManage ? (
                <Button
                  type="button"
                  className="cursor-pointer"
                  onClick={() => {
                    setFormIntegration(null)
                    setIsFormOpen(true)
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t("studio.integrations.actions.create")}
                </Button>
              ) : null}
            </div>
          </div>

          <div className="relative rounded-md border bg-card">
            {isLoadingIntegrations ? <TableLoadingOverlay /> : null}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("studio.integrations.table.columns.integration")}</TableHead>
                  <TableHead>{t("studio.integrations.table.columns.environment")}</TableHead>
                  <TableHead>{t("studio.integrations.table.columns.endpoint")}</TableHead>
                  <TableHead>{t("studio.integrations.table.columns.status")}</TableHead>
                  <TableHead className="hidden xl:table-cell">
                    {t("studio.integrations.table.columns.updated_at")}
                  </TableHead>
                  <TableHead className="w-[80px] text-right">
                    {t("studio.integrations.table.columns.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedIntegrations.length > 0 ? (
                  paginatedIntegrations.map((integration) => (
                    <TableRow key={integration.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{integration.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {integration.code}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {integration.description || t("description_fallback")}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">{integration.environmentTag || "prod"}</Badge>
                          <Badge variant="secondary">{integration.httpMethod || "POST"}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[320px]">
                        <div className="truncate text-sm text-muted-foreground">
                          {integration.endpointUrl || t("shared.not_informed")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={integration.enabled ? "default" : "secondary"}>
                          {integration.enabled ? t("statuses.active") : t("statuses.inactive")}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                        {integration.updatedAt
                          ? formatLocalizedDateTime(new Date(integration.updatedAt), locale)
                          : t("shared.not_informed")}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="cursor-pointer">
                              <EllipsisVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() =>
                                router.push(`${pathname}/${integration.code.trim().toLowerCase()}`)
                              }
                            >
                              <ArrowRight className="mr-2 h-4 w-4" />
                              {t("studio.integrations.actions.manage_bindings")}
                            </DropdownMenuItem>
                            {canManage ? (
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => {
                                  setFormIntegration(integration)
                                  setIsFormOpen(true)
                                }}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                {t("studio.integrations.actions.edit")}
                              </DropdownMenuItem>
                            ) : null}
                            {canManage ? <DropdownMenuSeparator /> : null}
                            {canManage ? (
                              <DropdownMenuItem
                                className="cursor-pointer text-destructive focus:text-destructive"
                                onClick={() => {
                                  setIntegrationToDelete(integration)
                                  setIsDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t("studio.integrations.actions.delete")}
                              </DropdownMenuItem>
                            ) : null}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      {isLoadingIntegrations ? t("loading") : t("studio.integrations.empty")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <TablePaginationFooter
            total={filteredIntegrations.length}
            page={integrationPage}
            pageSize={integrationPageSize}
            onPageChange={setIntegrationPage}
            onPageSizeChange={setIntegrationPageSize}
          />
        </TabsContent>

        <TabsContent value="cameras" className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("studio.cameras.search_placeholder")}
                value={cameraSearch}
                onChange={(event) => setCameraSearch(event.target.value)}
                className="pl-9"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={() => void loadCameras()}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              {t("actions.reload")}
            </Button>
          </div>

          <div className="relative rounded-md border bg-card">
            {isLoadingCameras ? <TableLoadingOverlay /> : null}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("studio.cameras.table.columns.camera")}</TableHead>
                  <TableHead>{t("studio.cameras.table.columns.location")}</TableHead>
                  <TableHead>{t("studio.cameras.table.columns.sample")}</TableHead>
                  <TableHead>{t("studio.cameras.table.columns.mapping")}</TableHead>
                  <TableHead>{t("studio.cameras.table.columns.status")}</TableHead>
                  <TableHead className="w-[80px] text-right">
                    {t("studio.cameras.table.columns.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCameras.length > 0 ? (
                  paginatedCameras.map((camera) => {
                    const config = cameraConfigs[camera.id]
                    const isConfigLoading = loadingCameraIds.includes(camera.id)
                    const hasMapping = Boolean(config && Object.keys(config.saveMapping || {}).length > 0)
                    const hasSample = Boolean(config?.samplePayload)

                    return (
                      <TableRow key={camera.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">
                              {camera.nome || t("management.camera_name_fallback", { id: camera.id })}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {camera.ip || t("shared.not_informed")}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getCameraLocationLabel(camera, t("shared.not_informed"))}</TableCell>
                        <TableCell>
                          {isConfigLoading ? (
                            <span className="text-sm text-muted-foreground">{t("loading")}</span>
                          ) : config?.captureNextRequest ? (
                            <Badge variant="secondary">{t("studio.cameras.status.capture_armed")}</Badge>
                          ) : hasSample ? (
                            <Badge variant="outline">{t("studio.cameras.status.sample_ready")}</Badge>
                          ) : (
                            <Badge variant="secondary">{t("studio.cameras.status.sample_missing")}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={hasMapping ? "default" : "secondary"}>
                            {hasMapping
                              ? t("studio.cameras.status.mapping_ready")
                              : t("studio.cameras.status.mapping_missing")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={config?.enabled === false ? "secondary" : "default"}>
                            {config?.enabled === false
                              ? t("studio.cameras.status.disabled")
                              : t("studio.cameras.status.enabled")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="cursor-pointer">
                                <EllipsisVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => {
                                  setSelectedCamera(camera)
                                  setIsCameraConfigOpen(true)
                                }}
                              >
                                <Settings2 className="mr-2 h-4 w-4" />
                                {t("studio.cameras.actions.configure")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer"
                                disabled={isConfigLoading}
                                onClick={() => void handleArmCapture(camera.id)}
                              >
                                <Zap className="mr-2 h-4 w-4" />
                                {t("studio.cameras.actions.arm_capture")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      {isLoadingCameras ? t("loading") : t("studio.cameras.not_found")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <TablePaginationFooter
            total={filteredCameras.length}
            page={cameraPage}
            pageSize={cameraPageSize}
            onPageChange={setCameraPage}
            onPageSizeChange={setCameraPageSize}
          />
        </TabsContent>
      </Tabs>

      <CustomIntegrationFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        integration={formIntegration}
        onSuccess={onReloadIntegrations}
      />

      <PlateCameraConfigDialog
        open={isCameraConfigOpen}
        onOpenChange={setIsCameraConfigOpen}
        camera={selectedCamera}
        onSuccess={async () => {
          await loadCameras()
          if (selectedCamera?.id) {
            await loadCameraConfigs([selectedCamera.id])
          }
        }}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title={t("studio.integrations.delete_dialog.title")}
        description={t("studio.integrations.delete_dialog.description", {
          integration: integrationToDelete?.name || integrationToDelete?.code || "-",
        })}
        confirmText={t("studio.integrations.delete_dialog.confirm")}
        cancelText={t("studio.integrations.delete_dialog.cancel")}
        onConfirm={handleDeleteIntegration}
        isLoading={isDeleting}
      />
    </div>
  )
}
