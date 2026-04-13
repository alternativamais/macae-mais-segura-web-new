"use client"

import { useEffect, useState } from "react"
import { ImagePlus, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { empresaService } from "@/services/empresa.service"
import { Empresa } from "@/types/empresa"
import { Button } from "@/components/ui/button"
import { resolveCompanyLogoUrl } from "@/lib/company-logo"
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
import { useTranslator } from "@/lib/i18n"

interface CompanyFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void | Promise<void>
  company?: Empresa
}

type AssetSlot =
  | "wideLight"
  | "wideDark"
  | "squareLight"
  | "squareDark"
  | "pointPin"
  | "totemPin"

function LogoUploadCard({
  label,
  placeholder,
  alt,
  previewUrl,
  square = false,
  onChange,
}: {
  label: string
  placeholder: string
  alt: string
  previewUrl: string | null
  square?: boolean
  onChange: (file: File | null) => void
}) {
  return (
    <div className="space-y-2">
      <FormLabel>{label}</FormLabel>
      <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 px-4 py-3 text-center transition-colors hover:border-primary/60 hover:bg-muted/40">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={alt}
            className={
              square
                ? "size-14 rounded-md object-contain"
                : "max-h-12 max-w-full object-contain"
            }
          />
        ) : (
          <ImagePlus className="mb-2 h-5 w-5 text-muted-foreground" />
        )}
        <span className="text-xs text-muted-foreground">{placeholder}</span>
        <Input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => onChange(event.target.files?.[0] ?? null)}
        />
      </label>
    </div>
  )
}

