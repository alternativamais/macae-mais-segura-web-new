"use client"

import { useMemo, useState } from "react"
import { EllipsisVertical, MapPinned, Search, ShieldBan, ShieldCheck } from "lucide-react"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { User } from "@/types/user"
import { accessControlService } from "@/services/access-control.service"
import { useHasPermission } from "@/hooks/use-has-permission"
import { TablePaginationFooter } from "./table-pagination-footer"
import { TabStateCard } from "./tab-state-card"
import { ActiveStatusBadge } from "./status-badges"
import { LocationReportDialog } from "./location-report-dialog"
import { useTranslator } from "@/lib/i18n"

interface LocationRequirementsTabProps {
  users: User[]
  onRefreshUsers: () => Promise<void> | void
}

export function LocationRequirementsTab({
  users,
  onRefreshUsers,
}: LocationRequirementsTabProps) {
  const { hasPermission } = useHasPermission()
  const canManageRequirement = hasPermission("gerenciar_requisito_localizacao")
  const canViewReport = hasPermission("ver_relatorio_localizacao")

  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [togglingUserId, setTogglingUserId] = useState<number | null>(null)
  const [reportUser, setReportUser] = useState<User | undefined>()
  const [isReportOpen, setIsReportOpen] = useState(false)
  const t = useTranslator("access_control.location_requirements_tab")

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    if (!normalizedSearch) return users

    return users.filter((user) =>
      [user.name, user.email, user.username]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch)
    )
  }, [users, searchTerm])

  const paginatedUsers = useMemo(() => {
    const startIndex = (page - 1) * pageSize
    return filteredUsers.slice(startIndex, startIndex + pageSize)
  }, [filteredUsers, page, pageSize])

  const handleToggleRequirement = async (user: User, required: boolean) => {
    if (!canManageRequirement) return

    setTogglingUserId(user.id)
    try {
      await accessControlService.toggleLocationRequirement(user.id, required)
      toast.success(
        required ? t("success_toggle_on") : t("success_toggle_off")
      )
      await onRefreshUsers()
    } catch (error) {
      toast.apiError(error, t("error_toggle"))
    } finally {
      setTogglingUserId(null)
    }
  }

  const handleOpenReport = (user: User) => {
    setReportUser(user)
    setIsReportOpen(true)
  }

  if (!canManageRequirement && !canViewReport) {
    return (
      <TabStateCard
        icon={MapPinned}
        title={t("no_permission_title")}
        description={t("no_permission_desc")}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("search")}
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value)
              setPage(1)
            }}
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("col_user")}</TableHead>
              <TableHead>{t("col_status")}</TableHead>
              <TableHead>{t("col_required")}</TableHead>
              <TableHead className="w-[80px] text-right">{t("col_actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.length > 0 ? (
              paginatedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{user.name || user.email}</div>
                      <div className="text-xs text-muted-foreground">
                        {user.email}
                        {user.username ? ` • ${user.username}` : ""}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <ActiveStatusBadge active={String(user.status).toLowerCase() === "active"} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={!!user.locationRequired}
                        onCheckedChange={(checked) =>
                          handleToggleRequirement(user, !!checked)
                        }
                        disabled={!canManageRequirement || togglingUserId === user.id}
                      />
                      <span className="text-sm text-muted-foreground">
                        {user.locationRequired ? t("status_required") : t("status_optional")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="cursor-pointer">
                          <EllipsisVertical className="h-4 w-4" />
                          <span className="sr-only">{t("open_actions")}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canViewReport ? (
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => handleOpenReport(user)}
                          >
                            <MapPinned className="mr-2 h-4 w-4" />
                            {t("actions.view_report")}
                          </DropdownMenuItem>
                        ) : null}
                        {canManageRequirement ? (
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() =>
                              handleToggleRequirement(user, !user.locationRequired)
                            }
                          >
                            {user.locationRequired ? (
                              <ShieldBan className="mr-2 h-4 w-4" />
                            ) : (
                              <ShieldCheck className="mr-2 h-4 w-4" />
                            )}
                            {user.locationRequired
                              ? t("actions.disable_req")
                              : t("actions.enable_req")}
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  {t("empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <TablePaginationFooter
        total={filteredUsers.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      <LocationReportDialog
        open={isReportOpen}
        onOpenChange={setIsReportOpen}
        user={reportUser}
      />
    </div>
  )
}
