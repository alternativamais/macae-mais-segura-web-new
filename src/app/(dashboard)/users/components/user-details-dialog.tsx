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
import { Role } from "@/types/role"
import { User } from "@/types/user"
import { parseISO } from "date-fns"
import { getUserCompanyRoleSummary, getUserCompanySummary, getUserRoleName } from "./utils"

interface UserDetailsDialogProps {
  user: User | null
  rolesById: Map<number, Role>
  companiesById: Map<number, Empresa>
  open: boolean
  onOpenChange: (open: boolean) => void
}

import { useTranslator } from "@/lib/i18n"

export function UserDetailsDialog({
  user,
  rolesById,
  companiesById,
  open,
  onOpenChange,
}: UserDetailsDialogProps) {
  const t = useTranslator("users.details")
  const tTable = useTranslator("users.table")
  const currentLocale = t.getLocale()

  if (!user) return null

  const items = [
    { label: t("labels.name"), value: user.name || t("not_informed") },
    { label: t("labels.username"), value: user.username || t("not_informed") },
    { label: t("labels.email"), value: user.email },
    { label: t("labels.role"), value: getUserRoleName(user, rolesById, tTable("no_role")) },
    {
      label: tTable("columns.empresa"),
      value: getUserCompanySummary(user, companiesById, t("not_informed")),
    },
    {
      label: t("labels.company_roles"),
      value: getUserCompanyRoleSummary(user, companiesById, rolesById, tTable("no_role"), {
        defaultSuffix: t("default_suffix"),
      }),
    },
    {
      label: t("labels.status"),
      value: String(user.status).toLowerCase() === "active" ? tTable("status_active") : tTable("status_inactive"),
    },
    {
      label: t("labels.birthday"),
      value: user.birthday
        ? formatLocalizedDate(parseISO(user.birthday), currentLocale)
        : t("not_informed"),
    },
    {
      label: t("labels.location_required"),
      value: user.locationRequired ? t("yes") : t("no"),
    },
    { label: t("labels.id"), value: `#${user.id}` },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description", { name: user.name || user.email })}
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
