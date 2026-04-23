"use client"

import { useEffect, useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { TenantCompanyFormField } from "@/components/shared/tenant-company-form-field"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
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
import { Textarea } from "@/components/ui/textarea"
import { useTenantCompanySelection } from "@/hooks/use-tenant-company-selection"
import { useTranslator } from "@/lib/i18n"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { emailIntegrationService } from "@/services/email-integration.service"
import { EmailRecipient } from "@/types/email-integration"

interface EmailRecipientFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recipient: EmailRecipient | null
  onSuccess: () => Promise<void> | void
}

export function EmailRecipientFormDialog({
  open,
  onOpenChange,
  recipient,
  onSuccess,
}: EmailRecipientFormDialogProps) {
  const t = useTranslator("email_integrations.recipients.form")
  const tCompany = useTranslator("company_field")
  const { companies, defaultCompanyId, showCompanySelector } = useTenantCompanySelection()
  const [openSection, setOpenSection] = useState("identity")

  const schema = useMemo(
    () =>
      z.object({
        empresaId: z.string().optional(),
        name: z.string().trim().min(2, t("validations.name")),
        email: z.string().email(t("validations.email")),
        description: z.string().optional(),
        enabled: z.enum(["true", "false"]),
      }).superRefine((values, ctx) => {
        if (showCompanySelector && !values.empresaId) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["empresaId"],
            message: tCompany("required"),
          })
        }
      }),
    [showCompanySelector, t, tCompany],
  )

  type FormValues = z.infer<typeof schema>

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      empresaId: defaultCompanyId ? String(defaultCompanyId) : "",
      name: "",
      email: "",
      description: "",
      enabled: "true",
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
      email: recipient?.email || "",
      description: recipient?.description || "",
      enabled: recipient?.enabled === false ? "false" : "true",
    })
  }, [defaultCompanyId, form, open, recipient])

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setOpenSection("identity")
    }
    onOpenChange(nextOpen)
  }

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = {
        ...(values.empresaId ? { empresaId: Number(values.empresaId) } : {}),
        name: values.name.trim(),
        email: values.email.trim(),
        description: values.description?.trim() || undefined,
        enabled: values.enabled === "true",
      }

      if (recipient) {
        await emailIntegrationService.updateRecipient(recipient.id, payload)
        toast.success(t("notifications.edit_success"))
      } else {
        await emailIntegrationService.createRecipient(payload)
        toast.success(t("notifications.create_success"))
      }

      await onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast.apiError(error, recipient ? t("notifications.edit_error") : t("notifications.create_error"))
    }
  })

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{recipient ? t("title_edit") : t("title_create")}</DialogTitle>
          <DialogDescription>{recipient ? t("description_edit") : t("description_create")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-6" onSubmit={onSubmit}>
            {showCompanySelector ? (
              <TenantCompanyFormField control={form.control} companies={companies} />
            ) : null}

            <Accordion
              type="single"
              collapsible
              value={openSection}
              onValueChange={(value) => setOpenSection(value || "")}
              className="rounded-md border bg-card"
            >
              <AccordionItem value="identity" className="px-4">
                <AccordionTrigger className="cursor-pointer py-4 hover:no-underline">
                  <div className="space-y-1 text-left">
                    <div>{t("sections.identity")}</div>
                    <div className="text-xs font-normal text-muted-foreground">
                      {t("sections.identity_desc")}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  <div className="space-y-4 pb-4">
                    <FormField
                      control={form.control}
                      name="name"
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

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("labels.email")}</FormLabel>
                          <FormControl>
                            <Input placeholder={t("placeholders.email")} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="settings" className="px-4">
                <AccordionTrigger className="cursor-pointer py-4 hover:no-underline">
                  <div className="space-y-1 text-left">
                    <div>{t("sections.settings")}</div>
                    <div className="text-xs font-normal text-muted-foreground">
                      {t("sections.settings_desc")}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  <div className="space-y-4 pb-4">
                    <FormField
                      control={form.control}
                      name="enabled"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("labels.status")}</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className="w-full cursor-pointer">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="true">{t("options.enabled")}</SelectItem>
                              <SelectItem value="false">{t("options.disabled")}</SelectItem>
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
                          <FormLabel>{t("labels.description")}</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              value={field.value || ""}
                              rows={4}
                              placeholder={t("placeholders.description")}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <DialogFooter>
              <Button type="button" variant="outline" className="cursor-pointer" onClick={() => onOpenChange(false)}>
                {t("buttons.cancel")}
              </Button>
              <Button type="submit" className="cursor-pointer" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {recipient ? t("buttons.save") : t("buttons.create")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
