"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { ArrowRight, EllipsisVertical, RefreshCcw, Search, ShieldCheck } from "lucide-react"
import { TableLoadingOverlay } from "@/app/(dashboard)/access-control/components/table-loading-overlay"
import { TablePaginationFooter } from "@/app/(dashboard)/access-control/components/table-pagination-footer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Integration } from "@/types/integration"
import { useTranslator } from "@/lib/i18n"
import { MODAL_EXIT_DURATION_MS } from "@/lib/modal"
import { IntegrationDetailsDialog } from "./integration-details-dialog"
import { getIntegrationBadgeVariant, getIntegrationSearchIndex } from "./utils"

interface PlateSendingOverviewTabProps {
  integrations: Integration[]
  isLoading?: boolean
  onReload: () => Promise<void> | void
}

export function PlateSendingOverviewTab({
  integrations,
  isLoading = false,
  onReload,
}: PlateSendingOverviewTabProps) {
  const t = useTranslator("plate_sending")
  const router = useRouter()
  const pathname = usePathname()
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [detailsIntegration, setDetailsIntegration] = useState<Integration | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  useEffect(() => {
    if (isDetailsOpen) return

    const timeout = window.setTimeout(() => {
      setDetailsIntegration(null)
    }, MODAL_EXIT_DURATION_MS)

    return () => window.clearTimeout(timeout)
  }, [isDetailsOpen])

  const filteredIntegrations = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    if (!normalizedSearch) return integrations

    return integrations.filter((integration) =>
      getIntegrationSearchIndex(integration).includes(normalizedSearch),
    )
  }, [integrations, searchTerm])

  const paginatedIntegrations = useMemo(() => {
    const startIndex = (page - 1) * pageSize
    return filteredIntegrations.slice(startIndex, startIndex + pageSize)
  }, [filteredIntegrations, page, pageSize])

  const handleSearchTermChange = (value: string) => {
    setSearchTerm(value)
    setPage(1)
  }

  const handlePageSizeChange = (nextPageSize: number) => {
    setPageSize(nextPageSize)
    setPage(1)
  }

  return (
    <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("search_placeholder")}
              value={searchTerm}
              onChange={(event) => handleSearchTermChange(event.target.value)}
              className="pl-9"
            />
          </div>

          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            onClick={() => void onReload()}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            {t("actions.reload")}
          </Button>
        </div>

        <div className="relative rounded-md border bg-card">
          {isLoading ? <TableLoadingOverlay /> : null}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("overview_table.columns.integration")}</TableHead>
                <TableHead>{t("overview_table.columns.code")}</TableHead>
                <TableHead>{t("overview_table.columns.flow")}</TableHead>
                <TableHead>{t("overview_table.columns.auth")}</TableHead>
                <TableHead>{t("overview_table.columns.status")}</TableHead>
                <TableHead className="w-[80px] text-right">
                  {t("overview_table.columns.actions")}
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
                        <div className="text-sm text-muted-foreground">
                          {integration.description || t("description_fallback")}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{integration.code}</TableCell>
                    <TableCell>{t("card.flow_value")}</TableCell>
                    <TableCell>{t("card.auth_value")}</TableCell>
                    <TableCell>
                      <Badge variant={getIntegrationBadgeVariant(integration.enabled)}>
                        {integration.enabled ? t("statuses.active") : t("statuses.inactive")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="cursor-pointer">
                            <EllipsisVertical className="h-4 w-4" />
                            <span className="sr-only">{t("overview_table.open_actions")}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() =>
                              router.push(
                                `${pathname}/${integration.code.trim().toLowerCase()}`,
                              )
                            }
                          >
                            <ArrowRight className="mr-2 h-4 w-4" />
                            {t("actions.enter_integration")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => {
                              setDetailsIntegration(integration)
                              setIsDetailsOpen(true)
                            }}
                          >
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            {t("actions.view_details")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    {isLoading ? t("loading") : t("empty")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

      <TablePaginationFooter
        total={filteredIntegrations.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={handlePageSizeChange}
      />

      <IntegrationDetailsDialog
        integration={detailsIntegration}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />
    </div>
  )
}
