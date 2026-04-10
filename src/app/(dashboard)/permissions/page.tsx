"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Building2, BriefcaseBusiness } from "lucide-react"
import { ScreenGuard } from "@/components/shared/screen-guard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AssignmentTab } from "./components/assignment-tab"
import { PermissionsTab } from "./components/permissions-tab"
import { RolesTab } from "./components/roles-tab"
import { ScreensTab } from "./components/screens-tab"
import { StatCards } from "./components/stat-cards"
import { useTranslator } from "@/lib/i18n"
import { roleService } from "@/services/role.service"
import { useAuthStore } from "@/store/auth-store"
import { Role } from "@/types/role"
import { buildCompanyNameById } from "./components/utils"

export default function PermissionsPage() {
  const t = useTranslator("permissions")
  const [roles, setRoles] = useState<Role[]>([])
  const [isRolesLoading, setIsRolesLoading] = useState(true)
  const [targetCompanyId, setTargetCompanyId] = useState<number | null>(null)
  const loadRolesRequestId = useRef(0)
  const activeCompanyId = useAuthStore((state) => state.activeCompanyId)
  const availableCompanies = useAuthStore((state) => state.availableCompanies)

  const companyNameById = useMemo(
    () => buildCompanyNameById(availableCompanies),
    [availableCompanies]
  )
  const targetCompany = useMemo(
    () =>
      availableCompanies.find((company) => company.id === targetCompanyId) ?? null,
    [availableCompanies, targetCompanyId]
  )

  useEffect(() => {
    if (!availableCompanies.length) {
      setTargetCompanyId(null)
      return
    }

    const preferredCompanyId = availableCompanies.some(
      (company) => String(company.id) === String(activeCompanyId)
    )
      ? Number(activeCompanyId)
      : (availableCompanies[0]?.id ?? null)

    setTargetCompanyId((current) => {
      if (current && availableCompanies.some((company) => company.id === current)) {
        return current
      }

      return preferredCompanyId
    })
  }, [activeCompanyId, availableCompanies])

  const loadRoles = useCallback(async () => {
    const requestId = ++loadRolesRequestId.current

    if (!targetCompanyId) {
      setRoles([])
      setIsRolesLoading(false)
      return
    }

    setIsRolesLoading(true)

    try {
      const data = await roleService.findAllNoPagination(targetCompanyId)
      if (loadRolesRequestId.current === requestId) {
        setRoles(data)
      }
    } catch {
      if (loadRolesRequestId.current === requestId) {
        setRoles([])
      }
    } finally {
      if (loadRolesRequestId.current === requestId) {
        setIsRolesLoading(false)
      }
    }
  }, [targetCompanyId])

  useEffect(() => {
    void loadRoles()
  }, [loadRoles])

  return (
    <ScreenGuard screenKey="admin.roles">
      <div className="flex flex-col gap-4">
        <div className="@container/main mt-8 px-4 lg:mt-12 lg:px-6">
          <h2 className="mb-2 text-3xl font-bold tracking-tight">{t("title")}</h2>
          <p className="mb-6 text-muted-foreground">
            {t("description")}
          </p>

          <StatCards rolesCount={roles.length} isRolesLoading={isRolesLoading} />

          <div className="mt-6 rounded-lg border bg-card p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{t("target_company.label")}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {targetCompany
                    ? t("target_company.description", { company: targetCompany.nome })
                    : t("target_company.empty")}
                </p>
              </div>

              <div className="grid gap-2 lg:min-w-[320px]">
                <Select
                  value={targetCompanyId ? String(targetCompanyId) : ""}
                  onValueChange={(value) => setTargetCompanyId(Number(value))}
                  disabled={availableCompanies.length === 0}
                >
                  <SelectTrigger className="w-full cursor-pointer">
                    <SelectValue placeholder={t("target_company.placeholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCompanies.map((company) => (
                      <SelectItem key={company.id} value={String(company.id)}>
                        <span className="flex items-center gap-2">
                          <BriefcaseBusiness className="size-4 text-muted-foreground" />
                          {company.nome}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Tabs defaultValue="roles" className="mt-8 w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="roles">{t("tabs.roles")}</TabsTrigger>
              <TabsTrigger value="permissions">{t("tabs.permissions")}</TabsTrigger>
              <TabsTrigger value="assignment">{t("tabs.assignment")}</TabsTrigger>
              <TabsTrigger value="screens">{t("tabs.screens")}</TabsTrigger>
            </TabsList>

            <TabsContent value="roles" className="mt-4">
              <RolesTab
                roles={roles}
                companyNameById={companyNameById}
                isLoading={isRolesLoading}
                onRefresh={loadRoles}
                companies={availableCompanies}
                targetCompanyId={targetCompanyId}
              />
            </TabsContent>

            <TabsContent value="permissions" className="mt-4">
              <PermissionsTab />
            </TabsContent>

            <TabsContent value="assignment" className="mt-4">
              <AssignmentTab
                roles={roles}
                companyNameById={companyNameById}
                isRolesLoading={isRolesLoading}
                targetCompanyName={targetCompany?.nome ?? null}
              />
            </TabsContent>

            <TabsContent value="screens" className="mt-4">
              <ScreensTab
                roles={roles}
                companyNameById={companyNameById}
                isRolesLoading={isRolesLoading}
                targetCompanyName={targetCompany?.nome ?? null}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ScreenGuard>
  )
}
