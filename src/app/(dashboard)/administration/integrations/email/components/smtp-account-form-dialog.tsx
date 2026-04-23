"use client"

import { useEffect, useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useForm, useWatch } from "react-hook-form"
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
  FormDescription,
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
import { EmailSmtpAccount } from "@/types/email-integration"

interface SmtpAccountFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account: EmailSmtpAccount | null
  onSuccess: () => Promise<void> | void
}

export function SmtpAccountFormDialog({
  open,
  onOpenChange,
  account,
  onSuccess,
}: SmtpAccountFormDialogProps) {
  const t = useTranslator("email_integrations.smtp.form")
  const tCompany = useTranslator("company_field")
  const { companies, defaultCompanyId, showCompanySelector } = useTenantCompanySelection()
  const isEditing = Boolean(account)
  const [openSection, setOpenSection] = useState("identity")

  const schema = useMemo(
    () =>
      z.object({
        empresaId: z.string().optional(),
        name: z.string().trim().min(2, t("validations.name")),
        host: z.string().trim().min(2, t("validations.host")),
        port: z.number().min(1),
        secure: z.enum(["true", "false"]),
        username: z.string().trim().min(1, t("validations.username")),
        password: z.string().optional(),
        fromEmail: z.string().email(t("validations.email")),
        fromName: z.string().optional(),
        replyToEmail: z.union([z.literal(""), z.string().email(t("validations.email"))]).optional(),
        environmentTag: z.enum(["prod", "dev"]),
        enabled: z.enum(["true", "false"]),
        notes: z.string().optional(),
      }).superRefine((values, ctx) => {
        if (showCompanySelector && !values.empresaId) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["empresaId"],
            message: tCompany("required"),
          })
        }

        if (!isEditing && !values.password?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["password"],
            message: t("validations.password"),
          })
        }
      }),
    [isEditing, showCompanySelector, t, tCompany],
  )

  type FormValues = z.infer<typeof schema>

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      empresaId: defaultCompanyId ? String(defaultCompanyId) : "",
      name: "",
      host: "smtplw.com.br",
      port: 587,
      secure: "false",
      username: "",
      password: "",
      fromEmail: "",
      fromName: "",
      replyToEmail: "",
      environmentTag: "prod",
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
      host: account?.host || "smtplw.com.br",
      port: account?.port || 587,
      secure: account?.secure ? "true" : "false",
      username: account?.username || "",
      password: "",
      fromEmail: account?.fromEmail || "",
      fromName: account?.fromName || "",
      replyToEmail: account?.replyToEmail || "",
      environmentTag: account?.environmentTag === "dev" ? "dev" : "prod",
      enabled: account?.enabled === false ? "false" : "true",
      notes: account?.notes || "",
    })
  }, [account, defaultCompanyId, form, open])

  const selectedSecurity = useWatch({ control: form.control, name: "secure" })

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setOpenSection("identity")
    }

    onOpenChange(nextOpen)
  }

  useEffect(() => {
    if (!open) return

    const currentPort = Number(form.getValues("port"))

    if (selectedSecurity === "true" && currentPort === 587) {
      form.setValue("port", 465, { shouldDirty: true })
      return
    }

    if (selectedSecurity === "false" && currentPort === 465) {
      form.setValue("port", 587, { shouldDirty: true })
    }
  }, [form, open, selectedSecurity])

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = {
        ...(values.empresaId ? { empresaId: Number(values.empresaId) } : {}),
        name: values.name.trim(),
        host: values.host.trim(),
        port: values.port,
        secure: values.secure === "true",
        username: values.username.trim(),
        ...(values.password?.trim() ? { password: values.password.trim() } : {}),
        fromEmail: values.fromEmail.trim(),
        fromName: values.fromName?.trim() || undefined,
        replyToEmail: values.replyToEmail?.trim() || undefined,
        environmentTag: values.environmentTag,
        enabled: values.enabled === "true",
        notes: values.notes?.trim() || undefined,
      }

      if (account) {
        await emailIntegrationService.updateSmtpAccount(account.id, payload)
        toast.success(t("notifications.edit_success"))
      } else {
        await emailIntegrationService.createSmtpAccount({
          ...payload,
          password: values.password?.trim() || "",
        })
        toast.success(t("notifications.create_success"))
      }

      await onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast.apiError(error, account ? t("notifications.edit_error") : t("notifications.create_error"))
    }
  })

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{account ? t("title_edit") : t("title_create")}</DialogTitle>
          <DialogDescription>{account ? t("description_edit") : t("description_create")}</DialogDescription>
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
                    <div className="grid gap-4 md:grid-cols-2">
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
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("labels.username")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("placeholders.username")} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="environmentTag"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("labels.environment")}</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger className="w-full cursor-pointer">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="prod">{t("environment.prod")}</SelectItem>
                                <SelectItem value="dev">{t("environment.dev")}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

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
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="server" className="px-4">
                <AccordionTrigger className="cursor-pointer py-4 hover:no-underline">
                  <div className="space-y-1 text-left">
                    <div>{t("sections.server")}</div>
                    <div className="text-xs font-normal text-muted-foreground">
                      {t("sections.server_desc")}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  <div className="space-y-4 pb-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <FormField
                        control={form.control}
                        name="host"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>{t("labels.host")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("placeholders.host")} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="port"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("labels.port")}</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder={t("placeholders.port")}
                                value={field.value}
                                onChange={(event) =>
                                  field.onChange(Number(event.target.value) || 0)
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="secure"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("labels.security")}</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger className="w-full cursor-pointer">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="false">{t("security.starttls")}</SelectItem>
                                <SelectItem value="true">{t("security.secure")}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>{t("labels.security_help")}</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("labels.password")}</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder={t("placeholders.password")} {...field} />
                            </FormControl>
                            {account ? <FormDescription>{t("labels.password_edit_help")}</FormDescription> : null}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="sender" className="px-4">
                <AccordionTrigger className="cursor-pointer py-4 hover:no-underline">
                  <div className="space-y-1 text-left">
                    <div>{t("sections.sender")}</div>
                    <div className="text-xs font-normal text-muted-foreground">
                      {t("sections.sender_desc")}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  <div className="space-y-4 pb-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="fromEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("labels.from_email")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("placeholders.from_email")} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="fromName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("labels.from_name")}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t("placeholders.from_name")}
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="replyToEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("labels.reply_to")}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t("placeholders.reply_to")}
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("labels.notes")}</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              value={field.value || ""}
                              rows={4}
                              placeholder={t("placeholders.notes")}
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
                {account ? t("buttons.save") : t("buttons.create")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
