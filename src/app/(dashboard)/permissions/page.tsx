"use client"

import { ScreenGuard } from "@/components/shared/screen-guard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AssignmentTab } from "./components/assignment-tab"
import { PermissionsTab } from "./components/permissions-tab"
import { RolesTab } from "./components/roles-tab"
import { ScreensTab } from "./components/screens-tab"
import { StatCards } from "./components/stat-cards"
import { useTranslator } from "@/lib/i18n"

export default function PermissionsPage() {
  const t = useTranslator("permissions")

  return (
    <ScreenGuard screenKey="admin.roles">
      <div className="flex flex-col gap-4">
        <div className="@container/main mt-8 px-4 lg:mt-12 lg:px-6">
          <h2 className="mb-2 text-3xl font-bold tracking-tight">{t("title")}</h2>
          <p className="mb-6 text-muted-foreground">
            {t("description")}
          </p>

          <StatCards />

          <Tabs defaultValue="roles" className="mt-8 w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="roles">{t("tabs.roles")}</TabsTrigger>
              <TabsTrigger value="permissions">{t("tabs.permissions")}</TabsTrigger>
              <TabsTrigger value="assignment">{t("tabs.assignment")}</TabsTrigger>
              <TabsTrigger value="screens">{t("tabs.screens")}</TabsTrigger>
            </TabsList>

            <TabsContent value="roles" className="mt-4">
              <RolesTab />
            </TabsContent>

            <TabsContent value="permissions" className="mt-4">
              <PermissionsTab />
            </TabsContent>

            <TabsContent value="assignment" className="mt-4">
              <AssignmentTab />
            </TabsContent>

            <TabsContent value="screens" className="mt-4">
              <ScreensTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ScreenGuard>
  )
}
