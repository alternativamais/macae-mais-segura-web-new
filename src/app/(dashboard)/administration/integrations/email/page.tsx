"use client"

import { useCallback, useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScreenGuard } from "@/components/shared/screen-guard"
import { useTranslator } from "@/lib/i18n"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { cameraService } from "@/services/camera.service"
import { emailIntegrationService } from "@/services/email-integration.service"
import { EmailPlateAlertRule, EmailRecipient, EmailSmtpAccount } from "@/types/email-integration"
import { Camera } from "@/types/camera"
import { EmailRecipientsTab } from "./components/email-recipients-tab"
import { EmailRulesTab } from "./components/email-rules-tab"
import { SmtpAccountsTab } from "./components/smtp-accounts-tab"
import { StatCards } from "./components/stat-cards"

export default function EmailIntegrationsPage() {
  const t = useTranslator("email_integrations")
  const [activeTab, setActiveTab] = useState("rules")
  const [smtpAccounts, setSmtpAccounts] = useState<EmailSmtpAccount[]>([])
  const [recipients, setRecipients] = useState<EmailRecipient[]>([])
  const [rules, setRules] = useState<EmailPlateAlertRule[]>([])
  const [cameras, setCameras] = useState<Camera[]>([])
  const [isLoadingShared, setIsLoadingShared] = useState(true)

  const loadSharedData = useCallback(async () => {
    setIsLoadingShared(true)

    try {
      const [smtpData, recipientData, ruleData, cameraData] = await Promise.all([
        emailIntegrationService.listSmtpAccounts(),
        emailIntegrationService.listRecipients(),
        emailIntegrationService.listRules(),
        cameraService.findAll({ page: 1, limit: 500 }),
      ])

      setSmtpAccounts(smtpData)
      setRecipients(recipientData)
      setRules(ruleData)
      setCameras(cameraData.data || [])
    } catch (error) {
      toast.apiError(error, t("fetch_error"))
      setSmtpAccounts([])
      setRecipients([])
      setRules([])
      setCameras([])
    } finally {
      setIsLoadingShared(false)
    }
  }, [t])

  const loadSmtpAccounts = useCallback(async () => {
    const data = await emailIntegrationService.listSmtpAccounts()
    setSmtpAccounts(data)
  }, [])

  const loadRecipients = useCallback(async () => {
    const data = await emailIntegrationService.listRecipients()
    setRecipients(data)
  }, [])

  const loadRules = useCallback(async () => {
    const data = await emailIntegrationService.listRules()
    setRules(data)
  }, [])

  useEffect(() => {
    void loadSharedData()
  }, [loadSharedData])

  return (
    <ScreenGuard screenKey="admin.email_integrations">
      <div className="@container/main mt-8 px-4 lg:mt-12 lg:px-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">{t("title")}</h2>
            <p className="text-muted-foreground">{t("description")}</p>
          </div>

          <StatCards
            smtpAccounts={smtpAccounts}
            recipients={recipients}
            rules={rules}
            isLoading={isLoadingShared}
          />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
            <TabsList className="h-auto flex-wrap justify-start gap-2 rounded-lg bg-muted/60 p-1">
              <TabsTrigger value="rules">{t("tabs.rules")}</TabsTrigger>
              <TabsTrigger value="smtp">{t("tabs.smtp_accounts")}</TabsTrigger>
              <TabsTrigger value="recipients">{t("tabs.recipients")}</TabsTrigger>
            </TabsList>

            <TabsContent value="rules" className="mt-0">
              <EmailRulesTab
                rules={rules}
                smtpAccounts={smtpAccounts}
                recipients={recipients}
                cameras={cameras}
                isLoading={isLoadingShared}
                onReloadRules={loadRules}
              />
            </TabsContent>

            <TabsContent value="smtp" className="mt-0">
              <SmtpAccountsTab
                smtpAccounts={smtpAccounts}
                isLoading={isLoadingShared}
                onReload={loadSmtpAccounts}
              />
            </TabsContent>

            <TabsContent value="recipients" className="mt-0">
              <EmailRecipientsTab
                recipients={recipients}
                isLoading={isLoadingShared}
                onReload={loadRecipients}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ScreenGuard>
  )
}
