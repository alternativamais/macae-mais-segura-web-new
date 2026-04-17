"use client"

import { Mail, MessageCircle, Send, Siren, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslator } from "@/lib/i18n"
import {
  EmailPlateAlertRule,
  EmailRecipient,
  EmailSmtpAccount,
  WhatsappAccount,
  WhatsappRecipient,
} from "@/types/email-integration"

interface StatCardsProps {
  smtpAccounts: EmailSmtpAccount[]
  emailRecipients: EmailRecipient[]
  whatsappAccounts: WhatsappAccount[]
  whatsappRecipients: WhatsappRecipient[]
  rules: EmailPlateAlertRule[]
  isLoading?: boolean
}

export function StatCards({
  smtpAccounts,
  emailRecipients,
  whatsappAccounts,
  whatsappRecipients,
  rules,
  isLoading = false,
}: StatCardsProps) {
  const t = useTranslator("email_integrations.stats")

  const cards = [
    {
      title: t("smtp_accounts"),
      value: smtpAccounts.length,
      icon: Send,
      description: t("smtp_accounts_desc"),
    },
    {
      title: t("email_recipients"),
      value: emailRecipients.length,
      icon: Mail,
      description: t("email_recipients_desc"),
    },
    {
      title: t("whatsapp_accounts"),
      value: whatsappAccounts.length,
      icon: MessageCircle,
      description: t("whatsapp_accounts_desc"),
    },
    {
      title: t("whatsapp_recipients"),
      value: whatsappRecipients.length,
      icon: Users,
      description: t("whatsapp_recipients_desc"),
    },
    {
      title: t("rules"),
      value: rules.length,
      icon: Siren,
      description: t("rules_desc"),
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? "--" : card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
