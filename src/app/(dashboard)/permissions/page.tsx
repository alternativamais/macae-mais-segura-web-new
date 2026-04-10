"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Building2, ShieldAlert } from "lucide-react"
import { ScreenGuard } from "@/components/shared/screen-guard"
import { DataTag } from "@/components/shared/data-tag"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  const activeCompanyId = useAuthStore((state) => state.activeCompanyId)
  const availableCompanies = useAuthStore((state) => state.availableCompanies)

  const isAllCompaniesView = String(activeCompanyId).toUpperCase() === "ALL"
  const activeCompany = useMemo(
    () =>
      availableCompanies.find((company) => String(company.id) === String(activeCompanyId)) ?? null,
    [activeCompanyId, availableCompanies]
  )
  const companyNameById = useMemo(
    () => buildCompanyNameById(availableCompanies),
    [availableCompanies]
  )

  const loadRoles = useCallback(async () => {
    if (isAllCompaniesView) {
      setRoles([])
      setIsRolesLoading(false)
      return
    }

    setIsRolesLoading(true)

    try {
      const data = await roleService.findAllNoPagination()
      setRoles(data)
    } catch {
      setRoles([])
    } finally {
      setIsRolesLoading(false)
    }
  }, [isAllCompaniesView])

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

          <StatCards />

          <div className="mt-6 rounded-lg border bg-muted/30 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  {isAllCompaniesView ? (
                    <ShieldAlert className="h-4 w-4 text-amber-600" />
                  ) : (
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium">{t("scope.label")}</span>
                  <DataTag tone={isAllCompaniesView ? "warning" : "info"}>
                    {isAllCompaniesView
                      ? t("scope.all_companies")
                      : activeCompany?.nome || t("scope.no_company")}
                  </DataTag>
                </div>
                <p className="text-sm text-muted-foreground">
                  {isAllCompaniesView
                    ? t("scope.all_companies_desc")
                    : t("scope.active_company_desc")}
                </p>
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
                isAllCompaniesView={isAllCompaniesView}
                onRefresh={loadRoles}
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
                isAllCompaniesView={isAllCompaniesView}
              />
            </TabsContent>

            <TabsContent value="screens" className="mt-4">
              <ScreensTab
                roles={roles}
                companyNameById={companyNameById}
                isRolesLoading={isRolesLoading}
                isAllCompaniesView={isAllCompaniesView}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ScreenGuard>
  )
}
