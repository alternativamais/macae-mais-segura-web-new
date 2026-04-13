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
import { resolveCompanyLogoUrl } from "@/lib/company-logo"

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

  const fullLogoUrl = resolveCompanyLogoUrl(company.logoUrl)
  const iconLogoUrl = resolveCompanyLogoUrl(company.logoIconUrl)
  const lightLogoUrl = resolveCompanyLogoUrl(company.logoLightUrl)
  const darkLogoUrl = resolveCompanyLogoUrl(company.logoDarkUrl)
  const squareLightLogoUrl = resolveCompanyLogoUrl(company.logoSquareLightUrl)
  const squareDarkLogoUrl = resolveCompanyLogoUrl(company.logoSquareDarkUrl)

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
          {(fullLogoUrl || iconLogoUrl || lightLogoUrl || darkLogoUrl || squareLightLogoUrl || squareDarkLogoUrl) ? (
            <>
              <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/20 p-3">
                {iconLogoUrl ? (
                  <img
                    src={iconLogoUrl}
                    alt={company.nome}
                    className="size-12 rounded-lg object-contain"
                  />
                ) : null}
                {fullLogoUrl ? (
                  <img
                    src={fullLogoUrl}
                    alt={company.nome}
                    className="max-h-10 max-w-[220px] object-contain"
                  />
                ) : null}
                {lightLogoUrl ? (
                  <img
                    src={lightLogoUrl}
                    alt={`${company.nome} tema claro`}
                    className="max-h-10 max-w-[220px] rounded bg-white p-1 object-contain"
                  />
                ) : null}
                {darkLogoUrl ? (
                  <img
                    src={darkLogoUrl}
                    alt={`${company.nome} tema escuro`}
                    className="max-h-10 max-w-[220px] rounded bg-zinc-950 p-1 object-contain"
                  />
                ) : null}
                {squareLightLogoUrl ? (
                  <img
                    src={squareLightLogoUrl}
                    alt={`${company.nome} quadrada tema claro`}
                    className="size-12 rounded bg-white p-1 object-contain"
                  />
                ) : null}
                {squareDarkLogoUrl ? (
                  <img
                    src={squareDarkLogoUrl}
                    alt={`${company.nome} quadrada tema escuro`}
                    className="size-12 rounded bg-zinc-950 p-1 object-contain"
                  />
                ) : null}
              </div>
              <Separator />
            </>
          ) : null}

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
