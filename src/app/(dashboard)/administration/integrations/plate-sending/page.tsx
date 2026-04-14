"use client"

import { useCallback, useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScreenGuard } from "@/components/shared/screen-guard"
import { useTranslator } from "@/lib/i18n"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { integrationService } from "@/services/integration.service"
import { Integration } from "@/types/integration"
import { ConfigurableStudioTab } from "./components/configurable-studio-tab"
import { PlateSendingOverviewTab } from "./components/plate-sending-tab"
import { LprDetectionsTab } from "./components/lpr-detections-tab"
import { StatCards } from "./components/stat-cards"

export default function PlateSendingPage() {
  const t = useTranslator("plate_sending")
  const [activeTab, setActiveTab] = useState("overview")
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [isLoadingIntegrations, setIsLoadingIntegrations] = useState(true)

  const loadIntegrations = useCallback(async () => {
    setIsLoadingIntegrations(true)

    try {
      const response = await integrationService.listIntegrations()
      setIntegrations(response)
    } catch (error) {
      setIntegrations([])
      toast.apiError(error, t("fetch_error"))
    } finally {
      setIsLoadingIntegrations(false)
    }
  }, [t])

  useEffect(() => {
    void loadIntegrations()
  }, [loadIntegrations])

  return (
    <ScreenGuard screenKey="admin.integracoes">
      <div className="flex flex-col gap-4">
        <div className="@container/main mt-8 px-4 lg:mt-12 lg:px-6">
          <h2 className="mb-2 text-3xl font-bold tracking-tight">{t("title")}</h2>
          <p className="mb-6 text-muted-foreground">{t("description")}</p>

          {activeTab === "overview" ? (
            <StatCards integrations={integrations} isLoading={isLoadingIntegrations} />
          ) : null}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8 w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">{t("tabs.overview")}</TabsTrigger>
              <TabsTrigger value="studio">{t("tabs.studio")}</TabsTrigger>
              <TabsTrigger value="lpr">{t("tabs.lpr_management")}</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <PlateSendingOverviewTab
                integrations={integrations}
                isLoading={isLoadingIntegrations}
                onReload={loadIntegrations}
              />
            </TabsContent>

            <TabsContent value="studio" className="mt-4">
              <ConfigurableStudioTab
                integrations={integrations}
                isLoadingIntegrations={isLoadingIntegrations}
                onReloadIntegrations={loadIntegrations}
              />
            </TabsContent>

            <TabsContent value="lpr" className="mt-4">
              <LprDetectionsTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ScreenGuard>
  )
}
