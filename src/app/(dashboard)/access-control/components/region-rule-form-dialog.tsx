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
import { AccessRegionRule } from "@/types/access-control"
import { useTranslator } from "@/lib/i18n"
import { getRegionActionOptions } from "./utils"

type RegionRuleFormValues = {
  action: "allow" | "block"
  code: string
  description?: string
  active: boolean
  empresaId?: string
}

interface RegionRuleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void | Promise<void>
  regionRule?: AccessRegionRule
}

export function RegionRuleFormDialog({
  open,
  onOpenChange,
  onSuccess,
  regionRule,
}: RegionRuleFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEdit = !!regionRule
  const { companies, showCompanySelector, defaultCompanyId } =
    useTenantCompanySelection()
  const t = useTranslator("access_control.region_rule_form")
  const tAccess = useTranslator("access_control")
  const tCompany = useTranslator("company_field")
  const actionOptions = useMemo(() => getRegionActionOptions(tAccess), [tAccess])
  const validationCodeLength = t("val_code_length")

  const regionRuleFormSchema = useMemo(
    () =>
      z.object({
        action: z.enum(["allow", "block"]),
        code: z
          .string()
          .trim()
          .length(2, validationCodeLength),
        description: z.string().optional(),
        active: z.boolean(),
        empresaId: z.string().optional(),
      }).superRefine((values, context) => {
        if (showCompanySelector && !isEdit && !values.empresaId) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["empresaId"],
            message: tCompany("required"),
          })
        }
      }),
    [isEdit, showCompanySelector, tCompany, validationCodeLength],
  )

  const form = useForm<RegionRuleFormValues>({
    resolver: zodResolver(regionRuleFormSchema) as any,
    defaultValues: {
      action: "block",
      code: "",
      description: "",
      active: true,
      empresaId: defaultCompanyId ? String(defaultCompanyId) : "",
    },
  })

  useEffect(() => {
    if (!open) return

    form.reset({
      action: regionRule?.action || "block",
      code: regionRule?.code || "",
      description: regionRule?.description || "",
      active: regionRule?.active ?? true,
      empresaId:
        typeof regionRule?.empresaId === "number"
          ? String(regionRule.empresaId)
          : defaultCompanyId
            ? String(defaultCompanyId)
            : "",
    })
  }, [defaultCompanyId, open, regionRule, form])

  const onSubmit = async (values: RegionRuleFormValues) => {
    setIsSubmitting(true)

    try {
      const empresaId =
        values.empresaId && values.empresaId.trim()
          ? Number(values.empresaId)
          : defaultCompanyId ?? undefined
      const payload = {
        action: values.action,
        code: values.code.trim().toUpperCase(),
        description: values.description?.trim() || undefined,
        active: values.active,
        ...(empresaId ? { empresaId } : {}),
      }

      if (isEdit && regionRule) {
        await accessControlService.updateRegionRule(regionRule.id, {
          action: payload.action,
          code: payload.code,
          description: payload.description,
          active: payload.active,
        })
        toast.success(t("success_edit"))
      } else {
        await accessControlService.createRegionRule(payload)
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
      <DialogContent className="sm:max-w-xl">
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

            <div className="grid items-start gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="action"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("label_action")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="cursor-pointer">
                          <SelectValue placeholder={t("placeholder_action")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {actionOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="invisible">
                      {t("action_hint")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("label_country")}</FormLabel>
                    <FormControl>
                      <Input
                        maxLength={2}
                        placeholder={t("placeholder_country")}
                        {...field}
                        onChange={(event) =>
                          field.onChange(event.target.value.toUpperCase())
                        }
                    />
                  </FormControl>
                  <FormDescription>{t("country_hint")}</FormDescription>
                  <FormMessage />
                </FormItem>
                )}
              />
            </div>

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
