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
import { EmailSmtpAccount } from "@/types/email-integration"
import {
  formatEmailIntegrationDateTime,
  getCompanyName,
  getEnabledTag,
  getEnvironmentTag,
  getSecurityLabel,
} from "./utils"

interface SmtpAccountDetailsDialogProps {
  account: EmailSmtpAccount | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SmtpAccountDetailsDialog({
  account,
  open,
  onOpenChange,
}: SmtpAccountDetailsDialogProps) {
  const t = useTranslator("email_integrations.smtp.details")
  const tStatus = useTranslator("email_integrations.smtp.status")
  const tEnvironment = useTranslator("email_integrations.smtp.environment")
  const { companies } = useTenantCompanySelection()
  const locale = t.getLocale()
  const statusLabels = {
    enabled: tStatus("enabled"),
    disabled: tStatus("disabled"),
  }
  const environmentLabels = {
    prod: tEnvironment("prod"),
    dev: tEnvironment("dev"),
  }

  if (!account) return null

  const companyNameById = new Map(companies.map((company) => [company.id, company.nome]))
  const notInformed = t("not_informed")

  const items = [
    { label: t("labels.name"), value: account.name },
    {
      label: t("labels.company"),
      value: getCompanyName(companyNameById, account.empresaId, notInformed),
    },
    {
      label: t("labels.status"),
      value: getEnabledTag(account.enabled, statusLabels),
    },
    {
      label: t("labels.environment"),
      value: getEnvironmentTag(account.environmentTag, environmentLabels),
    },
    { label: t("labels.host"), value: account.host },
    { label: t("labels.port"), value: String(account.port) },
    {
      label: t("labels.security"),
      value: getSecurityLabel(account.secure, {
        secure: t("security.secure"),
        starttls: t("security.starttls"),
      }),
    },
    { label: t("labels.username"), value: account.username },
    { label: t("labels.from_email"), value: account.fromEmail },
    { label: t("labels.from_name"), value: account.fromName || notInformed },
    { label: t("labels.reply_to"), value: account.replyToEmail || notInformed },
    { label: t("labels.notes"), value: account.notes || notInformed },
    {
      label: t("labels.created_at"),
      value: formatEmailIntegrationDateTime(account.createdAt, locale),
    },
    {
      label: t("labels.updated_at"),
      value: formatEmailIntegrationDateTime(account.updatedAt, locale),
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description", { name: account.name })}
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
