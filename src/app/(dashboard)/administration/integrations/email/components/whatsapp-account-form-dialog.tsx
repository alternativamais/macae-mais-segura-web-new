"use client"

import { useEffect, useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { TenantCompanyFormField } from "@/components/shared/tenant-company-form-field"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useTenantCompanySelection } from "@/hooks/use-tenant-company-selection"
import { useTranslator } from "@/lib/i18n"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { emailIntegrationService } from "@/services/email-integration.service"
import { WhatsappAccount } from "@/types/email-integration"

interface WhatsappAccountFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account: WhatsappAccount | null
  onSuccess: () => Promise<void> | void
}

export function WhatsappAccountFormDialog({
  open,
  onOpenChange,
  account,
  onSuccess,
}: WhatsappAccountFormDialogProps) {
  const t = useTranslator("email_integrations.whatsapp_accounts.form")
  const tCompany = useTranslator("company_field")
  const { companies, defaultCompanyId, showCompanySelector } = useTenantCompanySelection()

  const schema = useMemo(
    () =>
      z.object({
        empresaId: showCompanySelector
          ? z.string().min(1, tCompany("required"))
          : z.string().optional(),
        name: z.string().trim().min(2, t("validations.name")),
        enabled: z.enum(["true", "false"]),
        notes: z.string().optional(),
      }),
    [showCompanySelector, t, tCompany],
  )

  type FormValues = z.infer<typeof schema>

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      empresaId: defaultCompanyId ? String(defaultCompanyId) : "",
      name: "",
      enabled: "true",
      notes: "",
    },
  })

  useEffect(() => {
    if (!open) return
    form.reset({
      empresaId:
        typeof account?.empresaId === "number"
          ? String(account.empresaId)
          : defaultCompanyId
            ? String(defaultCompanyId)
            : "",
      name: account?.name || "",
      enabled: account?.enabled === false ? "false" : "true",
      notes: account?.notes || "",
    })
  }, [account, defaultCompanyId, form, open])

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = {
        ...(values.empresaId ? { empresaId: Number(values.empresaId) } : {}),
        name: values.name.trim(),
        enabled: values.enabled === "true",
        notes: values.notes?.trim() || undefined,
      }

      if (account) {
        await emailIntegrationService.updateWhatsappAccount(account.id, payload)
        toast.success(t("notifications.edit_success"))
      } else {
        await emailIntegrationService.createWhatsappAccount(payload)
        toast.success(t("notifications.create_success"))
      }

      await onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast.apiError(error, account ? t("notifications.edit_error") : t("notifications.create_error"))
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{account ? t("title_edit") : t("title_create")}</DialogTitle>
          <DialogDescription>{account ? t("description_edit") : t("description_create")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={onSubmit}>
            {showCompanySelector ? (
              <TenantCompanyFormField control={form.control} companies={companies} name="empresaId" />
            ) : null}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.name.label")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t("fields.name.placeholder")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.enabled.label")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="true">{t("fields.enabled.enabled")}</SelectItem>
                      <SelectItem value="false">{t("fields.enabled.disabled")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.notes.label")}</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={4} placeholder={t("fields.notes.placeholder")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("actions.cancel")}
              </Button>
              <Button type="submit">{account ? t("actions.save") : t("actions.create")}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
