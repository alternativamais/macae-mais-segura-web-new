"use client"

import { useCallback, useEffect, useState } from "react"
import { ScreenGuard } from "@/components/shared/screen-guard"
import { useTranslator } from "@/lib/i18n"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { sharedAssetService } from "@/services/shared-asset.service"
import { SharedAssetsTreeResponse } from "@/types/shared-asset"
import { SharedAssetsTab } from "./components/shared-assets-tab"

export default function InfrastructurePage() {
  const t = useTranslator("shared_infrastructure")
  const [tree, setTree] = useState<SharedAssetsTreeResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadData = useCallback(async (empresaId?: number) => {
    setIsLoading(true)
    try {
      const data = await sharedAssetService.getTree(
        typeof empresaId === "number" ? { empresaId } : undefined,
      )
      setTree(data)
    } catch (error) {
      toast.apiError(error, t("fetch_error"))
      setTree(null)
    } finally {
      setIsLoading(false)
    }
  }, [t])

  useEffect(() => {
    void loadData()
  }, [loadData])

  return (
    <ScreenGuard screenKey="admin.shared_infrastructure">
      <div className="flex flex-col gap-4">
        <div className="@container/main mt-8 px-4 lg:mt-12 lg:px-6">
          <h2 className="mb-2 text-3xl font-bold tracking-tight">{t("title")}</h2>
          <p className="mb-6 text-muted-foreground">{t("description")}</p>

          <SharedAssetsTab
            data={tree}
            isLoading={isLoading}
            onReload={loadData}
          />
        </div>
      </div>
    </ScreenGuard>
  )
}
