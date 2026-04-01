"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatLocalizedDate } from "@/lib/i18n/date"
import { Separator } from "@/components/ui/separator"
import { Empresa } from "@/types/empresa"
import { parseISO } from "date-fns"
import { useTranslator } from "@/lib/i18n"
import { CompanyStatusBadge } from "./status-badges"

interface CompanyDetailsDialogProps {
  company: Empresa | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CompanyDetailsDialog({ company, open, onOpenChange }: CompanyDetailsDialogProps) {
  const t = useTranslator("companies.details")
  const currentLocale = t.getLocale()

  if (!company) return null

  const items = [
    { label: t("labels.name"), value: company.nome || t("not_informed") },
    { label: t("labels.cnpj"), value: company.cnpj || t("not_informed") },
    { 
      label: t("labels.status"), 
      value: <CompanyStatusBadge status={company.status} /> 
    },
    {
      label: t("labels.createdAt"),
      value: company.createdAt
        ? formatLocalizedDate(parseISO(company.createdAt), currentLocale)
        : t("not_informed"),
    },
    {
      label: t("labels.updatedAt"),
      value: company.updatedAt
        ? formatLocalizedDate(parseISO(company.updatedAt), currentLocale)
        : t("not_informed"),
    },
    { label: t("labels.id"), value: `#${company.id}` },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description", { name: company.nome })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={`${item.label}-${index}`} className="space-y-3">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <span className="text-sm font-medium text-muted-foreground">{item.label}</span>
                <span className="text-sm sm:max-w-[60%] sm:text-right">{item.value}</span>
              </div>
              {index < items.length - 1 ? <Separator /> : null}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
