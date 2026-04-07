"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScreenGuard } from "@/components/shared/screen-guard"
import { useTranslator } from "@/lib/i18n"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { integrationService } from "@/services/integration.service"
import { Integration } from "@/types/integration"
import { PlateSendingOverviewTab } from "./components/plate-sending-tab"
import { IntegrationManagementTab } from "./components/integration-management-tab"
import { LprDetectionsTab } from "./components/lpr-detections-tab"
import { StatCards } from "./components/stat-cards"

export default function PlateSendingPage() {
  const t = useTranslator("plate_sending")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("overview")
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [isLoadingIntegrations, setIsLoadingIntegrations] = useState(true)
  const selectedIntegrationCode = searchParams.get("integration")?.trim().toLowerCase() || null

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

  const selectedIntegration = useMemo(
    () =>
      selectedIntegrationCode
        ? integrations.find(
            (integration) =>
              integration.code.trim().toLowerCase() === selectedIntegrationCode,
          ) || null
        : null,
    [integrations, selectedIntegrationCode],
  )

  useEffect(() => {
    if (!selectedIntegrationCode) return
    if (isLoadingIntegrations) return

    const stillExists = integrations.some(
      (integration) =>
        integration.code.trim().toLowerCase() === selectedIntegrationCode,
    )

    if (!stillExists) {
      const params = new URLSearchParams(searchParams.toString())
      params.delete("integration")
      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname)
    }
  }, [
    integrations,
    isLoadingIntegrations,
    pathname,
    router,
    searchParams,
    selectedIntegrationCode,
  ])

  const handleEnterIntegration = useCallback(
    (integration: Integration) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("integration", integration.code.trim().toLowerCase())
      router.replace(`${pathname}?${params.toString()}`)
    },
    [pathname, router, searchParams],
  )

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
              <TabsTrigger value="lpr">{t("tabs.lpr_management")}</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              {selectedIntegration ? (
                <IntegrationManagementTab integration={selectedIntegration} />
              ) : (
                <PlateSendingOverviewTab
                  integrations={integrations}
                  isLoading={isLoadingIntegrations}
                  onReload={loadIntegrations}
                  onEnterIntegration={handleEnterIntegration}
                />
              )}
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
