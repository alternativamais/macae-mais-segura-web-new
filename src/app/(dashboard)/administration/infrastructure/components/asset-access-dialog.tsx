"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2 } from "lucide-react"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { DataTag } from "@/components/shared/data-tag"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { useTranslator } from "@/lib/i18n"
import { sharedAssetService } from "@/services/shared-asset.service"
import { SharedAssetCompany, SharedAssetSummary } from "@/types/shared-asset"

interface AssetAccessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  asset: SharedAssetSummary | null
  companies: SharedAssetCompany[]
  onSuccess: () => void | Promise<void>
}

function getAssetTypeLabel(
  t: ReturnType<typeof useTranslator>,
  type: SharedAssetSummary["type"],
) {
  switch (type) {
    case "point":
      return t("types.point")
    case "totem":
      return t("types.totem")
    case "camera":
      return t("types.camera")
    case "network_equipment":
      return t("types.network_equipment")
    case "smart_switch":
      return t("types.smart_switch")
    case "climate_equipment":
      return t("types.climate_equipment")
  }
}

export function AssetAccessDialog({
  open,
  onOpenChange,
  asset,
  companies,
  onSuccess,
}: AssetAccessDialogProps) {
  const t = useTranslator("shared_infrastructure")
  const tPanel = useTranslator("shared_infrastructure.panel")
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [applyToDescendants, setApplyToDescendants] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!asset) {
      setSelectedIds([])
      setApplyToDescendants(false)
      return
    }

    const ownerId = asset.ownerEmpresaId ? [asset.ownerEmpresaId] : []
    setSelectedIds(Array.from(new Set([...ownerId, ...asset.sharedCompanyIds])))
    setApplyToDescendants(false)
  }, [asset])

  const selectableCompanies = useMemo(
    () => companies.filter((company) => company.id !== asset?.ownerEmpresaId),
    [asset?.ownerEmpresaId, companies],
  )

  const toggleCompany = (companyId: number, checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current)

      if (checked) {
        next.add(companyId)
      } else {
        next.delete(companyId)
      }

      if (asset?.ownerEmpresaId) {
        next.add(asset.ownerEmpresaId)
      }

      return Array.from(next)
    })
  }

  const handleSubmit = async () => {
    if (!asset) return

    setIsSubmitting(true)

    try {
      await sharedAssetService.updateCompanyAccess(asset.type, asset.id, {
        companyIds: selectedIds,
        applyToDescendants,
      })

      toast.success(tPanel("success"))
      await onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast.apiError(error, tPanel("error"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl">
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle>{tPanel("title")}</SheetTitle>
          <SheetDescription>
            {asset
              ? tPanel("description", { asset: asset.title })
              : tPanel("description_empty")}
          </SheetDescription>
        </SheetHeader>

        {asset ? (
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            <div className="space-y-3 rounded-lg border bg-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold">{asset.title}</h3>
                <DataTag tone="neutral">{getAssetTypeLabel(t, asset.type)}</DataTag>
                {asset.status ? (
                  <DataTag tone={asset.status === "active" ? "success" : "neutral"}>
                    {asset.status === "active" ? t("status.active") : t("status.inactive")}
                  </DataTag>
                ) : null}
              </div>

              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="font-medium text-muted-foreground">{tPanel("labels.owner_company")}</p>
                  <p>{asset.ownerEmpresaNome || t("not_informed")}</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-muted-foreground">{tPanel("labels.shared_companies")}</p>
                  <p>{t("shared_count", { count: asset.sharedCompanyIds.length })}</p>
                </div>
              </div>

              {asset.subtitle ? (
                <>
                  <Separator />
                  <div className="space-y-1 text-sm">
                    <p className="font-medium text-muted-foreground">{tPanel("labels.reference")}</p>
                    <p>{asset.subtitle}</p>
                  </div>
                </>
              ) : null}
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-sm font-medium">{tPanel("companies_label")}</Label>
                <p className="text-sm text-muted-foreground">{tPanel("companies_description")}</p>
              </div>

              <div className="space-y-2 rounded-lg border bg-card p-3">
                {asset.ownerEmpresaNome ? (
                  <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2">
                    <div className="space-y-0.5">
                      <p className="font-medium">{asset.ownerEmpresaNome}</p>
                      <p className="text-xs text-muted-foreground">{tPanel("owner_locked")}</p>
                    </div>
                    <Checkbox checked disabled />
                  </div>
                ) : null}

                {selectableCompanies.length > 0 ? (
                  selectableCompanies.map((company) => {
                    const checked = selectedIds.includes(company.id)

                    return (
                      <label
                        key={company.id}
                        className="flex cursor-pointer items-center justify-between rounded-md border px-3 py-2 transition-colors hover:bg-muted/30"
                      >
                        <span className="font-medium">{company.nome}</span>
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) => toggleCompany(company.id, Boolean(value))}
                        />
                      </label>
                    )
                  })
                ) : (
                  <div className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
                    {tPanel("empty_companies")}
                  </div>
                )}
              </div>
            </div>

            {asset.type === "point" || asset.type === "totem" ? (
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-medium">{tPanel("apply_descendants.title")}</p>
                    <p className="text-sm text-muted-foreground">
                      {tPanel("apply_descendants.description")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <DataTag tone={applyToDescendants ? "success" : "neutral"}>
                      {applyToDescendants ? tPanel("status.enabled") : tPanel("status.disabled")}
                    </DataTag>
                    <Switch checked={applyToDescendants} onCheckedChange={setApplyToDescendants} />
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <SheetFooter className="border-t px-6 py-4">
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {tPanel("actions.cancel")}
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={!asset || isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {tPanel("actions.save")}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
