"use client"

import { useCallback, useEffect, useState } from "react"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScreenGuard } from "@/components/shared/screen-guard"
import { accessControlService } from "@/services/access-control.service"
import { User } from "@/types/user"
import { StatCards } from "./components/stat-cards"
import { IpBlocksTab } from "./components/ip-blocks-tab"
import { RegionRulesTab } from "./components/region-rules-tab"
import { UserIpRulesTab } from "./components/user-ip-rules-tab"
import { UserScheduleRulesTab } from "./components/user-schedule-rules-tab"
import { LocationRequirementsTab } from "./components/location-requirements-tab"
import { useTranslator } from "@/lib/i18n"

export default function AccessControlPage() {
  const [users, setUsers] = useState<User[]>([])
  const t = useTranslator("access_control")

  const loadUsers = useCallback(async () => {
    try {
      const response = await accessControlService.findUsers()
      setUsers(response || [])
    } catch (error) {
      toast.apiError(error, t("error_load_users"))
      setUsers([])
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  return (
    <ScreenGuard screenKey="admin.access_control">
      <div className="flex flex-col gap-4">
        <div className="@container/main px-4 lg:px-6 mt-8 lg:mt-12">
          <h2 className="mb-2 text-3xl font-bold tracking-tight">{t("title")}</h2>
          <p className="mb-6 text-muted-foreground">
            {t("description")}
          </p>

          <StatCards />

          <Tabs defaultValue="ip-blocks" className="mt-8 w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="ip-blocks">{t("tabs.ip_blocks")}</TabsTrigger>
              <TabsTrigger value="region-rules">{t("tabs.region_rules")}</TabsTrigger>
              <TabsTrigger value="user-ip-rules">{t("tabs.user_ip_rules")}</TabsTrigger>
              <TabsTrigger value="user-schedule-rules">{t("tabs.user_schedule_rules")}</TabsTrigger>
              <TabsTrigger value="location">{t("tabs.location")}</TabsTrigger>
            </TabsList>

            <TabsContent value="ip-blocks" className="mt-4">
              <IpBlocksTab />
            </TabsContent>

            <TabsContent value="region-rules" className="mt-4">
              <RegionRulesTab />
            </TabsContent>

            <TabsContent value="user-ip-rules" className="mt-4">
              <UserIpRulesTab users={users} />
            </TabsContent>

            <TabsContent value="user-schedule-rules" className="mt-4">
              <UserScheduleRulesTab users={users} />
            </TabsContent>

            <TabsContent value="location" className="mt-4">
              <LocationRequirementsTab users={users} onRefreshUsers={loadUsers} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ScreenGuard>
  )
}
