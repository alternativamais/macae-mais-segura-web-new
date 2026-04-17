"use client"

import Image from "next/image"
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
import { WhatsappAccount } from "@/types/email-integration"
import {
  formatEmailIntegrationDateTime,
  getCompanyName,
  getEnabledTag,
  getWhatsappSessionTag,
} from "./utils"

interface WhatsappAccountDetailsDialogProps {
  account: WhatsappAccount | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WhatsappAccountDetailsDialog({
  account,
  open,
  onOpenChange,
}: WhatsappAccountDetailsDialogProps) {
  const t = useTranslator("email_integrations.whatsapp_accounts.details")
  const tStatus = useTranslator("email_integrations.whatsapp_accounts.status")
  const tSession = useTranslator("email_integrations.whatsapp_accounts.session")
  const { companies } = useTenantCompanySelection()
  const locale = t.getLocale()

  if (!account) return null

  const companyNameById = new Map(companies.map((company) => [company.id, company.nome]))
  const notInformed = t("not_informed")

  const sessionLabels = {
    disconnected: tSession("disconnected"),
    initializing: tSession("initializing"),
    qr_required: tSession("qr_required"),
    authenticated: tSession("authenticated"),
    ready: tSession("ready"),
    auth_failure: tSession("auth_failure"),
  }

  const items = [
    { label: t("labels.name"), value: account.name },
    { label: t("labels.company"), value: getCompanyName(companyNameById, account.empresaId, notInformed) },
    {
      label: t("labels.enabled"),
      value: getEnabledTag(account.enabled, {
        enabled: tStatus("enabled"),
        disabled: tStatus("disabled"),
      }),
    },
    { label: t("labels.phone"), value: account.phoneNumber || notInformed },
    { label: t("labels.display_name"), value: account.displayName || notInformed },
    {
      label: t("labels.session"),
      value: getWhatsappSessionTag(account.sessionStatus, sessionLabels),
    },
    { label: t("labels.last_error"), value: account.lastError || notInformed },
    { label: t("labels.notes"), value: account.notes || notInformed },
    { label: t("labels.updated_at"), value: formatEmailIntegrationDateTime(account.updatedAt, locale) },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description", { name: account.name })}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {account.qrCodeDataUrl ? (
            <div className="flex justify-center rounded-xl border bg-muted/20 p-4">
              <Image
                src={account.qrCodeDataUrl}
                alt={t("qr_alt")}
                width={240}
                height={240}
                className="rounded-md border bg-white p-2"
                unoptimized
              />
            </div>
          ) : null}

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
