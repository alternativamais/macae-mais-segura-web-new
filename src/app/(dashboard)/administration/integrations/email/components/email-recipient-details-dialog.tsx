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
import { EmailRecipient } from "@/types/email-integration"
import {
  formatEmailIntegrationDateTime,
  getCompanyName,
  getEnabledTag,
} from "./utils"

interface EmailRecipientDetailsDialogProps {
  recipient: EmailRecipient | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EmailRecipientDetailsDialog({
  recipient,
  open,
  onOpenChange,
}: EmailRecipientDetailsDialogProps) {
  const t = useTranslator("email_integrations.recipients.details")
  const tStatus = useTranslator("email_integrations.recipients.status")
  const { companies } = useTenantCompanySelection()
  const locale = t.getLocale()
  const statusLabels = {
    enabled: tStatus("enabled"),
    disabled: tStatus("disabled"),
  }

  if (!recipient) return null

  const companyNameById = new Map(companies.map((company) => [company.id, company.nome]))
  const notInformed = t("not_informed")

  const items = [
    { label: t("labels.name"), value: recipient.name },
    {
      label: t("labels.company"),
      value: getCompanyName(companyNameById, recipient.empresaId, notInformed),
    },
    { label: t("labels.email"), value: recipient.email },
    {
      label: t("labels.status"),
      value: getEnabledTag(recipient.enabled, statusLabels),
    },
    { label: t("labels.description"), value: recipient.description || notInformed },
    {
      label: t("labels.created_at"),
      value: formatEmailIntegrationDateTime(recipient.createdAt, locale),
    },
    {
      label: t("labels.updated_at"),
      value: formatEmailIntegrationDateTime(recipient.updatedAt, locale),
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description", { name: recipient.name })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={`${item.label}-${index}`} className="space-y-3">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <span className="text-sm font-medium text-muted-foreground">{item.label}</span>
                <div className="text-sm sm:max-w-[60%] sm:text-right">{item.value}</div>
              </div>
              {index < items.length - 1 ? <Separator /> : null}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
