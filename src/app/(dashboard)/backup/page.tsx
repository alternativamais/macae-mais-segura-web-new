"use client"

import { useState } from "react"
import { ScreenGuard } from "@/components/shared/screen-guard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BackupRecord, BackupSettings } from "@/types/backup"
import { BackupHistoryTab } from "./components/backup-history-tab"
import { BackupSettingsTab } from "./components/backup-settings-tab"
import { StatCards } from "./components/stat-cards"
import { useTranslator } from "@/lib/i18n"

export default function BackupPage() {
  const [backups, setBackups] = useState<BackupRecord[]>([])
  const [settings, setSettings] = useState<BackupSettings | null>(null)
  const [activeTab, setActiveTab] = useState("history")
  const t = useTranslator("backup")

  return (
    <ScreenGuard screenKey="admin.backup">
      <div className="flex flex-col gap-4">
        <div className="@container/main mt-8 px-4 lg:mt-12 lg:px-6">
          <h2 className="mb-2 text-3xl font-bold tracking-tight">{t("title")}</h2>
          <p className="mb-6 text-muted-foreground">
            {t("description")}
          </p>

          <StatCards backups={backups} settings={settings} isLoading={false} />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8 w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="history">{t("tabs.history")}</TabsTrigger>
              <TabsTrigger value="settings">{t("tabs.settings")}</TabsTrigger>
            </TabsList>

            <TabsContent value="history" className="mt-4">
              <BackupHistoryTab onRefreshComplete={setBackups} />
            </TabsContent>

            <TabsContent value="settings" className="mt-4">
              <BackupSettingsTab onRefreshComplete={setSettings} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ScreenGuard>
  )
}
