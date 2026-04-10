"use client"

import { useCallback, useEffect, useState } from "react"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTenantCompanySelection } from "@/hooks/use-tenant-company-selection"
import { accessControlService } from "@/services/access-control.service"
import { useTranslator } from "@/lib/i18n"

interface ConfirmBlockIpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ip: string | null
}

export function ConfirmBlockIpDialog({
  open,
  onOpenChange,
  ip,
}: ConfirmBlockIpDialogProps) {
  const [isBlocking, setIsBlocking] = useState(false)
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null)
  const { companies, showCompanySelector, defaultCompanyId } =
    useTenantCompanySelection()
  const t = useTranslator("logs.block_ip_dialog")
  const tCompany = useTranslator("company_field")

  useEffect(() => {
    if (!open) {
      return
    }

    setSelectedCompanyId(defaultCompanyId ?? null)
  }, [defaultCompanyId, open])

  const handleBlock = useCallback(async () => {
    if (!ip) return
    if (showCompanySelector && !selectedCompanyId) {
      toast.warning(tCompany("select_first"))
      return
    }

    setIsBlocking(true)
    try {
      await accessControlService.createIpBlock({
        mode: "single",
        value: ip,
        label: t("default_label"),
        description: t("default_desc", { ip }),
        active: true,
        empresaId: selectedCompanyId ?? undefined,
      })
      toast.success(t("success", { ip }))
      onOpenChange(false)
    } catch (error) {
      toast.apiError(error, t("error"))
    } finally {
      setIsBlocking(false)
    }
  }, [ip, onOpenChange, selectedCompanyId, showCompanySelector, t, tCompany])

  return (
    <ConfirmDialog
      isOpen={open}
      onOpenChange={onOpenChange}
      title={t("title")}
      description={t("desc", { ip: ip || "" })}
      confirmText={t("button_block")}
      cancelText={t("button_cancel")}
      variant="destructive"
      onConfirm={handleBlock}
      isLoading={isBlocking}
    >
      {showCompanySelector ? (
        <div className="space-y-2">
          <Label>{tCompany("label")}</Label>
          <Select
            value={selectedCompanyId ? String(selectedCompanyId) : ""}
            onValueChange={(value) => setSelectedCompanyId(Number(value))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={tCompany("placeholder")} />
            </SelectTrigger>
            <SelectContent>
              {companies.map((company) => (
                <SelectItem key={company.id} value={String(company.id)}>
                  {company.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
    </ConfirmDialog>
  )
}
