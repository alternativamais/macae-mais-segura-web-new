"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Save, Search, ShieldAlert as ShieldIcon } from "lucide-react"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { TableLoadingOverlay } from "@/app/(dashboard)/access-control/components/table-loading-overlay"
import { TabStateCard } from "@/app/(dashboard)/access-control/components/tab-state-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { roleService } from "@/services/role.service"
import { rolePermissionService } from "@/services/role-permission.service"
import { Permission } from "@/types/permission"
import { permissionService } from "@/services/permission.service"
import { Role } from "@/types/role"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PermissionGroupAccordion } from "./permission-group-accordion"
import { useTranslator } from "@/lib/i18n"

export function AssignmentTab() {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [assignedIds, setAssignedIds] = useState<number[]>([])
  const [initialAssignedIds, setInitialAssignedIds] = useState<number[]>([])
  const t = useTranslator("permissions.assignment_tab")

  const loadBaseData = useCallback(async () => {
    setIsLoading(true)

    const [rolesResult, permissionsResult] = await Promise.allSettled([
      roleService.findAllNoPagination(),
      permissionService.findAllNoPagination(),
    ])

    if (rolesResult.status === "fulfilled") {
      setRoles(rolesResult.value)
    } else {
      setRoles([])
      toast.apiError(rolesResult.reason, t("error_roles"))
    }

    if (permissionsResult.status === "fulfilled") {
      setPermissions(permissionsResult.value)
    } else {
      setPermissions([])
      toast.apiError(permissionsResult.reason, t("error_perms"))
    }

    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadBaseData()
  }, [loadBaseData])

  const loadRolePermissions = useCallback(async (roleId: number) => {
    setIsLoading(true)
    try {
      const roleDetails = await roleService.findOne(roleId)
      const permIds = roleDetails.rolePermissions?.map((rp) => rp.permissionsId) || []
      setAssignedIds(permIds)
      setInitialAssignedIds(permIds)
    } catch (error) {
      toast.apiError(error, t("error_role_perms"))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleRoleChange = (roleIdStr: string) => {
    const roleId = Number(roleIdStr)
    setSelectedRoleId(roleId)
    loadRolePermissions(roleId)
  }

  const filteredGroupedPermissions = useMemo(() => {
    const groups: Record<string, Permission[]> = {}

    const normalizedSearch = searchTerm.trim().toLowerCase()

    const filtered = permissions.filter(
      (permission) =>
        permission.name.toLowerCase().includes(normalizedSearch) ||
        (permission.group && permission.group.toLowerCase().includes(normalizedSearch))
    )

    filtered.forEach((permission) => {
      const groupName = permission.group || t("fallback_group")
      if (!groups[groupName]) groups[groupName] = []
      groups[groupName].push(permission)
    })

    return groups
  }, [permissions, searchTerm, t])

  const handleTogglePermission = (permissionId: number, isChecked: boolean) => {
    setAssignedIds((prev) => {
      if (isChecked) return [...prev, permissionId]
      return prev.filter((id) => id !== permissionId)
    })
  }

  const handleToggleGroup = (groupPermissions: Permission[], isChecked: boolean) => {
    const groupPermissionIds = groupPermissions.map((permission) => permission.id)

    setAssignedIds((prev) => {
      if (isChecked) {
        const newIds = [...prev]
        groupPermissionIds.forEach((id) => {
          if (!newIds.includes(id)) newIds.push(id)
        })
        return newIds
      }

      return prev.filter((id) => !groupPermissionIds.includes(id))
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
      await rolePermissionService.updatePermissionsForRole(selectedRoleId, assignedIds)
      toast.success(t("success"))
      setInitialAssignedIds(assignedIds)
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

          {Object.keys(filteredGroupedPermissions).length > 0 ? (
            <div className="divide-y">
              {Object.entries(filteredGroupedPermissions).map(([groupName, groupPermissions]) => (
                <PermissionGroupAccordion
                  key={groupName}
                  groupName={groupName}
                  permissions={groupPermissions}
                  assignedIds={assignedIds}
                  onToggleGroup={handleToggleGroup}
                  onTogglePermission={handleTogglePermission}
                />
              ))}
            </div>
          ) : (
            <div className="p-6">
              <TabStateCard
                icon={ShieldIcon}
                title={t("empty_title")}
                description={t("empty_desc")}
              />
            </div>
          )}
        </div>
      ) : (
        <TabStateCard
          icon={ShieldIcon}
          title={t("start_title")}
          description={t("start_desc")}
        />
      )}
    </div>
  )
}
