"use client"

import { ScreenGuard } from "@/components/shared/screen-guard"
import { useTranslator } from "@/lib/i18n"
import { CallCenterTab } from "./components/call-center-tab"

export default function CallCenterPage() {
  const t = useTranslator("call_center")

  return (
    <ScreenGuard screenKey="admin.call_center">
      <div className="flex flex-col gap-4">
        <div className="@container/main mt-8 px-4 lg:mt-12 lg:px-6">
          <h2 className="mb-2 text-3xl font-bold tracking-tight">{t("title")}</h2>
          <p className="mb-6 text-muted-foreground">{t("description")}</p>

          <div className="mt-8">
            <CallCenterTab />
          </div>
        </div>
      </div>
    </ScreenGuard>
  )
}
