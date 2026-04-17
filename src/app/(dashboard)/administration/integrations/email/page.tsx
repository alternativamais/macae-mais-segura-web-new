"use client"

import { useCallback, useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScreenGuard } from "@/components/shared/screen-guard"
import { useTranslator } from "@/lib/i18n"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { cameraService } from "@/services/camera.service"
import { emailIntegrationService } from "@/services/email-integration.service"
import {
  EmailPlateAlertRule,
  EmailRecipient,
  EmailSmtpAccount,
  WhatsappAccount,
  WhatsappRecipient,
} from "@/types/email-integration"
import { Camera } from "@/types/camera"
import { EmailRecipientsTab } from "./components/email-recipients-tab"
import { EmailRulesTab } from "./components/email-rules-tab"
import { SmtpAccountsTab } from "./components/smtp-accounts-tab"
import { StatCards } from "./components/stat-cards"
import { WhatsappAccountsTab } from "./components/whatsapp-accounts-tab"
import { WhatsappRecipientsTab } from "./components/whatsapp-recipients-tab"

export default function EmailIntegrationsPage() {
  const t = useTranslator("email_integrations")
  const [activeTab, setActiveTab] = useState("rules")
  const [smtpAccounts, setSmtpAccounts] = useState<EmailSmtpAccount[]>([])
  const [emailRecipients, setEmailRecipients] = useState<EmailRecipient[]>([])
  const [whatsappAccounts, setWhatsappAccounts] = useState<WhatsappAccount[]>([])
  const [whatsappRecipients, setWhatsappRecipients] = useState<WhatsappRecipient[]>([])
  const [rules, setRules] = useState<EmailPlateAlertRule[]>([])
  const [cameras, setCameras] = useState<Camera[]>([])
  const [isLoadingShared, setIsLoadingShared] = useState(true)

  const loadSharedData = useCallback(async () => {
    setIsLoadingShared(true)

    try {
      const [smtpData, emailRecipientData, whatsappAccountData, whatsappRecipientData, ruleData, cameraData] = await Promise.all([
        emailIntegrationService.listSmtpAccounts(),
        emailIntegrationService.listRecipients(),
        emailIntegrationService.listWhatsappAccounts(),
        emailIntegrationService.listWhatsappRecipients(),
        emailIntegrationService.listRules(),
        cameraService.findAll({ page: 1, limit: 500 }),
      ])

      setSmtpAccounts(smtpData)
      setEmailRecipients(emailRecipientData)
      setWhatsappAccounts(whatsappAccountData)
      setWhatsappRecipients(whatsappRecipientData)
      setRules(ruleData)
      setCameras(cameraData.data || [])
    } catch (error) {
      toast.apiError(error, t("fetch_error"))
      setSmtpAccounts([])
      setEmailRecipients([])
      setWhatsappAccounts([])
      setWhatsappRecipients([])
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
    setEmailRecipients(data)
  }, [])

  const loadWhatsappAccounts = useCallback(async () => {
    const data = await emailIntegrationService.listWhatsappAccounts()
    setWhatsappAccounts(data)
  }, [])

  const loadWhatsappRecipients = useCallback(async () => {
    const data = await emailIntegrationService.listWhatsappRecipients()
    setWhatsappRecipients(data)
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
            emailRecipients={emailRecipients}
            whatsappAccounts={whatsappAccounts}
            whatsappRecipients={whatsappRecipients}
            rules={rules}
            isLoading={isLoadingShared}
          />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
            <TabsList className="h-auto flex-wrap justify-start gap-2 rounded-lg bg-muted/60 p-1">
              <TabsTrigger value="rules">{t("tabs.rules")}</TabsTrigger>
              <TabsTrigger value="smtp">{t("tabs.smtp_accounts")}</TabsTrigger>
              <TabsTrigger value="recipients">{t("tabs.recipients")}</TabsTrigger>
              <TabsTrigger value="whatsapp_accounts">{t("tabs.whatsapp_accounts")}</TabsTrigger>
              <TabsTrigger value="whatsapp_recipients">{t("tabs.whatsapp_recipients")}</TabsTrigger>
            </TabsList>

            <TabsContent value="rules" className="mt-0">
              <EmailRulesTab
                rules={rules}
                smtpAccounts={smtpAccounts}
                recipients={emailRecipients}
                whatsappAccounts={whatsappAccounts}
                whatsappRecipients={whatsappRecipients}
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
                recipients={emailRecipients}
                isLoading={isLoadingShared}
                onReload={loadRecipients}
              />
            </TabsContent>

            <TabsContent value="whatsapp_accounts" className="mt-0">
              <WhatsappAccountsTab
                accounts={whatsappAccounts}
                isLoading={isLoadingShared}
                onReload={loadWhatsappAccounts}
                onRefreshRecipients={loadWhatsappRecipients}
              />
            </TabsContent>

            <TabsContent value="whatsapp_recipients" className="mt-0">
              <WhatsappRecipientsTab
                recipients={whatsappRecipients}
                accounts={whatsappAccounts}
                isLoading={isLoadingShared}
                onReload={loadWhatsappRecipients}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ScreenGuard>
  )
}
