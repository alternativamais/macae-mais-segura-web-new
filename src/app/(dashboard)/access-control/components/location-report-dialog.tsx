"use client"

import dynamic from "next/dynamic"
import { useEffect, useMemo, useState } from "react"
import { Loader2, MapPin, Route, Sparkles } from "lucide-react"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { accessControlService } from "@/services/access-control.service"
import { UserLocationRecord } from "@/types/access-control"
import { User } from "@/types/user"
import { formatDateTime, getLocationCoordinatesLabel } from "./utils"
import { useTranslator } from "@/lib/i18n"
import { TablePaginationFooter } from "./table-pagination-footer"
import { LocationReportDateRangePicker } from "./location-report-date-range-picker"

const LocationHistoryMap = dynamic(
  () =>
    import("./location-history-map").then((module) => ({
      default: module.LocationHistoryMap,
    })),
  {
    ssr: false,
    loading: () => {
      // cannot use hooks inside loading component easily, and it's a small component, but wait, we can just use another approach or assume loading strings! Wait, it's better to use getTranslator or an imported client component. Let's just use static or we can just keep "Carregando mapa...". Actually, the dynamic import's `loading` can't easily access the React context if it's not setup to, but in Next 14 app router it can. Actually let's create a wrapper or just use a small static text, wait! We can inject the translation inside the Dialog or use the `t` text directly if we restructure.
      // Easiest is to leave it static or import the `t` directly? No, hooks can be used in the loading component!
      const Spinner = () => {
        const t = useTranslator("access_control.location_report_dialog")
        return (
          <div className="flex h-[360px] items-center justify-center rounded-xl border bg-muted/20 text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("loading_map")}
            </span>
          </div>
        )
      }
      return <Spinner />
    },
  }
)

interface LocationReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: User
}

export function LocationReportDialog({
  open,
  onOpenChange,
  user,
}: LocationReportDialogProps) {
  const [records, setRecords] = useState<UserLocationRecord[]>([])
  const [totalRecords, setTotalRecords] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const t = useTranslator("access_control.location_report_dialog")
  const currentLocale = t.getLocale()

  useEffect(() => {
    if (!open || !user?.id) {
      setRecords([])
      setTotalRecords(0)
      setSearchTerm("")
      setSelectedRecordId(null)
      setPage(1)
      setPageSize(20)
      setDateFrom("")
      setDateTo("")
      return
    }
  }, [open, user])

  useEffect(() => {
    if (!open || !user?.id) {
      return
    }

    const loadReport = async () => {
      setIsLoading(true)
      try {
        const data = await accessControlService.getLocationReport({
          userId: user.id,
          page,
          pageSize,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        })
        setRecords(data.items)
        setTotalRecords(data.total)
        setSelectedRecordId((current) =>
          current && data.items.some((record) => record.id === current)
            ? current
            : (data.items[0]?.id ?? null),
        )
      } catch (error) {
        toast.apiError(error, t("error_load"))
        setRecords([])
        setTotalRecords(0)
        setSelectedRecordId(null)
      } finally {
        setIsLoading(false)
      }
    }

    void loadReport()
  }, [dateFrom, dateTo, open, page, pageSize, t, user])

  const filteredRecords = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    if (!normalizedSearch) return records

    return records.filter((record) => {
      const date = formatDateTime(record.createdAt, currentLocale).toLowerCase()
      const coordinates = getLocationCoordinatesLabel(record).toLowerCase()
      return date.includes(normalizedSearch) || coordinates.includes(normalizedSearch)
    })
  }, [records, searchTerm, currentLocale])

  useEffect(() => {
    if (!filteredRecords.length) {
      setSelectedRecordId(null)
      return
    }

    if (!selectedRecordId || !filteredRecords.some((record) => record.id === selectedRecordId)) {
      setSelectedRecordId(filteredRecords[0].id)
    }
  }, [filteredRecords, selectedRecordId])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-hidden sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {user
              ? t("desc_user", { name: user.name || user.email })
              : t("desc_no_user")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-hidden">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
            <Input
              placeholder={t("search")}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="max-w-xl"
            />

            {user ? (
              <Button
                variant="outline"
                className="cursor-default justify-start gap-2 justify-self-start lg:justify-self-end"
                type="button"
              >
                <MapPin className="h-4 w-4" />
                {user.name || user.email}
              </Button>
            ) : null}
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.95fr)]">
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex h-[360px] items-center justify-center rounded-xl border bg-muted/20 text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("loading_records")}
                  </span>
                </div>
              ) : filteredRecords.length > 0 ? (
                <LocationHistoryMap
                  records={filteredRecords}
                  selectedRecordId={selectedRecordId}
                  onSelectRecord={setSelectedRecordId}
                />
              ) : (
                <div className="flex h-[360px] flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/30 px-6 text-center">
                  <Route className="mb-3 h-10 w-10 text-muted-foreground/40" />
                  <p className="font-medium">{t("map_empty_title")}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("map_empty_desc")}
                  </p>
                </div>
              )}

              <div className="grid gap-3 md:grid-cols-3">
                <Card className="gap-0 bg-muted/20 py-0">
                  <CardContent className="p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {t("stat_records")}
                    </div>
                    <div className="mt-2 text-2xl font-semibold">{totalRecords}</div>
                  </CardContent>
                </Card>
                <Card className="gap-0 bg-muted/20 py-0">
                  <CardContent className="p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {t("stat_last")}
                    </div>
                    <div className="mt-2 text-sm font-medium">
                      {records[0] ? formatDateTime(records[0].createdAt, currentLocale) : "--"}
                    </div>
                  </CardContent>
                </Card>
                <Card className="gap-0 bg-muted/20 py-0">
                  <CardContent className="p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {t("stat_highlight")}
                    </div>
                    <div className="mt-2 inline-flex items-center gap-2 text-sm font-medium">
                      <Sparkles className="h-4 w-4 text-primary" />
                      {selectedRecordId ? t("highlight_selected") : t("highlight_none")}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Card className="gap-0 overflow-hidden py-0">
              <div className="border-b bg-muted/20 px-4 py-3">
                <div className="text-sm font-medium">{t("timeline_title")}</div>
                <div className="text-xs text-muted-foreground">
                  {t("timeline_desc")}
                </div>
              </div>

              <CardContent className="space-y-4 px-0 pb-0">
                <div className="px-4 pt-4">
                  <LocationReportDateRangePicker
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                    onChange={({ dateFrom: nextDateFrom, dateTo: nextDateTo }) => {
                      setDateFrom(nextDateFrom)
                      setDateTo(nextDateTo)
                      setPage(1)
                    }}
                  />
                </div>

                <div className="max-h-[420px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("col_date")}</TableHead>
                        <TableHead>{t("col_coords")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                            <span className="inline-flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              {t("loading_records")}
                            </span>
                          </TableCell>
                        </TableRow>
                      ) : filteredRecords.length > 0 ? (
                        filteredRecords.map((record) => {
                          const isSelected = selectedRecordId === record.id

                          return (
                            <TableRow
                              key={record.id}
                              className="cursor-pointer"
                              data-state={isSelected ? "selected" : undefined}
                              onClick={() => setSelectedRecordId(record.id)}
                            >
                              <TableCell className="font-medium">
                                {formatDateTime(record.createdAt, currentLocale)}
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {getLocationCoordinatesLabel(record)}
                              </TableCell>
                            </TableRow>
                          )
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                            {t("empty")}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="px-4">
                  <TablePaginationFooter
                    total={totalRecords}
                    page={page}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onPageSizeChange={(value) => {
                      setPageSize(value)
                      setPage(1)
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
