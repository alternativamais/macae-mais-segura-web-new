"use client"

import { useEffect, useRef, useState } from "react"
import { ImagePlus, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { empresaService } from "@/services/empresa.service"
import { CompanyAssetDraft, Empresa } from "@/types/empresa"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useTranslator } from "@/lib/i18n"
import {
  COMPANY_ASSET_TYPE_ORDER,
  getCompanyAssetUrl,
} from "@/lib/company-assets"
import { resolveCompanyLogoUrl } from "@/lib/company-logo"
import { CompanyAssetsDialog } from "./company-assets-dialog"
import {
  CompanyDropdownPreview,
  CompanyMapPinPreview,
  CompanySelectorButtonPreview,
} from "./company-branding-preview"

interface CompanyFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void | Promise<void>
  company?: Empresa
}

function revokeDraftPreviews(draftAssets: Partial<Record<string, CompanyAssetDraft>>) {
  Object.values(draftAssets).forEach((draft) => {
    if (draft?.previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(draft.previewUrl)
    }
  })
}

export function CompanyFormDialog({
  open,
  onOpenChange,
  onSuccess,
  company,
}: CompanyFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAssetsDialogOpen, setIsAssetsDialogOpen] = useState(false)
  const [draftAssets, setDraftAssets] = useState<
    Partial<Record<typeof COMPANY_ASSET_TYPE_ORDER[number], CompanyAssetDraft>>
  >({})
  const draftAssetsRef = useRef(draftAssets)
  const [managedCompany, setManagedCompany] = useState<Empresa | undefined>(company)
  const isEdit = !!company

  const t = useTranslator("companies.form")
  const tTable = useTranslator("companies.table")
  const tAssets = useTranslator("companies.assets")

  const companyFormSchema = z.object({
    nome: z.string().trim().min(2, t("validations.name_min")),
    cnpj: z.string().trim().optional().nullable(),
    status: z.enum(["active", "inactive"]),
  })

  type CompanyFormValues = z.infer<typeof companyFormSchema>

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema) as any,
    defaultValues: {
      nome: "",
      cnpj: "",
      status: "active",
    },
  })

  useEffect(() => {
    if (!open) {
      return
    }

    form.reset({
      nome: company?.nome || "",
      cnpj: company?.cnpj || "",
      status: company?.status || "active",
    })

    setManagedCompany(company)
    setDraftAssets((current) => {
      revokeDraftPreviews(current)
      return {}
    })
  }, [company, form, open])

  useEffect(() => {
    draftAssetsRef.current = draftAssets
  }, [draftAssets])

  useEffect(() => {
    return () => {
      revokeDraftPreviews(draftAssetsRef.current)
    }
  }, [])

  const onSubmit = async (values: CompanyFormValues) => {
    setIsSubmitting(true)

    try {
      if (isEdit && company) {
        await empresaService.update(company.id, values)
        toast.success(t("notifications.update_success"))
      } else {
        const createdCompany = await empresaService.create(values)

        for (const assetType of COMPANY_ASSET_TYPE_ORDER) {
          const draftAsset = draftAssets[assetType]
          if (!draftAsset) {
            continue
          }

          await empresaService.uploadAsset(
            createdCompany.id,
            assetType,
            draftAsset.file,
            true,
          )
        }

        toast.success(t("notifications.create_success"))
      }

      await onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast.apiError(
        error,
        isEdit ? t("notifications.update_error") : t("notifications.create_error"),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const previewUrls = {
    wideDark:
      draftAssets.logo_dark?.previewUrl ||
      resolveCompanyLogoUrl(getCompanyAssetUrl(managedCompany, "logo_dark")),
    squareDark:
      draftAssets.logo_square_dark?.previewUrl ||
      resolveCompanyLogoUrl(getCompanyAssetUrl(managedCompany, "logo_square_dark")),
    pointPin:
      draftAssets.point_pin?.previewUrl ||
      resolveCompanyLogoUrl(getCompanyAssetUrl(managedCompany, "point_pin")),
    totemPin:
      draftAssets.totem_pin?.previewUrl ||
      resolveCompanyLogoUrl(getCompanyAssetUrl(managedCompany, "totem_pin")),
  }

  const configuredCount = COMPANY_ASSET_TYPE_ORDER.filter((assetType) => {
    return (
      draftAssets[assetType] ||
      resolveCompanyLogoUrl(getCompanyAssetUrl(managedCompany, assetType))
    )
  }).length
  const hasSwitcherPreview = Boolean(previewUrls.wideDark || previewUrls.squareDark)
  const hasMapPreview = Boolean(previewUrls.pointPin || previewUrls.totemPin)

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEdit ? t("title_edit") : t("title_create")}</DialogTitle>
            <DialogDescription>
              {isEdit ? t("description_edit") : t("description_create")}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("labels.name")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("placeholders.name")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("labels.cnpj")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("placeholders.cnpj")}
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("labels.status")}</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full cursor-pointer">
                            <SelectValue placeholder={t("placeholders.status")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">{tTable("status_active")}</SelectItem>
                          <SelectItem value="inactive">{tTable("status_inactive")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <CardHeader className="px-0 pb-0">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-base">{t("assets.title")}</CardTitle>
                    <Badge variant="outline">
                      {t("assets.configured_count", {
                        count: configuredCount,
                        total: COMPANY_ASSET_TYPE_ORDER.length,
                      })}
                    </Badge>
                  </div>
                  <CardDescription>
                    {isEdit ? t("assets.description_edit") : t("assets.description_create")}
                  </CardDescription>
                  <CardAction>
                    <Button
                      type="button"
                      variant="outline"
                      className="cursor-pointer"
                      onClick={() => setIsAssetsDialogOpen(true)}
                    >
                      <ImagePlus className="mr-2 h-4 w-4" />
                      {t("buttons.manage_assets")}
                    </Button>
                  </CardAction>
                </CardHeader>

                <Accordion type="multiple" className="rounded-xl border">
                  {hasSwitcherPreview ? (
                    <AccordionItem value="switcher" className="px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="space-y-1 text-left">
                          <div className="text-sm font-semibold">{t("assets.sections.switcher_title")}</div>
                          <div className="text-sm text-muted-foreground">
                            {t("assets.sections.switcher_description")}
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        <div className="grid gap-4 lg:grid-cols-2">
                          {previewUrls.wideDark ? (
                            <div className="space-y-2">
                              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                {tAssets("types.logo_dark.title")}
                              </div>
                              <CompanySelectorButtonPreview
                                companyName={managedCompany?.nome || form.watch("nome") || "Empresa"}
                                logoUrl={previewUrls.wideDark}
                                darkMode
                              />
                            </div>
                          ) : null}
                          {previewUrls.squareDark ? (
                            <div className="space-y-2">
                              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                {tAssets("types.logo_square_dark.title")}
                              </div>
                              <CompanyDropdownPreview
                                companyName={managedCompany?.nome || form.watch("nome") || "Empresa"}
                                logoUrl={previewUrls.squareDark}
                                darkMode
                              />
                            </div>
                          ) : null}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ) : null}

                  {hasMapPreview ? (
                    <AccordionItem value="map" className="px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="space-y-1 text-left">
                          <div className="text-sm font-semibold">{t("assets.sections.map_title")}</div>
                          <div className="text-sm text-muted-foreground">
                            {t("assets.sections.map_description")}
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          {previewUrls.pointPin ? (
                            <div className="space-y-2">
                              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                {tAssets("types.point_pin.title")}
                              </div>
                              <CompanyMapPinPreview
                                companyName={managedCompany?.nome || form.watch("nome") || "Empresa"}
                                logoUrl={previewUrls.pointPin}
                                darkMode
                              />
                            </div>
                          ) : null}
                          {previewUrls.totemPin ? (
                            <div className="space-y-2">
                              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                {tAssets("types.totem_pin.title")}
                              </div>
                              <CompanyMapPinPreview
                                companyName={managedCompany?.nome || form.watch("nome") || "Empresa"}
                                logoUrl={previewUrls.totemPin}
                                darkMode
                                totem
                              />
                            </div>
                          ) : null}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ) : null}
                </Accordion>

                {!hasSwitcherPreview && !hasMapPreview ? (
                  <div className="rounded-xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
                    {t("assets.empty_state")}
                  </div>
                ) : null}
              </div>

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="cursor-pointer"
                  disabled={isSubmitting}
                >
                  {t("buttons.cancel")}
                </Button>
                <Button type="submit" className="cursor-pointer" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isSubmitting
                    ? t("buttons.saving")
                    : isEdit
                      ? t("buttons.save")
                      : t("buttons.create")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <CompanyAssetsDialog
        open={isAssetsDialogOpen}
        onOpenChange={setIsAssetsDialogOpen}
        company={managedCompany}
        draftAssets={draftAssets}
        onDraftAssetsChange={(updater) => {
          setDraftAssets((current) =>
            typeof updater === "function" ? updater(current) : updater,
          )
        }}
        onCompanyChange={setManagedCompany}
        onCompanyMutated={onSuccess}
      />
    </>
  )
}
