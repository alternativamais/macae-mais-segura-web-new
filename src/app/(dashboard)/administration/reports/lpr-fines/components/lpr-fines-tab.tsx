"use client"

import { useEffect, useMemo, useState } from "react"
import { EllipsisVertical, Eye, Search } from "lucide-react"
import { DataTag } from "@/components/shared/data-tag"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TableLoadingOverlay } from "@/app/(dashboard)/access-control/components/table-loading-overlay"
import { TablePaginationFooter } from "@/app/(dashboard)/access-control/components/table-pagination-footer"
import { useTranslator } from "@/lib/i18n"
import { MODAL_EXIT_DURATION_MS } from "@/lib/modal"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { lprFineReportService } from "@/services/lpr-fine-report.service"
import { LprFineReport } from "@/types/lpr-fine-report"
import { LprFineReportDetailsDialog } from "./lpr-fine-report-details-dialog"

function formatDateTime(value: string | null | undefined, locale: string) {
  if (!value) return "—"

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value))
}

export function LprFinesTab() {
  const t = useTranslator("lpr_fines_reports")
  const locale = t.getLocale()
  const [items, setItems] = useState<LprFineReport[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [detailsId, setDetailsId] = useState<number | null>(null)
  const [detailsItem, setDetailsItem] = useState<LprFineReport | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  useEffect(() => {
    setPage(1)
  }, [search, pageSize])

  useEffect(() => {
    if (isDetailsOpen || !detailsId) return

    const timeout = window.setTimeout(() => {
      setDetailsItem(null)
      setDetailsId(null)
    }, MODAL_EXIT_DURATION_MS)

    return () => window.clearTimeout(timeout)
  }, [detailsId, isDetailsOpen])

  useEffect(() => {
    let active = true

    const load = async () => {
      setIsLoading(true)
      try {
        const response = await lprFineReportService.findAll({
          page,
          limit: pageSize,
          search: search.trim() || undefined,
        })

        if (!active) return

        setItems(response.data || [])
        setTotal(response.total || 0)
      } catch (error) {
        if (!active) return

        toast.apiError(error, t("fetch_error"))
        setItems([])
        setTotal(0)
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [page, pageSize, search, t])

  const handleOpenDetails = async (id: number) => {
    setDetailsId(id)
    setIsDetailsOpen(true)

    try {
      const data = await lprFineReportService.findOne(id)
      setDetailsItem(data)
    } catch (error) {
      toast.apiError(error, t("details.fetch_error"))
      setIsDetailsOpen(false)
    }
  }

  const rows = useMemo(() => items, [items])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("table.search_placeholder")}
            className="pl-9"
          />
        </div>
      </div>

      <div className="relative rounded-md border bg-card">
        {isLoading ? <TableLoadingOverlay /> : null}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("table.columns.plate")}</TableHead>
              <TableHead>{t("table.columns.company")}</TableHead>
              <TableHead>{t("table.columns.rule")}</TableHead>
              <TableHead>{t("table.columns.camera")}</TableHead>
              <TableHead>{t("table.columns.delivery")}</TableHead>
              <TableHead>{t("table.columns.detected_at")}</TableHead>
              <TableHead className="w-[72px] text-right">{t("table.columns.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!isLoading && rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  {t("table.empty")}
                </TableCell>
              </TableRow>
            ) : null}

            {rows.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-medium">{item.plateText}</p>
                    <p className="text-xs text-muted-foreground">#{item.id}</p>
                  </div>
                </TableCell>
                <TableCell>{item.empresa?.nome || "—"}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-medium">{item.rule?.name || "—"}</p>
                    {item.rule?.description ? (
                      <p className="line-clamp-1 text-xs text-muted-foreground">{item.rule.description}</p>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>{item.camera?.nome || "—"}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    {item.deliveryChannels?.length ? (
                      item.deliveryChannels.map((channel) => (
                        <DataTag key={channel} tone={channel === "whatsapp" ? "accent" : "info"}>
                          {channel === "whatsapp" ? "WhatsApp" : "Email"}
                        </DataTag>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>{formatDateTime(item.detectedAt || item.triggeredAt, locale)}</TableCell>
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
                        onClick={() => void handleOpenDetails(item.id)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        {t("table.actions.view")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <TablePaginationFooter
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      <LprFineReportDetailsDialog
        item={detailsItem}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />
    </div>
  )
}
