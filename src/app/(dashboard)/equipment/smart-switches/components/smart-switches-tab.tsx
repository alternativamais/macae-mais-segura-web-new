"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  EllipsisVertical,
  Eye,
  Pencil,
  Plus,
  Power,
  RefreshCcw,
  Search,
  Trash2,
} from "lucide-react"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { useTranslator } from "@/lib/i18n"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { TableLoadingOverlay } from "@/app/(dashboard)/access-control/components/table-loading-overlay"
import { TablePaginationFooter } from "@/app/(dashboard)/access-control/components/table-pagination-footer"
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
import { MODAL_EXIT_DURATION_MS } from "@/lib/modal"
import { useCompanyVisibility } from "@/hooks/use-company-visibility"
import { useHasPermission } from "@/hooks/use-has-permission"
import { smartSwitchService } from "@/services/smart-switch.service"
import { totemService } from "@/services/totem.service"
import { SmartSwitch, SmartSwitchPowerState } from "@/types/smart-switch"
import { Totem } from "@/types/totem"
import { SmartSwitchDetailsDialog } from "./smart-switch-details-dialog"
import { SmartSwitchFormDialog } from "./smart-switch-form-dialog"
import { SmartSwitchPowerBadge, SmartSwitchStatusBadge } from "./status-badges"
import { StatCards } from "./stat-cards"
import {
  formatSmartSwitchDateTime,
  getSmartSwitchCompanyName,
  getSmartSwitchDestination,
  getSmartSwitchDisplayName,
  getSmartSwitchLocationPrimaryLabel,
  getSmartSwitchPointLabel,
  getSmartSwitchTotemLabel,
  normalizePowerState,
} from "./utils"

