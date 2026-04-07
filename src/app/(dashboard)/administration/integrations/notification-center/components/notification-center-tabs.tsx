"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { GoogleMap, MarkerF, useJsApiLoader } from "@react-google-maps/api"
import { Bell, Eye, Pencil, Plus, RefreshCcw, Send, Trash2, Loader2 } from "lucide-react"
import { useTranslator } from "@/lib/i18n"
import { formatLocalizedDateTime } from "@/lib/i18n/date"
import { parseISO } from "date-fns"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { TableLoadingOverlay } from "@/app/(dashboard)/access-control/components/table-loading-overlay"
import { TablePaginationFooter } from "@/app/(dashboard)/access-control/components/table-pagination-footer"
import { useHasPermission } from "@/hooks/use-has-permission"
import { GOOGLE_MAPS_LOADER_ID } from "@/lib/google-maps-loader"
import { notificationCenterService } from "@/services/notification-center.service"
import {
  NotificationAudience,
  NotificationDetails,
  NotificationDispatchResult,
  NotificationHistoryItem,
  NotificationLocality,
  NotificationSendPayload,
  NotificationTargetType,
  NotificationUserApp,
} from "@/types/notification-center"
import { LocalityFormDialog } from "./locality-form-dialog"
import { NotificationHistoryDetailsDialog } from "./notification-history-details-dialog"
import {
  DEFAULT_MAP_CENTER,
  formatNotificationAudience,
  formatNotificationTarget,
  MAX_AREA_RADIUS_KM,
  MAX_LOCATION_AGE_MINUTES,
  MIN_AREA_RADIUS_KM,
} from "./utils"

const SEND_TAB = "send"
const HISTORY_TAB = "history"

type TabKey = typeof SEND_TAB | typeof HISTORY_TAB

const mapContainerStyle = {
  width: "100%",
  height: "360px",
}

const mapOptions: google.maps.MapOptions = {
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  clickableIcons: false,
  gestureHandling: "greedy",
}

