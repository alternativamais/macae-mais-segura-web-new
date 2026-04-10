"use client"

import { useEffect, useState, useMemo } from "react"
import { Loader2 } from "lucide-react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { TenantCompanyFormField } from "@/components/shared/tenant-company-form-field"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { useTenantCompanySelection } from "@/hooks/use-tenant-company-selection"
import { accessControlService } from "@/services/access-control.service"
import { AccessIpBlock } from "@/types/access-control"
import { useTranslator } from "@/lib/i18n"
import { getIpBlockModeOptions } from "./utils"

type IpBlockFormValues = {
  label?: string
  mode: "single" | "cidr" | "range"
  value?: string
  rangeStart?: string
  rangeEnd?: string
  description?: string
  active: boolean
  empresaId?: string
}

interface IpBlockFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void | Promise<void>
  ipBlock?: AccessIpBlock
}

export function IpBlockFormDialog({
  open,
  onOpenChange,
  onSuccess,
  ipBlock,
}: IpBlockFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEdit = !!ipBlock
  const { companies, showCompanySelector, defaultCompanyId } =
    useTenantCompanySelection()
  const t = useTranslator("access_control.ip_block_form")
  const tAccess = useTranslator("access_control")
  const tCompany = useTranslator("company_field")
  const validationStartIp = t("val_start_ip")
  const validationEndIp = t("val_end_ip")
  const validationCidr = t("val_cidr")
  const validationIp = t("val_ip")
  const modeOptions = useMemo(() => getIpBlockModeOptions(tAccess), [tAccess])

  const ipBlockFormSchema = useMemo(
    () =>
      z
        .object({
          label: z.string().optional(),
          mode: z.enum(["single", "cidr", "range"]),
          value: z.string().optional(),
          rangeStart: z.string().optional(),
          rangeEnd: z.string().optional(),
          description: z.string().optional(),
          active: z.boolean(),
          empresaId: z.string().optional(),
        })
        .superRefine((values, context) => {
          if (showCompanySelector && !isEdit && !values.empresaId) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["empresaId"],
              message: tCompany("required"),
            })
          }

          if (values.mode === "range") {
            if (!values.rangeStart?.trim()) {
              context.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["rangeStart"],
                message: validationStartIp,
              })
            }

            if (!values.rangeEnd?.trim()) {
              context.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["rangeEnd"],
                message: validationEndIp,
              })
            }

            return
          }

          if (!values.value?.trim()) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["value"],
              message:
                values.mode === "cidr"
                  ? validationCidr
                  : validationIp,
            })
          }
        }),
    [isEdit, showCompanySelector, tCompany, validationCidr, validationEndIp, validationIp, validationStartIp],
  )

  const form = useForm<IpBlockFormValues>({
    resolver: zodResolver(ipBlockFormSchema) as any,
    defaultValues: {
      label: "",
      mode: "single",
      value: "",
      rangeStart: "",
      rangeEnd: "",
      description: "",
      active: true,
      empresaId: defaultCompanyId ? String(defaultCompanyId) : "",
    },
  })

  const selectedMode = form.watch("mode")

  useEffect(() => {
    if (!open) return

    form.reset({
      label: ipBlock?.label || "",
      mode: ipBlock?.mode || "single",
      value:
        ipBlock?.mode === "range" ? "" : ipBlock?.ipValue || ipBlock?.cidr || "",
      rangeStart: ipBlock?.rangeStart || "",
      rangeEnd: ipBlock?.rangeEnd || "",
      description: ipBlock?.description || "",
      active: ipBlock?.active ?? true,
      empresaId:
        typeof ipBlock?.empresaId === "number"
          ? String(ipBlock.empresaId)
          : defaultCompanyId
            ? String(defaultCompanyId)
            : "",
    })
  }, [defaultCompanyId, open, ipBlock, form])

  const onSubmit = async (values: IpBlockFormValues) => {
    setIsSubmitting(true)

    try {
      const empresaId =
        values.empresaId && values.empresaId.trim()
          ? Number(values.empresaId)
          : defaultCompanyId ?? undefined
      const payload = {
        label: values.label?.trim() || undefined,
        mode: values.mode,
        value: values.mode === "range" ? undefined : values.value?.trim(),
        rangeStart: values.mode === "range" ? values.rangeStart?.trim() : undefined,
        rangeEnd: values.mode === "range" ? values.rangeEnd?.trim() : undefined,
        description: values.description?.trim() || undefined,
        active: values.active,
        ...(empresaId ? { empresaId } : {}),
      }

      if (isEdit && ipBlock) {
        await accessControlService.updateIpBlock(ipBlock.id, {
          label: payload.label,
          mode: payload.mode,
          value: payload.value,
          rangeStart: payload.rangeStart,
          rangeEnd: payload.rangeEnd,
          description: payload.description,
          active: payload.active,
        })
        toast.success(t("success_edit"))
      } else {
        await accessControlService.createIpBlock(payload)
        toast.success(t("success_new"))
      }

      await onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast.apiError(error, t("error_save"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("title_edit") : t("title_new")}</DialogTitle>
          <DialogDescription>
            {t("desc")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {showCompanySelector ? (
              <TenantCompanyFormField
                control={form.control}
                companies={companies}
                disabled={isEdit}
                description={isEdit ? tCompany("edit_locked") : undefined}
              />
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("label_id")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("placeholder_id")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("label_mode")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="cursor-pointer">
                          <SelectValue placeholder={t("placeholder_mode")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {modeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {selectedMode === "range" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="rangeStart"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("label_start_ip")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("placeholder_start_ip")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rangeEnd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("label_end_ip")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("placeholder_end_ip")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : (
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{selectedMode === "cidr" ? t("label_cidr") : t("label_ip")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={
                          selectedMode === "cidr"
                            ? t("placeholder_cidr")
                            : t("placeholder_ip")
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("label_desc")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("placeholder_desc")}
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>{t("desc_hint")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>{t("label_active")}</FormLabel>
                    <FormDescription>
                      {t("active_hint")}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="cursor-pointer"
              >
                {t("button_cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t("button_save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
