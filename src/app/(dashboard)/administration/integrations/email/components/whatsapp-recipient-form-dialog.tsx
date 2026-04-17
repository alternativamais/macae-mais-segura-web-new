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
import { WhatsappRecipient } from "@/types/email-integration"

interface WhatsappRecipientFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recipient: WhatsappRecipient | null
  onSuccess: () => Promise<void> | void
}

export function WhatsappRecipientFormDialog({
  open,
  onOpenChange,
  recipient,
  onSuccess,
}: WhatsappRecipientFormDialogProps) {
  const t = useTranslator("email_integrations.whatsapp_recipients.form")
  const tCompany = useTranslator("company_field")
  const { companies, defaultCompanyId, showCompanySelector } = useTenantCompanySelection()
  const isImportedRecipient = recipient?.source === "imported"

  const schema = useMemo(
    () =>
      z.object({
        empresaId: showCompanySelector
          ? z.string().min(1, tCompany("required"))
          : z.string().optional(),
        name: z.string().trim().min(2, t("validations.name")),
        phoneNumber: z.string().trim().optional(),
        enabled: z.enum(["true", "false"]),
        description: z.string().optional(),
      }).superRefine((values, ctx) => {
        if (!isImportedRecipient && (!values.phoneNumber || values.phoneNumber.trim().length < 8)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["phoneNumber"],
            message: t("validations.phone"),
          })
        }
      }),
    [isImportedRecipient, showCompanySelector, t, tCompany],
  )

  type FormValues = z.infer<typeof schema>

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      empresaId: defaultCompanyId ? String(defaultCompanyId) : "",
      name: "",
      phoneNumber: "",
      enabled: "true",
      description: "",
    },
  })

  useEffect(() => {
    if (!open) return
    form.reset({
      empresaId:
        typeof recipient?.empresaId === "number"
          ? String(recipient.empresaId)
          : defaultCompanyId
            ? String(defaultCompanyId)
            : "",
      name: recipient?.name || "",
      phoneNumber: recipient?.phoneNumber || "",
      enabled: recipient?.enabled === false ? "false" : "true",
      description: recipient?.description || "",
    })
  }, [defaultCompanyId, form, open, recipient])

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = {
        ...(values.empresaId ? { empresaId: Number(values.empresaId) } : {}),
        name: values.name.trim(),
        ...(values.phoneNumber?.trim() ? { phoneNumber: values.phoneNumber.trim() } : {}),
        enabled: values.enabled === "true",
        description: values.description?.trim() || undefined,
      }

      if (recipient) {
        await emailIntegrationService.updateWhatsappRecipient(recipient.id, payload)
        toast.success(t("notifications.edit_success"))
      } else {
        await emailIntegrationService.createWhatsappRecipient(payload)
        toast.success(t("notifications.create_success"))
      }

      await onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast.apiError(error, recipient ? t("notifications.edit_error") : t("notifications.create_error"))
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{recipient ? t("title_edit") : t("title_create")}</DialogTitle>
          <DialogDescription>{recipient ? t("description_edit") : t("description_create")}</DialogDescription>
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
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.phone.label")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isImportedRecipient}
                      placeholder={t("fields.phone.placeholder")}
                    />
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.description.label")}</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={4} placeholder={t("fields.description.placeholder")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("actions.cancel")}
              </Button>
              <Button type="submit">{recipient ? t("actions.save") : t("actions.create")}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