export function NotificationCenterTabs() {
  const t = useTranslator("notification_center")
  const { hasPermission } = useHasPermission()

  const canSend = hasPermission("enviar_notificacao")
  const canViewHistory = hasPermission("listar_notificacoes")
  const canViewLocalities = hasPermission("listar_localidades_notificacao")
  const canManageLocalities = hasPermission("gerenciar_localidades_notificacao")
  const canListUsersApp = hasPermission("listar_usuarios_app")
  const canOpenLocalities = canViewLocalities || canManageLocalities

  const availableTabs = useMemo<TabKey[]>(() => {
    const tabs: TabKey[] = []
    if (canSend) tabs.push(SEND_TAB)
    if (canViewHistory) tabs.push(HISTORY_TAB)
    return tabs
  }, [canSend, canViewHistory])

  const [activeTab, setActiveTab] = useState<TabKey>(availableTabs[0] || SEND_TAB)

  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [dataJson, setDataJson] = useState("")
  const [audience, setAudience] = useState<NotificationAudience>("all")
  const [targetType, setTargetType] = useState<NotificationTargetType>("all")
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [selectedLocalityId, setSelectedLocalityId] = useState("")
  const [centerLat, setCenterLat] = useState(DEFAULT_MAP_CENTER.lat)
  const [centerLng, setCenterLng] = useState(DEFAULT_MAP_CENTER.lng)
  const [radiusKm, setRadiusKm] = useState(2)
  const [maxLocationAgeMinutes, setMaxLocationAgeMinutes] = useState(120)

  const [localities, setLocalities] = useState<NotificationLocality[]>([])
  const [usersApp, setUsersApp] = useState<NotificationUserApp[]>([])
  const [historyItems, setHistoryItems] = useState<NotificationHistoryItem[]>([])
  const [historyTotal, setHistoryTotal] = useState(0)
  const [historyPage, setHistoryPage] = useState(1)
  const [historyPageSize, setHistoryPageSize] = useState(10)
  const [previewData, setPreviewData] = useState<Awaited<
    ReturnType<typeof notificationCenterService.preview>
  > | null>(null)
  const [previewError, setPreviewError] = useState("")
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [sendResult, setSendResult] = useState<NotificationDispatchResult | null>(null)

  const [isSending, setIsSending] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [isLoadingLocalities, setIsLoadingLocalities] = useState(false)
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)

  const [detailsData, setDetailsData] = useState<NotificationDetails | null>(null)
  const [isDetailsLoading, setIsDetailsLoading] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const [editingLocality, setEditingLocality] = useState<NotificationLocality | null>(null)
  const [isLocalitiesDialogOpen, setIsLocalitiesDialogOpen] = useState(false)
  const [isLocalityFormOpen, setIsLocalityFormOpen] = useState(false)
  const [localityToDelete, setLocalityToDelete] = useState<NotificationLocality | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeletingLocality, setIsDeletingLocality] = useState(false)

  const { isLoaded: isMapLoaded, loadError: mapLoadError } = useJsApiLoader({
    id: GOOGLE_MAPS_LOADER_ID,
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  })

  useEffect(() => {
    if (!availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0] || SEND_TAB)
    }
  }, [activeTab, availableTabs])

  const loadLocalities = useCallback(async () => {
    if (!canViewLocalities && !canManageLocalities) return
    setIsLoadingLocalities(true)
    try {
      const data = await notificationCenterService.listLocalities()
      setLocalities(Array.isArray(data) ? data : [])
    } catch (error) {
      toast.apiError(error, t("localities.fetch_error"))
      setLocalities([])
    } finally {
      setIsLoadingLocalities(false)
    }
  }, [canManageLocalities, canViewLocalities, t])

  const loadUsersApp = useCallback(async () => {
    if (!canListUsersApp) return
    setIsLoadingUsers(true)
    try {
      const data = await notificationCenterService.listUsersApp()
      setUsersApp(Array.isArray(data) ? data : [])
    } catch (error) {
      toast.apiError(error, t("send.users_fetch_error"))
      setUsersApp([])
    } finally {
      setIsLoadingUsers(false)
    }
  }, [canListUsersApp, t])

  const loadHistory = useCallback(
    async (page = historyPage, pageSize = historyPageSize) => {
      if (!canViewHistory) return
      setIsLoadingHistory(true)
      try {
        const data = await notificationCenterService.listHistory(page, pageSize)
        setHistoryItems(data.items || [])
        setHistoryTotal(Number(data.meta?.total) || 0)
      } catch (error) {
        toast.apiError(error, t("history.fetch_error"))
        setHistoryItems([])
        setHistoryTotal(0)
      } finally {
        setIsLoadingHistory(false)
      }
    },
    [canViewHistory, historyPage, historyPageSize, t],
  )

  useEffect(() => {
    void loadLocalities()
    void loadHistory()
  }, [loadHistory, loadLocalities])

  useEffect(() => {
    if (targetType === "user" && canListUsersApp && usersApp.length === 0) {
      void loadUsersApp()
    }
  }, [canListUsersApp, loadUsersApp, targetType, usersApp.length])

  const selectedLocality = useMemo(
    () => localities.find((item) => String(item.id) === selectedLocalityId) || null,
    [localities, selectedLocalityId],
  )

  const buildPayload = useCallback((): NotificationSendPayload | null => {
    if (!title.trim() || !body.trim()) return null

    const payload: NotificationSendPayload = {
      title: title.trim(),
      body: body.trim(),
      targetType,
      audience,
    }

    if (dataJson.trim()) {
      try {
        payload.data = JSON.parse(dataJson)
      } catch {
        return null
      }
    }

    if (targetType === "user") {
      if (!selectedUsers.length) return null
      payload.userIds = selectedUsers
    }

    if (targetType === "locality") {
      if (!selectedLocalityId) return null
      payload.localityId = Number(selectedLocalityId)
    }

    if (targetType === "area") {
      if (
        !Number.isFinite(centerLat) ||
        !Number.isFinite(centerLng) ||
        !Number.isFinite(radiusKm) ||
        radiusKm <= 0
      ) {
        return null
      }
      payload.centerLat = centerLat
      payload.centerLng = centerLng
      payload.radiusKm = radiusKm
      payload.maxLocationAgeMinutes = Math.min(
        Math.max(maxLocationAgeMinutes, 1),
        MAX_LOCATION_AGE_MINUTES,
      )
    }

    return payload
  }, [
    audience,
    body,
    centerLat,
    centerLng,
    dataJson,
    maxLocationAgeMinutes,
    radiusKm,
    selectedLocalityId,
    selectedUsers,
    targetType,
    title,
  ])

  const previewPayload = useMemo(() => buildPayload(), [buildPayload])

  useEffect(() => {
    if (!canSend || !previewPayload) {
      setPreviewData(null)
      setPreviewError("")
      return
    }

    const timeout = window.setTimeout(async () => {
      setIsPreviewLoading(true)
      setPreviewError("")
      try {
        const data = await notificationCenterService.preview(previewPayload)
        setPreviewData(data)
      } catch (error) {
        setPreviewData(null)
        setPreviewError(
          (error as { response?: { data?: { message?: string } }; message?: string })?.response
            ?.data?.message ||
            (error as { message?: string })?.message ||
            t("send.preview_error"),
        )
      } finally {
        setIsPreviewLoading(false)
      }
    }, 400)

    return () => window.clearTimeout(timeout)
  }, [canSend, previewPayload, t])

  const handleSend = async () => {
    if (!previewPayload) {
      toast.error(t("send.validation_error"))
      return
    }

    setIsSending(true)
    try {
      const result = await notificationCenterService.send(previewPayload)
      setSendResult(result)
      toast.success(t("send.send_success"))
      setTitle("")
      setBody("")
      setDataJson("")
      setAudience("all")
      setTargetType("all")
      setSelectedUsers([])
      setSelectedLocalityId("")
      setCenterLat(DEFAULT_MAP_CENTER.lat)
      setCenterLng(DEFAULT_MAP_CENTER.lng)
      setRadiusKm(2)
      setMaxLocationAgeMinutes(120)
      void loadHistory(1, historyPageSize)
    } catch (error) {
      toast.apiError(error, t("send.send_error"))
    } finally {
      setIsSending(false)
    }
  }

  const handleOpenDetails = async (id: number) => {
    setIsDetailsOpen(true)
    setIsDetailsLoading(true)
    try {
      const data = await notificationCenterService.getDetails(id)
      setDetailsData(data)
    } catch (error) {
      toast.apiError(error, t("history.details_error"))
      setIsDetailsOpen(false)
    } finally {
      setIsDetailsLoading(false)
    }
  }

  const handleDeleteLocality = async () => {
    if (!localityToDelete) return
    setIsDeletingLocality(true)
    try {
      await notificationCenterService.deleteLocality(localityToDelete.id)
      toast.success(t("localities.delete_success"))
      await loadLocalities()
      setIsDeleteDialogOpen(false)
    } catch (error) {
      toast.apiError(error, t("localities.delete_error"))
    } finally {
      setIsDeletingLocality(false)
    }
  }

  if (availableTabs.length === 0 && !canOpenLocalities) {
    return <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">{t("no_access")}</div>
  }

  return (
    <>
      <div className="space-y-6">
        {availableTabs.length > 0 ? (
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabKey)} className="space-y-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <TabsList>
                {canSend ? <TabsTrigger value={SEND_TAB}>{t("tabs.send")}</TabsTrigger> : null}
                {canViewHistory ? <TabsTrigger value={HISTORY_TAB}>{t("tabs.history")}</TabsTrigger> : null}
              </TabsList>
              <div className="flex flex-wrap items-center justify-end gap-2">
                {activeTab === HISTORY_TAB ? (
                  <Button
                    variant="outline"
                    onClick={() => loadHistory(historyPage, historyPageSize)}
                    disabled={isLoadingHistory}
                  >
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    {t("history.actions.refresh")}
                  </Button>
                ) : null}
                {canOpenLocalities ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsLocalitiesDialogOpen(true)
                      void loadLocalities()
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {t("localities.actions.open_manager")}
                  </Button>
                ) : null}
              </div>
            </div>

            {canSend ? (
              <TabsContent value={SEND_TAB}>
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
              <Card>
                <CardHeader>
                  <CardTitle>{t("send.form_title")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="notification-title">{t("send.labels.title")}</Label>
                      <Input
                        id="notification-title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={t("send.placeholders.title")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("send.labels.audience")}</Label>
                      <Select value={audience} onValueChange={(value) => setAudience(value as NotificationAudience)}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t("send.audience_options.all")}</SelectItem>
                          <SelectItem value="policial">{t("send.audience_options.policial")}</SelectItem>
                          <SelectItem value="cidadao">{t("send.audience_options.cidadao")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notification-body">{t("send.labels.body")}</Label>
                    <Textarea
                      id="notification-body"
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder={t("send.placeholders.body")}
                      className="min-h-28"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>{t("send.labels.target")}</Label>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {([
                        ["all", t("send.target_options.all")],
                        ["user", t("send.target_options.user")],
                        ["locality", t("send.target_options.locality")],
                        ["area", t("send.target_options.area")],
                      ] as const).map(([value, label]) => {
                        const disabled = value === "user" && !canListUsersApp
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => !disabled && setTargetType(value)}
                            className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                              targetType === value
                                ? "border-primary bg-primary/5"
                                : "bg-card hover:bg-muted/30"
                            } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                          >
                            <div className="font-medium">{label}</div>
                          </button>
                        )
                      })}
                    </div>
                    {!canListUsersApp ? (
                      <p className="text-xs text-muted-foreground">{t("send.users_permission_hint")}</p>
                    ) : null}
                  </div>

                  {targetType === "user" ? (
                    <div className="space-y-3">
                      <Label>{t("send.labels.users")}</Label>
                      <div className="rounded-md border bg-card p-3">
                        {isLoadingUsers ? (
                          <div className="text-sm text-muted-foreground">{t("send.loading_users")}</div>
                        ) : (
                          <div className="grid max-h-64 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
                            {usersApp.map((user) => (
                              <label key={user.id} className="flex items-start gap-3 rounded-md border p-3">
                                <Checkbox
                                  checked={selectedUsers.includes(user.id)}
                                  onCheckedChange={(checked) => {
                                    setSelectedUsers((prev) =>
                                      checked ? [...prev, user.id] : prev.filter((item) => item !== user.id),
                                    )
                                  }}
                                />
                                <div className="space-y-1">
                                  <div className="text-sm font-medium">{user.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {user.email || t("shared.not_informed")}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {user.tipo || t("shared.not_informed")}
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {targetType === "locality" ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Label>{t("send.labels.locality")}</Label>
                        {canOpenLocalities ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsLocalitiesDialogOpen(true)
                              void loadLocalities()
                            }}
                          >
                            {t("localities.actions.open_manager")}
                          </Button>
                        ) : null}
                      </div>
                      <Select value={selectedLocalityId} onValueChange={setSelectedLocalityId}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t("send.placeholders.locality")} />
                        </SelectTrigger>
                        <SelectContent>
                          {localities.map((locality) => (
                            <SelectItem key={locality.id} value={String(locality.id)}>
                              {locality.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedLocality ? (
                        <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
                          <div>{selectedLocality.description || t("localities.no_description")}</div>
                          <div className="mt-2">
                            {t("send.locality_summary", {
                              lat: selectedLocality.centerLat,
                              lng: selectedLocality.centerLng,
                              radius: selectedLocality.radiusKm,
                              age: selectedLocality.maxLocationAgeMinutes || 120,
                            })}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {targetType === "area" ? (
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <div className="space-y-2">
                          <Label>{t("send.labels.latitude")}</Label>
                          <Input type="number" step="0.000001" value={centerLat} onChange={(e) => setCenterLat(Number(e.target.value))} />
                        </div>
                        <div className="space-y-2">
                          <Label>{t("send.labels.longitude")}</Label>
                          <Input type="number" step="0.000001" value={centerLng} onChange={(e) => setCenterLng(Number(e.target.value))} />
                        </div>
                        <div className="space-y-2">
                          <Label>{t("send.labels.radius")}</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={radiusKm}
                            onChange={(e) =>
                              setRadiusKm(
                                Math.min(Math.max(Number(e.target.value), MIN_AREA_RADIUS_KM), MAX_AREA_RADIUS_KM),
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{t("send.labels.max_age")}</Label>
                          <Input
                            type="number"
                            step="1"
                            value={maxLocationAgeMinutes}
                            onChange={(e) =>
                              setMaxLocationAgeMinutes(
                                Math.min(
                                  Math.max(Number(e.target.value), 1),
                                  MAX_LOCATION_AGE_MINUTES,
                                ),
                              )
                            }
                          />
                        </div>
                      </div>

                      <div className="overflow-hidden rounded-xl border bg-card">
                        {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
                          <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 px-6 text-center text-muted-foreground">
                            <Bell className="h-10 w-10 opacity-40" />
                            <p>{t("send.map_missing_key")}</p>
                          </div>
                        ) : mapLoadError ? (
                          <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 px-6 text-center text-muted-foreground">
                            <Bell className="h-10 w-10 opacity-40" />
                            <p>{t("send.map_load_error")}</p>
                          </div>
                        ) : !isMapLoaded ? (
                          <div className="flex min-h-[320px] items-center justify-center text-muted-foreground">
                            <span className="inline-flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              {t("send.map_loading")}
                            </span>
                          </div>
                        ) : (
                          <GoogleMap
                            mapContainerStyle={mapContainerStyle}
                            center={{ lat: centerLat, lng: centerLng }}
                            zoom={12}
                            options={mapOptions}
                            onClick={(event) => {
                              const lat = event.latLng?.lat()
                              const lng = event.latLng?.lng()
                              if (!Number.isFinite(lat) || !Number.isFinite(lng)) return
                              setCenterLat(lat as number)
                              setCenterLng(lng as number)
                            }}
                          >
                            <MarkerF
                              position={{ lat: centerLat, lng: centerLng }}
                              draggable
                              onDragEnd={(event) => {
                                const lat = event.latLng?.lat()
                                const lng = event.latLng?.lng()
                                if (!Number.isFinite(lat) || !Number.isFinite(lng)) return
                                setCenterLat(lat as number)
                                setCenterLng(lng as number)
                              }}
                            />
                            {previewData?.activeLocations.map((marker) => (
                              <MarkerF
                                key={marker.userAppId}
                                position={{ lat: marker.lat, lng: marker.lng }}
                                title={marker.name || `#${marker.userAppId}`}
                              />
                            ))}
                          </GoogleMap>
                        )}
                      </div>
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <Label htmlFor="notification-data">{t("send.labels.data")}</Label>
                    <Textarea
                      id="notification-data"
                      value={dataJson}
                      onChange={(e) => setDataJson(e.target.value)}
                      placeholder={t("send.placeholders.data")}
                      className="min-h-24 font-mono text-xs"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button type="button" onClick={handleSend} disabled={isSending || !canSend}>
                      <Send className="mr-2 h-4 w-4" />
                      {t("send.buttons.send")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setTitle("")
                        setBody("")
                        setDataJson("")
                        setAudience("all")
                        setTargetType("all")
                        setSelectedUsers([])
                        setSelectedLocalityId("")
                        setCenterLat(DEFAULT_MAP_CENTER.lat)
                        setCenterLng(DEFAULT_MAP_CENTER.lng)
                        setRadiusKm(2)
                        setMaxLocationAgeMinutes(120)
                        setSendResult(null)
                      }}
                    >
                      <RefreshCcw className="mr-2 h-4 w-4" />
                      {t("send.buttons.reset")}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("send.preview_title")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isPreviewLoading ? (
                    <div className="text-sm text-muted-foreground">{t("send.preview_loading")}</div>
                  ) : previewError ? (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                      {previewError}
                    </div>
                  ) : previewData ? (
                    <div className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg border p-4">
                          <div className="text-xs text-muted-foreground">{t("send.preview_total")}</div>
                          <div className="text-3xl font-semibold">{previewData.totalRecipients}</div>
                        </div>
                        <div className="rounded-lg border p-4">
                          <div className="text-xs text-muted-foreground">{t("send.preview_active_locations")}</div>
                          <div className="text-3xl font-semibold">{previewData.activeLocations.length}</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">
                          {t("send.tipo_labels.policial")}: {previewData.tipoBreakdown.policial}
                        </Badge>
                        <Badge variant="outline">
                          {t("send.tipo_labels.cidadao")}: {previewData.tipoBreakdown.cidadao}
                        </Badge>
                        <Badge variant="outline">
                          {t("send.tipo_labels.outros")}: {previewData.tipoBreakdown.outros}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">
                          {t("send.platform_labels.android")}: {previewData.platformBreakdown.android}
                        </Badge>
                        <Badge variant="outline">
                          {t("send.platform_labels.ios")}: {previewData.platformBreakdown.ios}
                        </Badge>
                        <Badge variant="outline">
                          {t("send.platform_labels.other")}: {previewData.platformBreakdown.other}
                        </Badge>
                        <Badge variant="outline">
                          {t("send.platform_labels.unknown")}: {previewData.platformBreakdown.unknown}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">{t("send.preview_empty")}</div>
                  )}

                  {sendResult ? (
                    <div className="rounded-lg border bg-muted/20 p-4">
                      <div className="mb-3 text-sm font-medium">{t("send.result_title")}</div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Badge variant="outline">{t("send.result_total", { count: sendResult.totalRecipients })}</Badge>
                        <Badge variant="outline">{t("send.result_sent", { count: sendResult.sent })}</Badge>
                        <Badge variant="outline">{t("send.result_failed", { count: sendResult.failed })}</Badge>
                        <Badge variant="outline">{t("send.result_without_token", { count: sendResult.withoutToken })}</Badge>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </div>
              </TabsContent>
            ) : null}

            {canViewHistory ? (
              <TabsContent value={HISTORY_TAB}>
            <div className="space-y-4">
              <div className="relative rounded-md border bg-card">
                {isLoadingHistory ? <TableLoadingOverlay /> : null}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("history.columns.title")}</TableHead>
                      <TableHead>{t("history.columns.target")}</TableHead>
                      <TableHead>{t("history.columns.created_at")}</TableHead>
                      <TableHead className="text-center">{t("history.columns.total")}</TableHead>
                      <TableHead className="text-center">{t("history.columns.sent")}</TableHead>
                      <TableHead className="text-center">{t("history.columns.failed")}</TableHead>
                      <TableHead className="text-center">{t("history.columns.without_token")}</TableHead>
                      <TableHead className="w-[80px] text-right">{t("history.columns.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyItems.length > 0 ? (
                      historyItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">{item.title}</div>
                              <div className="text-xs text-muted-foreground">
                                {formatNotificationAudience(item.audience, (key) => t(key))}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{formatNotificationTarget(item, (key) => t(key))}</TableCell>
                          <TableCell>
                            {formatLocalizedDateTime(parseISO(item.createdAt), t.getLocale())}
                          </TableCell>
                          <TableCell className="text-center">{item.stats.totalRecipients}</TableCell>
                          <TableCell className="text-center">{item.stats.sent}</TableCell>
                          <TableCell className="text-center">{item.stats.failed}</TableCell>
                          <TableCell className="text-center">{item.stats.withoutToken}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenDetails(item.id)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                          {t("history.empty")}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <TablePaginationFooter
                total={historyTotal}
                page={historyPage}
                pageSize={historyPageSize}
                onPageChange={(page) => {
                  setHistoryPage(page)
                  void loadHistory(page, historyPageSize)
                }}
                onPageSizeChange={(pageSize) => {
                  setHistoryPageSize(pageSize)
                  setHistoryPage(1)
                  void loadHistory(1, pageSize)
                }}
              />
            </div>
              </TabsContent>
            ) : null}
          </Tabs>
        ) : null}
      </div>

      <NotificationHistoryDetailsDialog
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        data={detailsData}
        isLoading={isDetailsLoading}
      />

      <Dialog open={isLocalitiesDialogOpen} onOpenChange={setIsLocalitiesDialogOpen}>
        <DialogContent className="max-h-[85vh] sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>{t("localities.modal.title")}</DialogTitle>
            <DialogDescription>{t("localities.modal.description")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto">
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={() => loadLocalities()} disabled={isLoadingLocalities}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                {t("localities.actions.refresh")}
              </Button>
              {canManageLocalities ? (
                <Button
                  onClick={() => {
                    setEditingLocality(null)
                    setIsLocalityFormOpen(true)
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t("localities.actions.create")}
                </Button>
              ) : null}
            </div>
            <div className="relative rounded-md border bg-card">
              {isLoadingLocalities ? <TableLoadingOverlay /> : null}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("localities.columns.name")}</TableHead>
                    <TableHead>{t("localities.columns.description")}</TableHead>
                    <TableHead>{t("localities.columns.center")}</TableHead>
                    <TableHead>{t("localities.columns.radius")}</TableHead>
                    <TableHead>{t("localities.columns.max_age")}</TableHead>
                    <TableHead>{t("localities.columns.updated_at")}</TableHead>
                    <TableHead className="w-[90px] text-right">{t("localities.columns.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {localities.length > 0 ? (
                    localities.map((locality) => (
                      <TableRow key={locality.id}>
                        <TableCell className="font-medium">{locality.name}</TableCell>
                        <TableCell>{locality.description || t("localities.no_description")}</TableCell>
                        <TableCell>{`${locality.centerLat}, ${locality.centerLng}`}</TableCell>
                        <TableCell>{locality.radiusKm}</TableCell>
                        <TableCell>{locality.maxLocationAgeMinutes || 120}</TableCell>
                        <TableCell>
                          {locality.updatedAt
                            ? formatLocalizedDateTime(parseISO(locality.updatedAt), t.getLocale())
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {canManageLocalities ? (
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingLocality(locality)
                                  setIsLocalityFormOpen(true)
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setLocalityToDelete(locality)
                                  setIsDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        {t("localities.empty")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <LocalityFormDialog
        open={isLocalityFormOpen}
        onOpenChange={setIsLocalityFormOpen}
        locality={editingLocality}
        onSuccess={loadLocalities}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title={t("localities.delete_dialog.title")}
        description={t("localities.delete_dialog.description")}
        confirmText={t("localities.actions.delete")}
        cancelText={t("localities.form.buttons.cancel")}
        onConfirm={handleDeleteLocality}
        isLoading={isDeletingLocality}
        variant="destructive"
      />
    </>
  )
}
