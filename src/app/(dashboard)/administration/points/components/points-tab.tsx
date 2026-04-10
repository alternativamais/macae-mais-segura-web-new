"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  EllipsisVertical,
  Eye,
  MapPin,
  Pencil,
  Plus,
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
import { useHasPermission } from "@/hooks/use-has-permission"
import { empresaService } from "@/services/empresa.service"
import { pontoService } from "@/services/ponto.service"
import { Empresa } from "@/types/empresa"
import { Ponto } from "@/types/ponto"
import { PointDetailsDialog } from "./point-details-dialog"
import { PointFormDialog } from "./point-form-dialog"
import { PointStatusBadge } from "./status-badges"
import { StatCards } from "./stat-cards"
import {
  formatPointDateTime,
  getPointCompanyName,
  getPointEquipmentCount,
} from "./utils"

export function PointsTab() {
  const { hasPermission } = useHasPermission()
  const t = useTranslator("points")
  const currentLocale = t.getLocale()

  const canCreate = hasPermission("criar_ponto")
  const canUpdate = hasPermission("atualizar_ponto")
  const canDelete = hasPermission("deletar_ponto")

  const [points, setPoints] = useState<Ponto[]>([])
  const [companies, setCompanies] = useState<Empresa[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [detailsPoint, setDetailsPoint] = useState<Ponto | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [editingPoint, setEditingPoint] = useState<Ponto | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [pointToDelete, setPointToDelete] = useState<Ponto | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const companiesById = useMemo(
    () => new Map(companies.map((company) => [company.id, company])),
    [companies],
  )

  const loadData = useCallback(async () => {
    setIsLoading(true)

    try {
      const [pointsData, companiesData] = await Promise.all([
        pontoService.findAllNoPagination(),
        empresaService.findAllNoPagination(),
      ])

      setPoints(pointsData)
      setCompanies(companiesData)
    } catch (error) {
      toast.apiError(error, t("fetch_error"))
      setPoints([])
      setCompanies([])
    } finally {
      setIsLoading(false)
    }
  }, [t])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    setPage(1)
  }, [pageSize, searchTerm])

  useEffect(() => {
    if (isDetailsOpen) return

    const timeout = window.setTimeout(() => {
      setDetailsPoint(null)
    }, MODAL_EXIT_DURATION_MS)

    return () => window.clearTimeout(timeout)
  }, [isDetailsOpen])

  useEffect(() => {
    if (isFormOpen) return

    const timeout = window.setTimeout(() => {
      setEditingPoint(null)
    }, MODAL_EXIT_DURATION_MS)

    return () => window.clearTimeout(timeout)
  }, [isFormOpen])

  useEffect(() => {
    if (isDeleteDialogOpen) return

    const timeout = window.setTimeout(() => {
      setPointToDelete(null)
    }, MODAL_EXIT_DURATION_MS)

    return () => window.clearTimeout(timeout)
  }, [isDeleteDialogOpen])

  const filteredPoints = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    if (!normalizedSearch) return points

    return points.filter((point) =>
      [
        point.nome,
        point.pontoDeReferencia,
        point.coordenadas,
        point.status,
        getPointCompanyName(point, companiesById, t("system_default")),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch)
    )
  }, [companiesById, points, searchTerm, t])

  const paginatedPoints = useMemo(() => {
    const startIndex = (page - 1) * pageSize
    return filteredPoints.slice(startIndex, startIndex + pageSize)
  }, [filteredPoints, page, pageSize])

  const handleDelete = async () => {
    if (!pointToDelete) return

    setIsDeleting(true)

    try {
      await pontoService.delete(pointToDelete.id)
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
      <StatCards points={points} isLoading={isLoading} />

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
                setEditingPoint(null)
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
                <TableHead>{t("table.columns.reference")}</TableHead>
                <TableHead className="hidden lg:table-cell">{t("table.columns.coordinates")}</TableHead>
                <TableHead>{t("table.columns.equipment")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("table.columns.status")}</TableHead>
                <TableHead className="hidden xl:table-cell">{t("table.columns.updatedAt")}</TableHead>
                <TableHead className="w-[80px] text-right">{t("table.columns.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPoints.length > 0 ? (
                paginatedPoints.map((point) => (
                  <TableRow key={point.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{point.nome}</div>
                        <div className="text-xs text-muted-foreground">
                          {getPointCompanyName(point, companiesById, t("system_default"))}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {point.pontoDeReferencia || "-"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="font-mono text-xs text-muted-foreground">
                        {point.coordenadas || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="inline-flex items-center gap-2 rounded-md border bg-muted/30 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {t("table.equipment_count", {
                          count: getPointEquipmentCount(point),
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <PointStatusBadge status={point.status} />
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">
                      {formatPointDateTime(point.updatedAt, currentLocale)}
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
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => {
                              setDetailsPoint(point)
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
                                setEditingPoint(point)
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
                                  setPointToDelete(point)
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
                ))
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
          total={filteredPoints.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      <PointDetailsDialog
        point={detailsPoint}
        companiesById={companiesById}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />

      <PointFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        point={editingPoint}
        onSuccess={loadData}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title={t("table.delete_dialog.title")}
        description={t("table.delete_dialog.description")}
        confirmText={t("table.actions.delete")}
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  )
}
