"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  ArrowUpDown,
  EllipsisVertical,
  KeyRound,
  Pencil,
  Play,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
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
import { Switch } from "@/components/ui/switch"
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
import { integrationService } from "@/services/integration.service"
import { Integration, IntegrationCameraBinding, IntegrationCameraDetails, IntegrationCameraSummary } from "@/types/integration"
import { IntegrationCameraFormDialog } from "./integration-camera-form-dialog"
import { IntegrationLogsDialog } from "./integration-logs-dialog"
import { IntegrationTabStatCards } from "./integration-tab-stat-cards"
import { IntegrationTestDialog } from "./integration-test-dialog"
import { IntegrationTokensDialog } from "./integration-tokens-dialog"
import {
  buildAvailableSearchIndex,
  buildConfiguredSearchIndex,
  countActiveBindings,
  countActiveTokens,
  countConfiguredCameras,
  formatDirectionFilter,
  getCameraLocationLabel,
  getCameraTokenCount,
  getDirectionalIdentifier,
} from "./utils"

interface IntegrationManagementTabProps {
  integration: Integration
}

function getIntegrationIdentifierLabel(code: string, t: ReturnType<typeof useTranslator>) {
  return code.trim().toLowerCase() === "prf"
    ? t("integration_specs.prf.identifier_label")
    : t("integration_specs.pmrj.identifier_label")
}

function getIntegrationIdentifierHelper(code: string, t: ReturnType<typeof useTranslator>) {
  return code.trim().toLowerCase() === "prf"
    ? t("integration_specs.prf.identifier_help")
    : t("integration_specs.pmrj.identifier_help")
}

function getDirectionLabel(direction: string | null | undefined, t: ReturnType<typeof useTranslator>) {
  return t(`management.direction_values.${formatDirectionFilter(direction).toLowerCase()}`)
}

