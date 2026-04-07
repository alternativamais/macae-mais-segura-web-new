"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ScreenGuard } from "@/components/shared/screen-guard"
import { useTranslator } from "@/lib/i18n"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { integrationService } from "@/services/integration.service"
import { Integration } from "@/types/integration"
import { PlateSendingOverviewTab } from "./components/plate-sending-tab"
import { IntegrationManagementTab } from "./components/integration-management-tab"

export default function PlateSendingPage() {
  const t = useTranslator("plate_sending")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
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

          {selectedIntegration ? (
            <div className="mt-8">
              <IntegrationManagementTab integration={selectedIntegration} />
            </div>
          ) : (
            <div className="mt-8">
              <PlateSendingOverviewTab
                integrations={integrations}
                isLoading={isLoadingIntegrations}
                onReload={loadIntegrations}
                onEnterIntegration={handleEnterIntegration}
              />
            </div>
          )}
        </div>
      </div>
    </ScreenGuard>
  )
}
