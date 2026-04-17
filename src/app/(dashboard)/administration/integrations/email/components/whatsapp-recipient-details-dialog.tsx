"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { useTenantCompanySelection } from "@/hooks/use-tenant-company-selection"
import { useTranslator } from "@/lib/i18n"
import { WhatsappRecipient } from "@/types/email-integration"
import {
  formatEmailIntegrationDateTime,
  getCompanyName,
  getEnabledTag,
  getWhatsappRecipientTypeLabel,
} from "./utils"

interface WhatsappRecipientDetailsDialogProps {
  recipient: WhatsappRecipient | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WhatsappRecipientDetailsDialog({
  recipient,
  open,
  onOpenChange,
}: WhatsappRecipientDetailsDialogProps) {
  const t = useTranslator("email_integrations.whatsapp_recipients.details")
  const tStatus = useTranslator("email_integrations.whatsapp_recipients.status")
  const { companies } = useTenantCompanySelection()
  const locale = t.getLocale()

  if (!recipient) return null

  const companyNameById = new Map(companies.map((company) => [company.id, company.nome]))
  const notInformed = t("not_informed")
  const typeLabels = {
    manual: t("types.manual_phone"),
    contact: t("types.contact"),
    group: t("types.group"),
  }

  const items = [
    { label: t("labels.name"), value: recipient.name },
    { label: t("labels.company"), value: getCompanyName(companyNameById, recipient.empresaId, notInformed) },
    { label: t("labels.account"), value: recipient.account?.name || notInformed },
    {
      label: t("labels.type"),
      value: getWhatsappRecipientTypeLabel(recipient.type, typeLabels),
    },
    { label: t("labels.phone"), value: recipient.phoneNumber || notInformed },
    { label: t("labels.chat_id"), value: recipient.chatId || notInformed },
    { label: t("labels.source"), value: recipient.source || notInformed },
    {
      label: t("labels.enabled"),
      value: getEnabledTag(recipient.enabled, {
        enabled: tStatus("enabled"),
        disabled: tStatus("disabled"),
      }),
    },
    { label: t("labels.description"), value: recipient.description || notInformed },
    { label: t("labels.updated_at"), value: formatEmailIntegrationDateTime(recipient.updatedAt, locale) },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description", { name: recipient.name })}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={`${item.label}-${index}`} className="space-y-3">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <span className="text-sm font-medium text-muted-foreground">{item.label}</span>
                <div className="text-sm sm:max-w-[60%] sm:text-right break-all">{item.value}</div>
              </div>
              {index < items.length - 1 ? <Separator /> : null}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
