"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { LayoutTemplate as ScreenIcon, Save, Search } from "lucide-react"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { TableLoadingOverlay } from "@/app/(dashboard)/access-control/components/table-loading-overlay"
import { TabStateCard } from "@/app/(dashboard)/access-control/components/tab-state-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { roleService } from "@/services/role.service"
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

const normalizeAssignedIds = (screenIds: number[]) =>
  Array.from(new Set(screenIds.filter((screenId) => Number.isInteger(screenId))))

export function ScreensTab() {
  const [roles, setRoles] = useState<Role[]>([])
  const [screens, setScreens] = useState<FrontendScreen[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [assignedIds, setAssignedIds] = useState<number[]>([])
  const [initialAssignedIds, setInitialAssignedIds] = useState<number[]>([])
  const t = useTranslator("permissions.screens_tab")

  const loadBaseData = useCallback(async () => {
    setIsLoading(true)

    const [rolesResult, screensResult] = await Promise.allSettled([
      roleService.findAllNoPagination(),
      frontendScreenService.findAll("web"),
    ])

    if (rolesResult.status === "fulfilled") {
      setRoles(rolesResult.value)
    } else {
      setRoles([])
      toast.apiError(rolesResult.reason, t("error_roles"))
    }

    if (screensResult.status === "fulfilled") {
      setScreens(screensResult.value)
    } else {
      setScreens([])
      toast.apiError(screensResult.reason, t("error_screens"))
    }

    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadBaseData()
  }, [loadBaseData])

  const loadRoleScreens = useCallback(async (roleId: number) => {
    setIsLoading(true)
    try {
      const assignedScreens = await frontendScreenService.findForRole(roleId, "web")
      const screenIds = normalizeAssignedIds(
        assignedScreens.filter((screen) => screen.assigned).map((screen) => screen.id)
      )
      setAssignedIds(screenIds)
      setInitialAssignedIds(screenIds)
    } catch (error) {
      toast.apiError(error, t("error_role_screens"))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleRoleChange = (roleIdStr: string) => {
    const roleId = Number(roleIdStr)
    setSelectedRoleId(roleId)
    loadRoleScreens(roleId)
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
            <span className="text-sm font-medium text-muted-foreground">{t("role")}</span>
            <Select
              value={selectedRoleId ? String(selectedRoleId) : ""}
              onValueChange={handleRoleChange}
              disabled={isLoading && roles.length === 0}
            >
              <SelectTrigger id="role-select" className="w-full cursor-pointer sm:w-[240px]">
                <SelectValue placeholder={t("select_role")} />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={String(role.id)}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleSave}
            disabled={!selectedRoleId || !isDirty || isLoading}
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
