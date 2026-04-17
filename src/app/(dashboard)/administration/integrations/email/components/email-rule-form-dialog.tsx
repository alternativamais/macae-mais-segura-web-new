"use client"

import { useEffect, useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { FilePenLine, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { TenantCompanyFormField } from "@/components/shared/tenant-company-form-field"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { ScrollArea } from "@/components/ui/scroll-area"
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
import { Camera } from "@/types/camera"
import {
  EmailPlateAlertRule,
  EmailRecipient,
  EmailSmtpAccount,
  WhatsappAccount,
  WhatsappRecipient,
} from "@/types/email-integration"
import { EmailTemplateEditorDialog, EmailTemplateTokenDefinition } from "./email-template-editor-dialog"

interface EmailRuleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rule: EmailPlateAlertRule | null
  smtpAccounts: EmailSmtpAccount[]
  recipients: EmailRecipient[]
  whatsappAccounts: WhatsappAccount[]
  whatsappRecipients: WhatsappRecipient[]
  cameras: Camera[]
  onSuccess: () => Promise<void> | void
}

export function EmailRuleFormDialog({
  open,
  onOpenChange,
  rule,
  smtpAccounts,
  recipients,
  whatsappAccounts,
  whatsappRecipients,
  cameras,
  onSuccess,
}: EmailRuleFormDialogProps) {
  const t = useTranslator("email_integrations.rules.form")
  const tCompany = useTranslator("company_field")
  const { companies, defaultCompanyId, showCompanySelector } = useTenantCompanySelection()
  const [openSection, setOpenSection] = useState("scope")
  const [isTemplateEditorOpen, setIsTemplateEditorOpen] = useState(false)

  const schema = useMemo(
    () =>
      z.object({
        empresaId: z.string().optional(),
        name: z.string().trim().min(2, t("validations.name")),
        description: z.string().optional(),
        cameraId: z.string().min(1, t("validations.camera")),
        smtpAccountId: z.string().optional(),
        recipientIds: z.array(z.string()),
        whatsappAccountId: z.string().optional(),
        whatsappRecipientIds: z.array(z.string()),
        platesText: z.string().trim().min(1, t("validations.plates")),
        subjectTemplate: z.string().trim().min(1, t("validations.subject")),
        bodyTemplate: z.string().trim().min(1, t("validations.body")),
        cooldownSeconds: z.coerce.number().min(0),
        enabled: z.boolean(),
        emailEnabled: z.boolean(),
        whatsappEnabled: z.boolean(),
      }).superRefine((values, ctx) => {
        if (showCompanySelector && !values.empresaId) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["empresaId"],
            message: tCompany("required"),
          })
        }
        if (!values.emailEnabled && !values.whatsappEnabled) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["emailEnabled"],
            message: t("validations.channels"),
          })
        }
        if (values.emailEnabled) {
          if (!values.smtpAccountId) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["smtpAccountId"],
              message: t("validations.smtp_account"),
            })
          }
          if (!values.recipientIds.length) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["recipientIds"],
              message: t("validations.recipients"),
            })
          }
        }
        if (values.whatsappEnabled) {
          if (!values.whatsappAccountId) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["whatsappAccountId"],
              message: t("validations.whatsapp_account"),
            })
          }
          if (!values.whatsappRecipientIds.length) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["whatsappRecipientIds"],
              message: t("validations.whatsapp_recipients"),
            })
          }
        }
      }),
    [showCompanySelector, t, tCompany],
  )

  type FormValues = z.infer<typeof schema>

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      empresaId: defaultCompanyId ? String(defaultCompanyId) : "",
      name: "",
      description: "",
      cameraId: "",
      smtpAccountId: "",
      recipientIds: [],
      whatsappAccountId: "",
      whatsappRecipientIds: [],
      platesText: "",
      subjectTemplate: "Alerta LPR: {{detection.plateText}} em {{camera.nome}}",
      bodyTemplate:
        "Placa: {{detection.plateText}}\nCâmera: {{camera.nome}}\nEmpresa: {{empresa.nome}}\nData/Hora: {{detection.detectedAt}}",
      cooldownSeconds: 300,
      enabled: true,
      emailEnabled: true,
      whatsappEnabled: false,
    },
  })

  useEffect(() => {
    if (!open) return

    setOpenSection("scope")
    form.reset({
      empresaId:
        typeof rule?.empresaId === "number"
          ? String(rule.empresaId)
          : defaultCompanyId
            ? String(defaultCompanyId)
            : "",
      name: rule?.name || "",
      description: rule?.description || "",
      cameraId: rule?.cameraId ? String(rule.cameraId) : "",
      smtpAccountId: rule?.smtpAccountId ? String(rule.smtpAccountId) : "",
      recipientIds: rule?.recipients.map((item) => String(item.id)) || [],
      whatsappAccountId: rule?.whatsappAccountId ? String(rule.whatsappAccountId) : "",
      whatsappRecipientIds: rule?.whatsappRecipients.map((item) => String(item.id)) || [],
      platesText: rule?.plates.map((item) => item.plateText).join("\n") || "",
      subjectTemplate:
        rule?.subjectTemplate || "Alerta LPR: {{detection.plateText}} em {{camera.nome}}",
      bodyTemplate:
        rule?.bodyTemplate ||
        "Placa: {{detection.plateText}}\nCâmera: {{camera.nome}}\nEmpresa: {{empresa.nome}}\nData/Hora: {{detection.detectedAt}}",
      cooldownSeconds: rule?.cooldownSeconds || 300,
      enabled: rule?.enabled !== false,
      emailEnabled: rule?.emailEnabled !== false,
      whatsappEnabled: rule?.whatsappEnabled === true,
    })
  }, [defaultCompanyId, form, open, rule])

  const selectedCompanyId = form.watch("empresaId")
  const filteredCompanyId = selectedCompanyId?.trim()
    ? Number(selectedCompanyId)
    : defaultCompanyId ?? null

  const filteredCameras = useMemo(
    () => cameras.filter((camera) => (filteredCompanyId ? camera.empresaId === filteredCompanyId : true)),
    [cameras, filteredCompanyId],
  )

  const filteredSmtpAccounts = useMemo(
    () => smtpAccounts.filter((account) => (filteredCompanyId ? account.empresaId === filteredCompanyId : true)),
    [filteredCompanyId, smtpAccounts],
  )

  const filteredRecipients = useMemo(
    () => recipients.filter((recipient) => (filteredCompanyId ? recipient.empresaId === filteredCompanyId : true)),
    [filteredCompanyId, recipients],
  )

  const filteredWhatsappAccounts = useMemo(
    () => whatsappAccounts.filter((account) => (filteredCompanyId ? account.empresaId === filteredCompanyId : true)),
    [filteredCompanyId, whatsappAccounts],
  )

  const selectedWhatsappAccountId = form.watch("whatsappAccountId")
  const filteredWhatsappRecipients = useMemo(
    () =>
      whatsappRecipients.filter((recipient) => {
        if (filteredCompanyId && recipient.empresaId !== filteredCompanyId) return false
        if (!selectedWhatsappAccountId) return !recipient.accountId
        return !recipient.accountId || recipient.accountId === Number(selectedWhatsappAccountId)
      }),
    [filteredCompanyId, selectedWhatsappAccountId, whatsappRecipients],
  )

  const templateTokens = useMemo<EmailTemplateTokenDefinition[]>(
    () => [
      {
        label: t("editor.tokens.plate.label"),
        description: t("editor.tokens.plate.description"),
        token: "{{detection.plateText}}",
        tone: "info",
      },
      {
        label: t("editor.tokens.detected_at.label"),
        description: t("editor.tokens.detected_at.description"),
        token: "{{detection.detectedAt}}",
        tone: "accent",
      },
      {
        label: t("editor.tokens.camera_name.label"),
        description: t("editor.tokens.camera_name.description"),
        token: "{{camera.nome}}",
        tone: "success",
      },
      {
        label: t("editor.tokens.camera_ip.label"),
        description: t("editor.tokens.camera_ip.description"),
        token: "{{camera.ip}}",
        tone: "neutral",
      },
      {
        label: t("editor.tokens.company_name.label"),
        description: t("editor.tokens.company_name.description"),
        token: "{{empresa.nome}}",
        tone: "warning",
      },
      {
        label: t("editor.tokens.smtp_name.label"),
        description: t("editor.tokens.smtp_name.description"),
        token: "{{smtpAccount.name}}",
        tone: "danger",
      },
      {
        label: t("editor.tokens.whatsapp_name.label"),
        description: t("editor.tokens.whatsapp_name.description"),
        token: "{{whatsappAccount.name}}",
        tone: "success",
      },
      {
        label: t("editor.tokens.rule_name.label"),
        description: t("editor.tokens.rule_name.description"),
        token: "{{rule.name}}",
        tone: "accent",
      },
    ],
    [t],
  )

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = {
        ...(values.empresaId ? { empresaId: Number(values.empresaId) } : {}),
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        cameraId: Number(values.cameraId),
        smtpAccountId: values.emailEnabled && values.smtpAccountId ? Number(values.smtpAccountId) : null,
        recipientIds: values.emailEnabled ? values.recipientIds.map(Number) : [],
        whatsappAccountId:
          values.whatsappEnabled && values.whatsappAccountId ? Number(values.whatsappAccountId) : null,
        whatsappRecipientIds: values.whatsappEnabled ? values.whatsappRecipientIds.map(Number) : [],
        plates: values.platesText
          .split(/[\n,;]/)
          .map((item: string) => item.trim())
          .filter(Boolean),
        subjectTemplate: values.subjectTemplate.trim(),
        bodyTemplate: values.bodyTemplate.trim(),
        cooldownSeconds: values.cooldownSeconds,
        emailEnabled: values.emailEnabled,
        whatsappEnabled: values.whatsappEnabled,
        enabled: values.enabled,
      }

      if (rule) {
        await emailIntegrationService.updateRule(rule.id, payload)
        toast.success(t("notifications.edit_success"))
      } else {
        await emailIntegrationService.createRule(payload)
        toast.success(t("notifications.create_success"))
      }

      await onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast.apiError(error, rule ? t("notifications.edit_error") : t("notifications.create_error"))
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{rule ? t("title_edit") : t("title_create")}</DialogTitle>
          <DialogDescription>{rule ? t("description_edit") : t("description_create")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-6" onSubmit={onSubmit}>
            {showCompanySelector ? (
              <TenantCompanyFormField control={form.control as any} companies={companies} />
            ) : null}

            <Accordion
              type="single"
              collapsible
              value={openSection}
              onValueChange={(value) => setOpenSection(value || "")}
              className="rounded-md border bg-card"
            >
              <AccordionItem value="scope" className="px-4">
                <AccordionTrigger className="cursor-pointer py-4 hover:no-underline">
                  <div className="space-y-1 text-left">
                    <div>{t("sections.scope")}</div>
                    <div className="text-xs font-normal text-muted-foreground">
                      {t("sections.scope_desc")}
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
                        name="cooldownSeconds"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("labels.cooldown")}</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder={t("placeholders.cooldown")} {...field} />
                            </FormControl>
                            <FormDescription>{t("labels.cooldown_help")}</FormDescription>
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
                          <FormLabel>{t("labels.description")}</FormLabel>
                          <FormControl>
                            <Input placeholder={t("placeholders.description")} {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-4 md:grid-cols-3">
                      <FormField
                        control={form.control}
                        name="emailEnabled"
                        render={({ field }) => (
                          <FormItem className="rounded-md border bg-muted/20 p-4">
                            <div className="flex items-center gap-3">
                              <Checkbox checked={field.value} onCheckedChange={(value) => field.onChange(Boolean(value))} />
                              <div className="space-y-1">
                                <FormLabel>{t("labels.enable_email")}</FormLabel>
                                <FormDescription>{t("labels.enable_email_help")}</FormDescription>
                              </div>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="whatsappEnabled"
                        render={({ field }) => (
                          <FormItem className="rounded-md border bg-muted/20 p-4">
                            <div className="flex items-center gap-3">
                              <Checkbox checked={field.value} onCheckedChange={(value) => field.onChange(Boolean(value))} />
                              <div className="space-y-1">
                                <FormLabel>{t("labels.enable_whatsapp")}</FormLabel>
                                <FormDescription>{t("labels.enable_whatsapp_help")}</FormDescription>
                              </div>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="enabled"
                        render={({ field }) => (
                          <FormItem className="rounded-md border bg-muted/20 p-4">
                            <div className="flex items-center gap-3">
                              <Checkbox checked={field.value} onCheckedChange={(value) => field.onChange(Boolean(value))} />
                              <div className="space-y-1">
                                <FormLabel>{t("labels.status")}</FormLabel>
                                <FormDescription>{t("labels.status_help")}</FormDescription>
                              </div>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-1">
                      <FormField
                        control={form.control}
                        name="cameraId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("labels.camera")}</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger className="w-full cursor-pointer">
                                  <SelectValue placeholder={t("placeholders.camera")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {filteredCameras.map((camera) => (
                                  <SelectItem key={camera.id} value={String(camera.id)}>
                                    {camera.nome || `#${camera.id}`} {camera.ip ? `• ${camera.ip}` : ""}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="platesText"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("labels.plates")}</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              rows={4}
                              placeholder={t("placeholders.plates")}
                            />
                          </FormControl>
                          <FormDescription>{t("labels.plates_help")}</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="recipients" className="px-4">
                <AccordionTrigger className="cursor-pointer py-4 hover:no-underline">
                  <div className="space-y-1 text-left">
                    <div>{t("sections.recipients")}</div>
                    <div className="text-xs font-normal text-muted-foreground">
                      {t("sections.recipients_desc")}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  <div className="space-y-4 pb-4">
                    {form.watch("emailEnabled") ? (
                      <>
                        <FormField
                          control={form.control}
                          name="smtpAccountId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("labels.smtp_account")}</FormLabel>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger className="w-full cursor-pointer">
                                    <SelectValue placeholder={t("placeholders.smtp_account")} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {filteredSmtpAccounts.map((account) => (
                                    <SelectItem key={account.id} value={String(account.id)}>
                                      {account.name} • {account.fromEmail}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="recipientIds"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("labels.recipients")}</FormLabel>
                              <div className="rounded-md border bg-card">
                                <ScrollArea className="h-56">
                                  <div className="space-y-3 p-4">
                                    {filteredRecipients.length === 0 ? (
                                      <p className="text-sm text-muted-foreground">{t("empty_recipients")}</p>
                                    ) : (
                                      filteredRecipients.map((recipient) => {
                                        const checked = field.value.includes(String(recipient.id))
                                        return (
                                          <label
                                            key={recipient.id}
                                            className="flex items-start gap-3 rounded-md border bg-muted/20 p-3"
                                          >
                                            <Checkbox
                                              checked={checked}
                                              onCheckedChange={(next) => {
                                                if (next) {
                                                  field.onChange([...field.value, String(recipient.id)])
                                                  return
                                                }
                                                field.onChange(
                                                  field.value.filter((id: string) => id !== String(recipient.id)),
                                                )
                                              }}
                                            />
                                            <div className="min-w-0">
                                              <p className="font-medium">{recipient.name}</p>
                                              <p className="text-sm text-muted-foreground">{recipient.email}</p>
                                            </div>
                                          </label>
                                        )
                                      })
                                    )}
                                  </div>
                                </ScrollArea>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    ) : null}

                    {form.watch("whatsappEnabled") ? (
                      <>
                        <FormField
                          control={form.control}
                          name="whatsappAccountId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("labels.whatsapp_account")}</FormLabel>
                              <Select value={field.value} onValueChange={(value) => {
                                field.onChange(value)
                                form.setValue("whatsappRecipientIds", [], { shouldDirty: true })
                              }}>
                                <FormControl>
                                  <SelectTrigger className="w-full cursor-pointer">
                                    <SelectValue placeholder={t("placeholders.whatsapp_account")} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {filteredWhatsappAccounts.map((account) => (
                                    <SelectItem key={account.id} value={String(account.id)}>
                                      {account.name} {account.phoneNumber ? `• ${account.phoneNumber}` : ""}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="whatsappRecipientIds"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("labels.whatsapp_recipients")}</FormLabel>
                              <div className="rounded-md border bg-card">
                                <ScrollArea className="h-56">
                                  <div className="space-y-3 p-4">
                                    {filteredWhatsappRecipients.length === 0 ? (
                                      <p className="text-sm text-muted-foreground">{t("empty_whatsapp_recipients")}</p>
                                    ) : (
                                      filteredWhatsappRecipients.map((recipient) => {
                                        const checked = field.value.includes(String(recipient.id))
                                        return (
                                          <label
                                            key={recipient.id}
                                            className="flex items-start gap-3 rounded-md border bg-muted/20 p-3"
                                          >
                                            <Checkbox
                                              checked={checked}
                                              onCheckedChange={(next) => {
                                                if (next) {
                                                  field.onChange([...field.value, String(recipient.id)])
                                                  return
                                                }
                                                field.onChange(
                                                  field.value.filter((id: string) => id !== String(recipient.id)),
                                                )
                                              }}
                                            />
                                            <div className="min-w-0">
                                              <p className="font-medium">{recipient.name}</p>
                                              <p className="text-sm text-muted-foreground">
                                                {recipient.phoneNumber || recipient.chatId || t("labels.not_informed")}
                                              </p>
                                            </div>
                                          </label>
                                        )
                                      })
                                    )}
                                  </div>
                                </ScrollArea>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    ) : null}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="templates" className="px-4">
                <AccordionTrigger className="cursor-pointer py-4 hover:no-underline">
                  <div className="space-y-1 text-left">
                    <div>{t("sections.templates")}</div>
                    <div className="text-xs font-normal text-muted-foreground">
                      {t("sections.templates_desc")}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  <div className="space-y-4 pb-4">
                    <input type="hidden" {...form.register("subjectTemplate")} />
                    <input type="hidden" {...form.register("bodyTemplate")} />

                    <div className="rounded-md border bg-muted/20 p-4">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">{t("labels.template_editor")}</p>
                          <FormDescription>{t("labels.template_help")}</FormDescription>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="cursor-pointer md:self-start"
                          onClick={() => setIsTemplateEditorOpen(true)}
                        >
                          <FilePenLine className="h-4 w-4" />
                          {t("buttons.open_editor")}
                        </Button>
                      </div>

                      {form.formState.errors.subjectTemplate?.message ? (
                        <p className="mt-3 text-sm text-destructive">{form.formState.errors.subjectTemplate.message}</p>
                      ) : null}

                      {form.formState.errors.bodyTemplate?.message ? (
                        <p className="mt-2 text-sm text-destructive">{form.formState.errors.bodyTemplate.message}</p>
                      ) : null}
                    </div>
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
                {rule ? t("buttons.save") : t("buttons.create")}
              </Button>
            </DialogFooter>
          </form>
        </Form>

        <EmailTemplateEditorDialog
          open={isTemplateEditorOpen}
          onOpenChange={setIsTemplateEditorOpen}
          title={t("editor.title")}
          description={t("editor.description")}
          subjectLabel={t("labels.subject")}
          subjectPlaceholder={t("placeholders.subject")}
          bodyLabel={t("labels.body")}
          bodyPlaceholder={t("placeholders.body")}
          toolbarLabel={t("editor.toolbar_title")}
          emptyTokensLabel={t("editor.empty_tokens")}
          subjectValue={form.watch("subjectTemplate")}
          bodyValue={form.watch("bodyTemplate")}
          onSave={({ subject, body }) => {
            form.setValue("subjectTemplate", subject, { shouldDirty: true, shouldValidate: true })
            form.setValue("bodyTemplate", body, { shouldDirty: true, shouldValidate: true })
          }}
          tokens={templateTokens}
          actions={{
            cancel: t("editor.cancel"),
            save: t("editor.save"),
            bold: t("editor.toolbar.bold"),
            italic: t("editor.toolbar.italic"),
            heading1: t("editor.toolbar.heading1"),
            heading2: t("editor.toolbar.heading2"),
            list: t("editor.toolbar.list"),
            quote: t("editor.toolbar.quote"),
            code: t("editor.toolbar.code"),
            link: t("editor.toolbar.link"),
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
