"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { ScreenGuard } from "@/components/shared/screen-guard"
import { useTranslator } from "@/lib/i18n"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { integrationService } from "@/services/integration.service"
import { Integration } from "@/types/integration"
import { IntegrationManagementTab } from "../components/integration-management-tab"

export default function PlateSendingIntegrationPage() {
  const t = useTranslator("plate_sending")
  const params = useParams<{ integrationCode: string }>()
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [isLoadingIntegrations, setIsLoadingIntegrations] = useState(true)

  const integrationCode = params.integrationCode?.trim().toLowerCase() || ""

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
      integrations.find(
        (integration) =>
          integration.code.trim().toLowerCase() === integrationCode,
      ) || null,
    [integrationCode, integrations],
  )

  return (
    <ScreenGuard screenKey="admin.integracoes">
      <div className="flex flex-col gap-4">
        <div className="@container/main mt-8 px-4 lg:mt-12 lg:px-6">
          <h2 className="mb-2 text-3xl font-bold tracking-tight">{t("title")}</h2>
          <p className="mb-6 text-muted-foreground">{t("description")}</p>

          {selectedIntegration ? (
            <IntegrationManagementTab integration={selectedIntegration} />
          ) : (
            <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
              {isLoadingIntegrations ? t("loading") : t("empty")}
            </div>
          )}
        </div>
      </div>
    </ScreenGuard>
  )
}
