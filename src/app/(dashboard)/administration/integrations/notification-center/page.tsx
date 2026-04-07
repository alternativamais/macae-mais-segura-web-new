"use client"

import { ScreenGuard } from "@/components/shared/screen-guard"
import { useTranslator } from "@/lib/i18n"
import { NotificationCenterTabs } from "./components/notification-center-tabs"

export default function NotificationCenterPage() {
  const t = useTranslator("notification_center")

  return (
    <ScreenGuard screenKey="admin.notification_center">
      <div className="flex flex-col gap-4">
        <div className="@container/main mt-8 px-4 lg:mt-12 lg:px-6">
          <h2 className="mb-2 text-3xl font-bold tracking-tight">{t("title")}</h2>
          <p className="mb-6 text-muted-foreground">{t("description")}</p>

          <div className="mt-8">
            <NotificationCenterTabs />
          </div>
        </div>
      </div>
    </ScreenGuard>
  )
}
