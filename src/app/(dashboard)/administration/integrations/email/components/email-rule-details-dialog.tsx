"use client"

import { DataTag } from "@/components/shared/data-tag"
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
import { EmailPlateAlertRule } from "@/types/email-integration"
import {
  formatEmailIntegrationDateTime,
  getCompanyName,
  getEnabledTag,
  renderTagList,
} from "./utils"

interface EmailRuleDetailsDialogProps {
  rule: EmailPlateAlertRule | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EmailRuleDetailsDialog({
  rule,
  open,
  onOpenChange,
}: EmailRuleDetailsDialogProps) {
  const t = useTranslator("email_integrations.rules.details")
  const tStatus = useTranslator("email_integrations.rules.status")
  const { companies } = useTenantCompanySelection()
  const locale = t.getLocale()
  const statusLabels = {
    enabled: tStatus("enabled"),
    disabled: tStatus("disabled"),
  }

  if (!rule) return null

  const companyNameById = new Map(companies.map((company) => [company.id, company.nome]))
  const notInformed = t("not_informed")

  const items = [
    { label: t("labels.name"), value: rule.name },
    {
      label: t("labels.company"),
      value: getCompanyName(companyNameById, rule.empresaId, notInformed),
    },
    {
      label: t("labels.status"),
      value: getEnabledTag(rule.enabled, statusLabels),
    },
    { label: t("labels.description"), value: rule.description || notInformed },
    { label: t("labels.camera"), value: rule.camera?.nome || `#${rule.cameraId}` },
    { label: t("labels.smtp_account"), value: rule.smtpAccount?.name || `#${rule.smtpAccountId}` },
    { label: t("labels.cooldown"), value: t("cooldown_value", { seconds: String(rule.cooldownSeconds) }) },
    {
      label: t("labels.plates"),
      value: renderTagList(rule.plates.map((item) => item.plateText), "info", notInformed),
    },
    {
      label: t("labels.recipients"),
      value: (
        <div className="flex flex-wrap justify-end gap-2">
          {rule.recipients.length > 0 ? (
            rule.recipients.map((recipient) => (
              <DataTag key={recipient.id} tone="neutral">
                {recipient.name || recipient.email || `#${recipient.id}`}
              </DataTag>
            ))
          ) : (
            <span>{notInformed}</span>
          )}
        </div>
      ),
    },
    { label: t("labels.subject"), value: rule.subjectTemplate || notInformed },
    {
      label: t("labels.body"),
      value: (
        <div className="max-w-full rounded-md border bg-muted/20 p-3 text-left text-xs whitespace-pre-wrap sm:max-w-[22rem]">
          {rule.bodyTemplate || notInformed}
        </div>
      ),
    },
    {
      label: t("labels.created_at"),
      value: formatEmailIntegrationDateTime(rule.createdAt, locale),
    },
    {
      label: t("labels.updated_at"),
      value: formatEmailIntegrationDateTime(rule.updatedAt, locale),
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description", {
              name: rule.name,
              camera: rule.camera?.nome || `#${rule.cameraId}`,
              recipients: String(rule.recipients.length),
            })}
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
