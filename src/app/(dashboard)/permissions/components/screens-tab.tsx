"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Building2, LayoutTemplate as ScreenIcon, Save, Search } from "lucide-react"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { TableLoadingOverlay } from "@/app/(dashboard)/access-control/components/table-loading-overlay"
import { TabStateCard } from "@/app/(dashboard)/access-control/components/tab-state-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { frontendScreenService } from "@/services/frontend-screen.service"
import { FrontendScreen } from "@/types/frontend-screen"
import { Role } from "@/types/role"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScreenGroupAccordion } from "./screen-group-accordion"
import { useTranslator } from "@/lib/i18n"
import { RoleScopeBadge } from "./role-scope-badge"
import { CompanyNameById, getRoleOptionLabel } from "./utils"

const normalizeAssignedIds = (screenIds: number[]) =>
  Array.from(new Set(screenIds.filter((screenId) => Number.isInteger(screenId))))

interface ScreensTabProps {
  roles: Role[]
  companyNameById: CompanyNameById
  isRolesLoading: boolean
  targetCompanyName?: string | null
}

export function ScreensTab({
  roles,
  companyNameById,
  isRolesLoading,
  targetCompanyName,
}: ScreensTabProps) {
  const [screens, setScreens] = useState<FrontendScreen[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [assignedIds, setAssignedIds] = useState<number[]>([])
  const [initialAssignedIds, setInitialAssignedIds] = useState<number[]>([])
  const loadRoleScreensRequestId = useRef(0)
  const t = useTranslator("permissions.screens_tab")
  const selectedRole = useMemo(
    () => roles.find((role) => role.id === selectedRoleId) ?? null,
    [roles, selectedRoleId]
  )

  const loadBaseData = useCallback(async () => {
    setIsLoading(true)

    const [screensResult] = await Promise.allSettled([frontendScreenService.findAll("web")])

    if (screensResult.status === "fulfilled") {
      setScreens(screensResult.value)
    } else {
      setScreens([])
      toast.apiError(screensResult.reason, t("error_screens"))
    }

    setIsLoading(false)
  }, [t])

  useEffect(() => {
    void loadBaseData()
  }, [loadBaseData])

  useEffect(() => {
    if (selectedRoleId && !roles.some((role) => role.id === selectedRoleId)) {
      setSelectedRoleId(null)
      setAssignedIds([])
      setInitialAssignedIds([])
    }
  }, [roles, selectedRoleId])

  const loadRoleScreens = useCallback(async (roleId: number) => {
    const requestId = ++loadRoleScreensRequestId.current
    setIsLoading(true)
    try {
      const assignedScreens = await frontendScreenService.findForRole(roleId, "web")
      const screenIds = normalizeAssignedIds(
        assignedScreens.filter((screen) => screen.assigned).map((screen) => screen.id)
      )
      if (loadRoleScreensRequestId.current === requestId) {
        setAssignedIds(screenIds)
        setInitialAssignedIds(screenIds)
      }
    } catch (error) {
      if (loadRoleScreensRequestId.current === requestId) {
        setAssignedIds([])
        setInitialAssignedIds([])
        toast.apiError(error, t("error_role_screens"))
      }
    } finally {
      if (loadRoleScreensRequestId.current === requestId) {
        setIsLoading(false)
      }
    }
  }, [t])

  const handleRoleChange = (roleIdStr: string) => {
    const roleId = Number(roleIdStr)

     if (!Number.isInteger(roleId) || roleId <= 0) {
      setSelectedRoleId(null)
      setAssignedIds([])
      setInitialAssignedIds([])
      return
    }

    setSelectedRoleId(roleId)
    setAssignedIds([])
    setInitialAssignedIds([])
    void loadRoleScreens(roleId)
  }

  const filteredGroupedScreens = useMemo(() => {
    const groups: Record<string, FrontendScreen[]> = {}

    const normalizedSearch = searchTerm.trim().toLowerCase()

    const filtered = screens.filter(
      (screen) =>
        screen.title.toLowerCase().includes(normalizedSearch) ||
        (screen.group && screen.group.toLowerCase().includes(normalizedSearch))
    )

    filtered.forEach((screen) => {
      const groupName = screen.group || t("fallback_group")
      if (!groups[groupName]) groups[groupName] = []
      groups[groupName].push(screen)
    })

    return groups
  }, [screens, searchTerm, t])

  const handleToggleScreen = (screenId: number, isChecked: boolean) => {
    setAssignedIds((prev) => {
      if (isChecked) return normalizeAssignedIds([...prev, screenId])
      return prev.filter((id) => id !== screenId)
    })
  }

  const handleToggleGroup = (groupScreens: FrontendScreen[], isChecked: boolean) => {
    const groupScreenIds = groupScreens.map((screen) => screen.id)

    setAssignedIds((prev) => {
      if (isChecked) {
        const newIds = [...prev]
        groupScreenIds.forEach((id) => {
          if (!newIds.includes(id)) newIds.push(id)
        })
        return normalizeAssignedIds(newIds)
      }

      return prev.filter((id) => !groupScreenIds.includes(id))
    })
  }

  const isDirty = useMemo(() => {
    if (assignedIds.length !== initialAssignedIds.length) return true

    const sortedCurrent = [...assignedIds].sort()
    const sortedInitial = [...initialAssignedIds].sort()
    return sortedCurrent.some((val, idx) => val !== sortedInitial[idx])
  }, [assignedIds, initialAssignedIds])

  const handleSave = async () => {
    if (!selectedRoleId) return

    try {
      const normalizedIds = normalizeAssignedIds(assignedIds)
      await frontendScreenService.updateForRole(selectedRoleId, normalizedIds, "web")
      toast.success(t("success"))
      setAssignedIds(normalizedIds)
      setInitialAssignedIds(normalizedIds)
    } catch (error) {
      toast.apiError(error, t("error_save"))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("search")}
            className="pl-9"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Building2 className="size-3.5" />
              <span>
                {t("target_company")}:
                {" "}
                {targetCompanyName || t("target_company_empty")}
              </span>
            </div>
            <span className="text-sm font-medium text-muted-foreground">{t("role")}</span>
            <Select
              value={selectedRoleId ? String(selectedRoleId) : ""}
              onValueChange={handleRoleChange}
              disabled={isRolesLoading || (isLoading && roles.length === 0)}
            >
              <SelectTrigger id="role-select" className="w-full cursor-pointer sm:w-[240px]">
                <SelectValue placeholder={t("select_role")} />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={String(role.id)}>
                    {getRoleOptionLabel(role, companyNameById, {
                      globalRole: t("global_role"),
                      companyFallback: (empresaId) => t("company_role_fallback", { id: empresaId }),
                    })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedRole ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{t("selected_scope")}:</span>
                <RoleScopeBadge role={selectedRole} companyNameById={companyNameById} />
              </div>
            ) : null}
          </div>

          <Button
            onClick={handleSave}
            disabled={!selectedRoleId || !isDirty || isLoading || isRolesLoading}
            className="cursor-pointer self-end"
          >
            <Save className="mr-2 h-4 w-4" />
            {t("save")}
          </Button>
        </div>
      </div>

      {selectedRoleId ? (
        <div className="relative overflow-hidden rounded-md border bg-card">
          {isLoading ? <TableLoadingOverlay /> : null}

          {Object.keys(filteredGroupedScreens).length > 0 ? (
            <div className="divide-y">
              {Object.entries(filteredGroupedScreens).map(([groupName, groupScreens]) => (
                <ScreenGroupAccordion
                  key={groupName}
                  groupName={groupName}
                  screens={groupScreens}
                  assignedIds={assignedIds}
                  onToggleGroup={handleToggleGroup}
                  onToggleScreen={handleToggleScreen}
                />
              ))}
            </div>
          ) : (
            <div className="p-6">
              <TabStateCard
                icon={ScreenIcon}
                title={t("empty_title")}
                description={t("empty_desc")}
              />
            </div>
          )}
        </div>
      ) : (
        <TabStateCard
          icon={ScreenIcon}
          title={t("start_title")}
          description={t("start_desc")}
        />
      )}
    </div>
  )
}