export function IntegrationManagementTab({
  integration,
}: IntegrationManagementTabProps) {
  const t = useTranslator("plate_sending")
  const currentLocale = t.getLocale()
  const { hasPermission } = useHasPermission()
  const isCustomIntegration = integration.driver === "custom_webhook"

  const canManage = hasPermission("configurar_integracao")
  const canRead = hasPermission("listar_integracoes")
  const identifierLabel = getIntegrationIdentifierLabel(integration.code, t)
  const identifierHelper = isCustomIntegration
    ? t("management.custom_identifier_helper")
    : getIntegrationIdentifierHelper(integration.code, t)
  const notInformed = t("shared.not_informed")

  const [details, setDetails] = useState<IntegrationCameraDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [tabValue, setTabValue] = useState("configured")
  const [configuredSearchTerm, setConfiguredSearchTerm] = useState("")
  const [availableSearchTerm, setAvailableSearchTerm] = useState("")
  const [configuredPage, setConfiguredPage] = useState(1)
  const [configuredPageSize, setConfiguredPageSize] = useState(10)
  const [availablePage, setAvailablePage] = useState(1)
  const [availablePageSize, setAvailablePageSize] = useState(10)
  const [togglingCameraId, setTogglingCameraId] = useState<number | null>(null)

  const [selectedAvailableCamera, setSelectedAvailableCamera] = useState<IntegrationCameraSummary | null>(null)
  const [editingBinding, setEditingBinding] = useState<IntegrationCameraBinding | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const [tokensBinding, setTokensBinding] = useState<IntegrationCameraBinding | null>(null)
  const [isTokensOpen, setIsTokensOpen] = useState(false)
  const [logsBinding, setLogsBinding] = useState<IntegrationCameraBinding | null>(null)
  const [isLogsOpen, setIsLogsOpen] = useState(false)
  const [testBinding, setTestBinding] = useState<IntegrationCameraBinding | null>(null)
  const [isTestOpen, setIsTestOpen] = useState(false)
  const [bindingToDelete, setBindingToDelete] = useState<IntegrationCameraBinding | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadDetails = useCallback(async () => {
    setIsLoading(true)

    try {
      const response = await integrationService.listCameras(integration.code)
      setDetails(response)
    } catch (error) {
      setDetails(null)
      toast.apiError(error, t("management.notifications.load_error"))
    } finally {
      setIsLoading(false)
    }
  }, [integration.code, t])

  useEffect(() => {
    void loadDetails()
  }, [loadDetails])

  useEffect(() => {
    setConfiguredPage(1)
  }, [configuredSearchTerm, configuredPageSize])

  useEffect(() => {
    setAvailablePage(1)
  }, [availableSearchTerm, availablePageSize])

  const configuredItems = details?.configured ?? []
  const availableItems = details?.availableCameras ?? []

  const configuredMetrics = useMemo(
    () => ({
      configuredCount: countConfiguredCameras(configuredItems),
      availableCount: availableItems.length,
      activeCount: countActiveBindings(configuredItems),
      activeTokensCount: countActiveTokens(configuredItems),
    }),
    [availableItems.length, configuredItems],
  )

  const filteredConfiguredItems = useMemo(() => {
    const normalizedSearch = configuredSearchTerm.trim().toLowerCase()
    if (!normalizedSearch) return configuredItems

    return configuredItems.filter((binding) =>
      buildConfiguredSearchIndex(binding, notInformed).includes(normalizedSearch),
    )
  }, [configuredItems, configuredSearchTerm, notInformed])

  const filteredAvailableItems = useMemo(() => {
    const normalizedSearch = availableSearchTerm.trim().toLowerCase()
    if (!normalizedSearch) return availableItems

    return availableItems.filter((camera) =>
      buildAvailableSearchIndex(camera, notInformed).includes(normalizedSearch),
    )
  }, [availableItems, availableSearchTerm, notInformed])

  const paginatedConfiguredItems = useMemo(() => {
    const startIndex = (configuredPage - 1) * configuredPageSize
    return filteredConfiguredItems.slice(
      startIndex,
      startIndex + configuredPageSize,
    )
  }, [configuredPage, configuredPageSize, filteredConfiguredItems])

  const paginatedAvailableItems = useMemo(() => {
    const startIndex = (availablePage - 1) * availablePageSize
    return filteredAvailableItems.slice(startIndex, startIndex + availablePageSize)
  }, [availablePage, availablePageSize, filteredAvailableItems])

  const handleToggleActive = async (binding: IntegrationCameraBinding) => {
    setTogglingCameraId(binding.cameraId)

    try {
      await integrationService.updateCamera(integration.code, binding.cameraId, {
        active: !binding.active,
      })
      toast.success(
        binding.active
          ? t("management.notifications.deactivated")
          : t("management.notifications.activated"),
      )
      await loadDetails()
    } catch (error) {
      toast.apiError(error, t("management.notifications.toggle_error"))
    } finally {
      setTogglingCameraId(null)
    }
  }

  const handleDelete = async () => {
    if (!bindingToDelete) return

    setIsDeleting(true)

    try {
      await integrationService.removeCamera(integration.code, bindingToDelete.cameraId)
      toast.success(t("management.notifications.remove_success"))
      await loadDetails()
      setIsDeleteDialogOpen(false)
    } catch (error) {
      toast.apiError(error, t("management.notifications.remove_error"))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-semibold">{integration.name}</h3>
              <Badge variant={integration.enabled ? "default" : "secondary"}>
                {integration.enabled
                  ? t("statuses.active")
                  : t("statuses.inactive")}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {integration.description || t("description_fallback")}
            </p>
            <div className="flex flex-wrap gap-2 pt-2 text-xs text-muted-foreground">
              <span className="rounded-md border bg-muted/20 px-2 py-1">
                {t("management.meta.identifier_prefix")}: {isCustomIntegration
                  ? t("management.meta.identifier_custom")
                  : identifierLabel}
              </span>
              <span className="rounded-md border bg-muted/20 px-2 py-1">
                {t("management.meta.direction_prefix")}: {t("management.meta.direction_value")}
              </span>
              <span className="rounded-md border bg-muted/20 px-2 py-1">
                {t("management.meta.tokens_prefix")}: {t("management.meta.tokens_value")}
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            onClick={() => void loadDetails()}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            {t("actions.reload")}
          </Button>
        </div>
      </div>

      <IntegrationTabStatCards
        configuredCount={configuredMetrics.configuredCount}
        availableCount={configuredMetrics.availableCount}
        activeCount={configuredMetrics.activeCount}
        activeTokensCount={configuredMetrics.activeTokensCount}
        isLoading={isLoading}
      />

      <Tabs value={tabValue} onValueChange={setTabValue} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="configured">
            {t("management.tabs.configured", { count: configuredItems.length })}
          </TabsTrigger>
          <TabsTrigger value="available">
            {t("management.tabs.available", { count: availableItems.length })}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configured" className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("management.search_configured_placeholder")}
                value={configuredSearchTerm}
                onChange={(event) => setConfiguredSearchTerm(event.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="relative rounded-md border bg-card">
            {isLoading ? <TableLoadingOverlay /> : null}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("management.table.columns.camera")}</TableHead>
                  <TableHead>{t("management.table.columns.ip")}</TableHead>
                  <TableHead>{t("management.table.columns.location")}</TableHead>
                  {!isCustomIntegration ? <TableHead>{identifierLabel}</TableHead> : null}
                  <TableHead>{t("management.table.columns.active")}</TableHead>
                  <TableHead>{t("management.table.columns.tokens")}</TableHead>
                  <TableHead className="hidden xl:table-cell">
                    {t("management.table.columns.updated_at")}
                  </TableHead>
                  <TableHead className="w-[80px] text-right">
                    {t("management.table.columns.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedConfiguredItems.length > 0 ? (
                  paginatedConfiguredItems.map((binding) => (
                    <TableRow key={binding.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {binding.camera?.nome || t("management.camera_name_fallback", { id: binding.cameraId })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {t("management.table.direction_label")}: {getDirectionLabel(binding.directionFilter, t)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{binding.camera?.ip || notInformed}</TableCell>
                      <TableCell>{getCameraLocationLabel(binding.camera, notInformed)}</TableCell>
                      {!isCustomIntegration ? (
                        <TableCell>
                          {formatDirectionFilter(binding.directionFilter) === "ALL" ? (
                            <div className="space-y-1 text-sm">
                              <div>
                                <span className="text-muted-foreground">
                                  {t("management.direction_values.obverse")}:
                                </span>{" "}
                                {getDirectionalIdentifier(binding, "OBVERSE")}
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  {t("management.direction_values.reverse")}:
                                </span>{" "}
                                {getDirectionalIdentifier(binding, "REVERSE")}
                              </div>
                            </div>
                          ) : (
                            <span>{getDirectionalIdentifier(binding, formatDirectionFilter(binding.directionFilter))}</span>
                          )}
                        </TableCell>
                      ) : null}
                      <TableCell>
                        <Switch
                          checked={binding.active}
                          disabled={!canManage || togglingCameraId === binding.cameraId}
                          onCheckedChange={() => void handleToggleActive(binding)}
                          aria-label={t("management.table.toggle_active")}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant={getCameraTokenCount(binding) > 0 ? "default" : "secondary"}>
                          {t("management.table.active_tokens", {
                            count: getCameraTokenCount(binding),
                          })}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        {binding.updatedAt
                          ? formatLocalizedDateTime(new Date(binding.updatedAt), currentLocale)
                          : notInformed}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="cursor-pointer">
                              <EllipsisVertical className="h-4 w-4" />
                              <span className="sr-only">
                                {t("management.table.open_actions")}
                              </span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!isCustomIntegration ? (
                              <DropdownMenuItem
                                onClick={() => {
                                  setTestBinding(binding)
                                  setIsTestOpen(true)
                                }}
                              >
                                <Play className="mr-2 h-4 w-4" />
                                {t("management.actions.monitor")}
                              </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuItem
                              disabled={!canManage}
                              onClick={() => {
                                setEditingBinding(binding)
                                setSelectedAvailableCamera(null)
                                setIsFormOpen(true)
                              }}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              {isCustomIntegration
                                ? t("management.actions.edit_binding")
                                : t("management.actions.edit_identifier")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setTokensBinding(binding)
                                setIsTokensOpen(true)
                              }}
                            >
                              <KeyRound className="mr-2 h-4 w-4" />
                              {t("management.actions.manage_tokens")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setLogsBinding(binding)
                                setIsLogsOpen(true)
                              }}
                            >
                              <ArrowUpDown className="mr-2 h-4 w-4" />
                              {t("management.actions.view_logs")}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              disabled={!canManage}
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                setBindingToDelete(binding)
                                setIsDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t("management.actions.remove")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={isCustomIntegration ? 7 : 8} className="h-32 text-center text-muted-foreground">
                      {isLoading
                        ? t("loading")
                        : t("management.empty_configured")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <TablePaginationFooter
            total={filteredConfiguredItems.length}
            page={configuredPage}
            pageSize={configuredPageSize}
            onPageChange={setConfiguredPage}
            onPageSizeChange={setConfiguredPageSize}
          />
        </TabsContent>

        <TabsContent value="available" className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("management.search_available_placeholder")}
                value={availableSearchTerm}
                onChange={(event) => setAvailableSearchTerm(event.target.value)}
                className="pl-9"
              />
            </div>

            <p className="text-sm text-muted-foreground">
              {identifierHelper}
            </p>
          </div>

          <div className="relative rounded-md border bg-card">
            {isLoading ? <TableLoadingOverlay /> : null}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("management.table.columns.camera")}</TableHead>
                  <TableHead>{t("management.table.columns.ip")}</TableHead>
                  <TableHead>{t("management.table.columns.location")}</TableHead>
                  <TableHead className="w-[120px] text-right">
                    {t("management.table.columns.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedAvailableItems.length > 0 ? (
                  paginatedAvailableItems.map((camera) => (
                    <TableRow key={camera.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{camera.nome || notInformed}</div>
                          <div className="text-xs text-muted-foreground">
                            {integration.code.toUpperCase()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{camera.ip || notInformed}</TableCell>
                      <TableCell>{getCameraLocationLabel(camera, notInformed)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          size="sm"
                          className="cursor-pointer"
                          disabled={!canManage}
                          onClick={() => {
                            setSelectedAvailableCamera(camera)
                            setEditingBinding(null)
                            setIsFormOpen(true)
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          {t("management.actions.add")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                      {isLoading
                        ? t("loading")
                        : t("management.empty_available")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <TablePaginationFooter
            total={filteredAvailableItems.length}
            page={availablePage}
            pageSize={availablePageSize}
            onPageChange={setAvailablePage}
            onPageSizeChange={setAvailablePageSize}
          />
        </TabsContent>
      </Tabs>

      <IntegrationCameraFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        integration={integration}
        camera={selectedAvailableCamera}
        binding={editingBinding}
        onSuccess={async () => {
          await loadDetails()
          setTabValue("configured")
        }}
      />

      <IntegrationTokensDialog
        open={isTokensOpen}
        onOpenChange={setIsTokensOpen}
        integration={integration}
        binding={tokensBinding}
        canManage={canManage}
        onSuccess={loadDetails}
      />

      <IntegrationLogsDialog
        open={isLogsOpen}
        onOpenChange={setIsLogsOpen}
        integration={integration}
        binding={logsBinding}
      />

      {!isCustomIntegration ? (
        <IntegrationTestDialog
          open={isTestOpen}
          onOpenChange={setIsTestOpen}
          integration={integration}
          binding={testBinding}
        />
      ) : null}

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title={t("management.delete_dialog.title")}
        description={t("management.delete_dialog.description", {
          camera: bindingToDelete?.camera?.nome || t("management.camera_name_fallback", { id: bindingToDelete?.cameraId || 0 }),
        })}
        confirmText={t("management.delete_dialog.confirm")}
        cancelText={t("management.delete_dialog.cancel")}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  )
}
