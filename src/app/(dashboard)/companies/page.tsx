"use client"


import { ScreenGuard } from "@/components/shared/screen-guard"
import { useTranslator } from "@/lib/i18n"
import { CompaniesTab } from "./components/companies-tab"

export default function CompaniesPage() {
  const t = useTranslator("companies")

  return (
    <ScreenGuard screenKey="admin.users">
      <div className="flex flex-col gap-4">
        <div className="@container/main px-4 lg:px-6 mt-8 lg:mt-12">
          <h2 className="mb-2 text-3xl font-bold tracking-tight">{t("title")}</h2>
          <p className="mb-6 text-muted-foreground">
            {t("description")}
          </p>

          <div className="mt-8">
            <CompaniesTab />
          </div>
        </div>
      </div>
    </ScreenGuard>
  )
}