export function SmartSwitchesTab() {
  const { hasPermission } = useHasPermission()
  const t = useTranslator("smart_switches")
  const currentLocale = t.getLocale()
  const { isAllCompanies, companiesById } = useCompanyVisibility()

  const canCreate = hasPermission("criar_smart_switch")
  const canUpdate = hasPermission("atualizar_smart_switch")
  const canDelete = hasPermission("deletar_smart_switch")
  const canReadPowerState = hasPermission("estado_smart_switch")
  const canTogglePower = hasPermission("alternar_smart_switch")

  const [items, setItems] = useState<SmartSwitch[]>([])
  const [totens, setTotens] = useState<Totem[]>([])
  const [powerStates, setPowerStates] = useState<Record<number, SmartSwitchPowerState>>({})
  const [runningActionById, setRunningActionById] = useState<Record<number, "refresh" | "toggle" | undefined>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [detailsItem, setDetailsItem] = useState<SmartSwitch | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<SmartSwitch | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<SmartSwitch | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const totemsById = useMemo(
    () => new Map(totens.map((totem) => [totem.id, totem])),
    [totens],
  )

  const loadErrorMessage = t("fetch_error")
  const notInformed = t("shared.not_informed")

  const loadPowerStates = useCallback(
    async (list: SmartSwitch[]) => {
      if (!canReadPowerState || list.length === 0) {
        return
      }

      const results = await Promise.allSettled(
        list.map((item) => smartSwitchService.getPowerState(item.id)),
      )

      setPowerStates((previous) => {
        const next = { ...previous }

        results.forEach((result, index) => {
          const itemId = list[index]?.id
          if (!itemId) return

          if (result.status === "fulfilled") {
            next[itemId] = normalizePowerState(result.value.on)
          } else {
            next[itemId] = "offline"
          }
        })

        return next
      })
    },
    [canReadPowerState],
  )

  const loadData = useCallback(async () => {
    setIsLoading(true)

    try {
      const [smartSwitchesData, totemsData] = await Promise.all([
        smartSwitchService.findAllNoPagination(),
        totemService.findAllNoPagination(),
      ])

      setItems(smartSwitchesData)
      setTotens(totemsData)

      if (canReadPowerState) {
        await loadPowerStates(smartSwitchesData)
      } else {
        setPowerStates({})
      }
    } catch (error) {
      toast.apiError(error, loadErrorMessage)
      setItems([])
      setTotens([])
      setPowerStates({})
    } finally {
      setIsLoading(false)
    }
  }, [canReadPowerState, loadErrorMessage, loadPowerStates])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    setPage(1)
  }, [pageSize, searchTerm])

  useEffect(() => {
    if (isDetailsOpen) return

    const timeout = window.setTimeout(() => {
      setDetailsItem(null)
    }, MODAL_EXIT_DURATION_MS)

    return () => window.clearTimeout(timeout)
  }, [isDetailsOpen])

  useEffect(() => {
    if (isFormOpen) return

    const timeout = window.setTimeout(() => {
      setEditingItem(null)
    }, MODAL_EXIT_DURATION_MS)

    return () => window.clearTimeout(timeout)
  }, [isFormOpen])

  useEffect(() => {
    if (isDeleteDialogOpen) return

    const timeout = window.setTimeout(() => {
      setItemToDelete(null)
    }, MODAL_EXIT_DURATION_MS)

    return () => window.clearTimeout(timeout)
  }, [isDeleteDialogOpen])

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    if (!normalizedSearch) return items

    return items.filter((item) =>
      [
        getSmartSwitchDisplayName(item, notInformed),
        item.homeAssistantEntityId,
        getSmartSwitchTotemLabel(item, totemsById, notInformed),
        getSmartSwitchPointLabel(item, totemsById, notInformed),
        item.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    )
  }, [items, notInformed, searchTerm, totemsById])

  const paginatedItems = useMemo(() => {
    const startIndex = (page - 1) * pageSize
    return filteredItems.slice(startIndex, startIndex + pageSize)
  }, [filteredItems, page, pageSize])

  const refreshPowerState = async (item: SmartSwitch) => {
    setRunningActionById((previous) => ({ ...previous, [item.id]: "refresh" }))

    try {
      const result = await smartSwitchService.getPowerState(item.id)
      setPowerStates((previous) => ({
        ...previous,
        [item.id]: normalizePowerState(result.on),
      }))
      toast.success(t("table.notifications.refresh_success"))
    } catch (error) {
      setPowerStates((previous) => ({
        ...previous,
        [item.id]: "offline",
      }))
      toast.apiError(error, t("table.notifications.refresh_error"))
    } finally {
      setRunningActionById((previous) => ({ ...previous, [item.id]: undefined }))
    }
  }

  const togglePower = async (item: SmartSwitch) => {
    setRunningActionById((previous) => ({ ...previous, [item.id]: "toggle" }))

    try {
      const result = await smartSwitchService.togglePower(item.id)
      setPowerStates((previous) => ({
        ...previous,
        [item.id]: normalizePowerState(result.on),
      }))
      toast.success(t("table.notifications.toggle_success"))
    } catch (error) {
      toast.apiError(error, t("table.notifications.toggle_error"))
    } finally {
      setRunningActionById((previous) => ({ ...previous, [item.id]: undefined }))
    }
  }

  const handleDelete = async () => {
    if (!itemToDelete) return

    setIsDeleting(true)

    try {
      await smartSwitchService.delete(itemToDelete.id)
      toast.success(t("table.delete_dialog.success"))
      await loadData()
      setIsDeleteDialogOpen(false)
    } catch (error) {
      toast.apiError(error, t("table.delete_dialog.error"))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <StatCards items={items} isLoading={isLoading} />

      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("table.actions.search_placeholder")}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-9"
            />
          </div>

          {canCreate ? (
            <Button
              onClick={() => {
                setEditingItem(null)
                setIsFormOpen(true)
              }}
              className="cursor-pointer"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("table.actions.create")}
            </Button>
          ) : null}
        </div>

        <div className="relative rounded-md border bg-card">
          {isLoading ? <TableLoadingOverlay /> : null}

          <Table>
            <TableHeader>
                <TableRow>
                  <TableHead>{t("table.columns.name")}</TableHead>
                  <TableHead>{t("table.columns.entity_id")}</TableHead>
                  <TableHead>{t("table.columns.installation")}</TableHead>
                {isAllCompanies ? <TableHead>{t("table.columns.company")}</TableHead> : null}
                <TableHead>{t("table.columns.power_state")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("table.columns.status")}</TableHead>
                <TableHead className="hidden xl:table-cell">{t("table.columns.updated_at")}</TableHead>
                <TableHead className="w-[80px] text-right">{t("table.columns.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.length > 0 ? (
                paginatedItems.map((item) => {
                  const currentPowerState = canReadPowerState
                    ? powerStates[item.id] || "unknown"
                    : "unknown"

                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {getSmartSwitchDisplayName(item, notInformed)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {getSmartSwitchPointLabel(item, totemsById, notInformed)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs">{item.homeAssistantEntityId}</span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {getSmartSwitchLocationPrimaryLabel(item, totemsById, notInformed)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {getSmartSwitchDestination(item) === "ponto"
                              ? t("table.location.direct_point")
                              : t("table.location.inside_totem", {
                                  point: getSmartSwitchPointLabel(
                                    item,
                                    totemsById,
                                    notInformed,
                                  ),
                                })}
                          </div>
                        </div>
                      </TableCell>
                      {isAllCompanies ? (
                        <TableCell className="text-sm text-muted-foreground">
                          {getSmartSwitchCompanyName(item, companiesById, notInformed)}
                        </TableCell>
                      ) : null}
                      <TableCell>
                        <SmartSwitchPowerBadge state={currentPowerState} />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <SmartSwitchStatusBadge status={item.status} />
                      </TableCell>
                      <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">
                        {formatSmartSwitchDateTime(item.updatedAt, currentLocale)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="cursor-pointer">
                              <EllipsisVertical className="h-4 w-4" />
                              <span className="sr-only">{t("table.open_actions")}</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canReadPowerState ? (
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => refreshPowerState(item)}
                                disabled={!!runningActionById[item.id]}
                              >
                                <RefreshCcw className="mr-2 h-4 w-4" />
                                {t("table.actions.refresh_state")}
                              </DropdownMenuItem>
                            ) : null}
                            {canTogglePower ? (
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => togglePower(item)}
                                disabled={!!runningActionById[item.id]}
                              >
                                <Power className="mr-2 h-4 w-4" />
                                {t("table.actions.toggle")}
                              </DropdownMenuItem>
                            ) : null}
                            {(canReadPowerState || canTogglePower) ? <DropdownMenuSeparator /> : null}
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() => {
                                setDetailsItem(item)
                                setIsDetailsOpen(true)
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              {t("table.actions.view")}
                            </DropdownMenuItem>
                            {canUpdate ? (
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => {
                                  setEditingItem(item)
                                  setIsFormOpen(true)
                                }}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                {t("table.actions.edit")}
                              </DropdownMenuItem>
                            ) : null}
                            {canDelete ? (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="cursor-pointer text-destructive focus:text-destructive"
                                  onClick={() => {
                                    setItemToDelete(item)
                                    setIsDeleteDialogOpen(true)
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  {t("table.actions.delete")}
                                </DropdownMenuItem>
                              </>
                            ) : null}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    {isLoading ? t("table.loading") : t("table.empty")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <TablePaginationFooter
          total={filteredItems.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      <SmartSwitchDetailsDialog
        item={detailsItem}
        powerState={detailsItem ? powerStates[detailsItem.id] || "unknown" : "unknown"}
        totemsById={totemsById}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />

      <SmartSwitchFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={loadData}
        item={editingItem}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title={t("table.delete_dialog.title")}
        description={t("table.delete_dialog.description")}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  )
}