export function CompanyFormDialog({
  open,
  onOpenChange,
  onSuccess,
  company,
}: CompanyFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [wideLightFile, setWideLightFile] = useState<File | null>(null)
  const [wideDarkFile, setWideDarkFile] = useState<File | null>(null)
  const [squareLightFile, setSquareLightFile] = useState<File | null>(null)
  const [squareDarkFile, setSquareDarkFile] = useState<File | null>(null)
  const [pointPinFile, setPointPinFile] = useState<File | null>(null)
  const [totemPinFile, setTotemPinFile] = useState<File | null>(null)
  const [wideLightPreviewUrl, setWideLightPreviewUrl] = useState<string | null>(null)
  const [wideDarkPreviewUrl, setWideDarkPreviewUrl] = useState<string | null>(null)
  const [squareLightPreviewUrl, setSquareLightPreviewUrl] = useState<string | null>(null)
  const [squareDarkPreviewUrl, setSquareDarkPreviewUrl] = useState<string | null>(null)
  const [pointPinPreviewUrl, setPointPinPreviewUrl] = useState<string | null>(null)
  const [totemPinPreviewUrl, setTotemPinPreviewUrl] = useState<string | null>(null)
  const isEdit = !!company

  const t = useTranslator("companies.form")
  const tTable = useTranslator("companies.table")

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
    if (!open) return

    form.reset({
      nome: company?.nome || "",
      cnpj: company?.cnpj || "",
      status: company?.status || "active",
    })

    setWideLightFile(null)
    setWideDarkFile(null)
    setSquareLightFile(null)
    setSquareDarkFile(null)
    setPointPinFile(null)
    setTotemPinFile(null)
  }, [company, form, open])

  useEffect(() => {
    return () => {
      ;[
        wideLightPreviewUrl,
        wideDarkPreviewUrl,
        squareLightPreviewUrl,
        squareDarkPreviewUrl,
        pointPinPreviewUrl,
        totemPinPreviewUrl,
      ]
        .filter(Boolean)
        .forEach((url) => {
          if (url?.startsWith("blob:")) {
            URL.revokeObjectURL(url)
          }
        })
    }
  }, [wideLightPreviewUrl, wideDarkPreviewUrl, squareLightPreviewUrl, squareDarkPreviewUrl, pointPinPreviewUrl, totemPinPreviewUrl])

  const updatePreview = (slot: AssetSlot, file: File | null) => {
    const fallbackBySlot: Record<AssetSlot, string | null> = {
      wideLight: resolveCompanyLogoUrl(company?.logoLightUrl || company?.logoUrl),
      wideDark: resolveCompanyLogoUrl(company?.logoDarkUrl || company?.logoUrl),
      squareLight: resolveCompanyLogoUrl(company?.logoSquareLightUrl || company?.logoIconUrl),
      squareDark: resolveCompanyLogoUrl(company?.logoSquareDarkUrl || company?.logoIconUrl),
      pointPin: resolveCompanyLogoUrl(company?.pointPinUrl),
      totemPin: resolveCompanyLogoUrl(company?.totemPinUrl),
    }

    const previewUrl = file ? URL.createObjectURL(file) : fallbackBySlot[slot]

    if (slot === "wideLight") setWideLightPreviewUrl(previewUrl)
    if (slot === "wideDark") setWideDarkPreviewUrl(previewUrl)
    if (slot === "squareLight") setSquareLightPreviewUrl(previewUrl)
    if (slot === "squareDark") setSquareDarkPreviewUrl(previewUrl)
    if (slot === "pointPin") setPointPinPreviewUrl(previewUrl)
    if (slot === "totemPin") setTotemPinPreviewUrl(previewUrl)
  }

  useEffect(() => {
    updatePreview("wideLight", wideLightFile)
  }, [company?.logoLightUrl, company?.logoUrl, wideLightFile])

  useEffect(() => {
    updatePreview("wideDark", wideDarkFile)
  }, [company?.logoDarkUrl, company?.logoUrl, wideDarkFile])

  useEffect(() => {
    updatePreview("squareLight", squareLightFile)
  }, [company?.logoSquareLightUrl, company?.logoIconUrl, squareLightFile])

  useEffect(() => {
    updatePreview("squareDark", squareDarkFile)
  }, [company?.logoSquareDarkUrl, company?.logoIconUrl, squareDarkFile])

  useEffect(() => {
    updatePreview("pointPin", pointPinFile)
  }, [company?.pointPinUrl, pointPinFile])

  useEffect(() => {
    updatePreview("totemPin", totemPinFile)
  }, [company?.totemPinUrl, totemPinFile])

  const onSubmit = async (values: CompanyFormValues) => {
    setIsSubmitting(true)

    try {
      let uploadedAssets: Pick<
        Empresa,
        | "logoLightUrl"
        | "logoDarkUrl"
        | "logoSquareLightUrl"
        | "logoSquareDarkUrl"
        | "pointPinUrl"
        | "totemPinUrl"
      > = {}

      if (wideLightFile || wideDarkFile || squareLightFile || squareDarkFile || pointPinFile || totemPinFile) {
        uploadedAssets = await empresaService.uploadAssets({
          logoLight: wideLightFile,
          logoDark: wideDarkFile,
          logoSquareLight: squareLightFile,
          logoSquareDark: squareDarkFile,
          pointPin: pointPinFile,
          totemPin: totemPinFile,
        })
      }

      const payload: Partial<Empresa> = {
        ...values,
        logoLightUrl: uploadedAssets.logoLightUrl ?? company?.logoLightUrl ?? null,
        logoDarkUrl: uploadedAssets.logoDarkUrl ?? company?.logoDarkUrl ?? null,
        logoSquareLightUrl:
          uploadedAssets.logoSquareLightUrl ?? company?.logoSquareLightUrl ?? null,
        logoSquareDarkUrl:
          uploadedAssets.logoSquareDarkUrl ?? company?.logoSquareDarkUrl ?? null,
        pointPinUrl: uploadedAssets.pointPinUrl ?? company?.pointPinUrl ?? null,
        totemPinUrl: uploadedAssets.totemPinUrl ?? company?.totemPinUrl ?? null,
      }

      if (isEdit && company) {
        await empresaService.update(company.id, payload)
        toast.success(t("notifications.update_success"))
      } else {
        await empresaService.create(payload)
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

  return (
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

            <div className="grid gap-4 sm:grid-cols-2">
              <LogoUploadCard
                label={t("labels.logo_light")}
                placeholder={t("placeholders.logo_light")}
                alt={company?.nome || "Logo clara da empresa"}
                previewUrl={wideLightPreviewUrl}
                onChange={setWideLightFile}
              />

              <LogoUploadCard
                label={t("labels.logo_dark")}
                placeholder={t("placeholders.logo_dark")}
                alt={company?.nome || "Logo escura da empresa"}
                previewUrl={wideDarkPreviewUrl}
                onChange={setWideDarkFile}
              />

              <LogoUploadCard
                label={t("labels.logo_square_light")}
                placeholder={t("placeholders.logo_square_light")}
                alt={company?.nome || "Logo quadrada clara da empresa"}
                previewUrl={squareLightPreviewUrl}
                square
                onChange={setSquareLightFile}
              />

              <LogoUploadCard
                label={t("labels.logo_square_dark")}
                placeholder={t("placeholders.logo_square_dark")}
                alt={company?.nome || "Logo quadrada escura da empresa"}
                previewUrl={squareDarkPreviewUrl}
                square
                onChange={setSquareDarkFile}
              />

              <LogoUploadCard
                label={t("labels.point_pin")}
                placeholder={t("placeholders.point_pin")}
                alt={company?.nome || "Pin de ponto da empresa"}
                previewUrl={pointPinPreviewUrl}
                square
                onChange={setPointPinFile}
              />

              <LogoUploadCard
                label={t("labels.totem_pin")}
                placeholder={t("placeholders.totem_pin")}
                alt={company?.nome || "Pin de totem da empresa"}
                previewUrl={totemPinPreviewUrl}
                square
                onChange={setTotemPinFile}
              />
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
  )
}
