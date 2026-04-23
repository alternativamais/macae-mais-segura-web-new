"use client"

import { useEffect, useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
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
  FormDescription,
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
import { WhatsappAccount, WhatsappRecipient } from "@/types/email-integration"

interface WhatsappRecipientFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recipient: WhatsappRecipient | null
  accounts: WhatsappAccount[]
  onSuccess: () => Promise<void> | void
}

export function WhatsappRecipientFormDialog({
  open,
  onOpenChange,
  recipient,
  accounts,
  onSuccess,
}: WhatsappRecipientFormDialogProps) {
  const t = useTranslator("email_integrations.whatsapp_recipients.form")
  const tCompany = useTranslator("company_field")
  const { companies, defaultCompanyId, showCompanySelector } = useTenantCompanySelection()
  const [catalog, setCatalog] = useState<WhatsappRecipient[]>([])
  const [isCatalogLoading, setIsCatalogLoading] = useState(false)
  const [openSection, setOpenSection] = useState("source")

  const isImportedRecipient = Boolean(recipient && recipient.type !== "manual_phone")

  const schema = useMemo(
    () =>
      z.object({
        empresaId: showCompanySelector
          ? z.string().min(1, tCompany("required"))
          : z.string().optional(),
        mode: z.enum(["manual_phone", "imported"]),
        accountId: z.string().optional(),
        sourceRecipientId: z.string().optional(),
        name: z.string().trim().min(2, t("validations.name")),
        phoneNumber: z.string().trim().optional(),
        enabled: z.enum(["true", "false"]),
        description: z.string().optional(),
      }).superRefine((values, ctx) => {
        if (values.mode === "manual_phone") {
          if (!values.phoneNumber || values.phoneNumber.trim().length < 8) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["phoneNumber"],
              message: t("validations.phone"),
            })
          }
          return
        }

        if (!isImportedRecipient && !values.accountId) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["accountId"],
            message: t("validations.account"),
          })
        }

        if (!isImportedRecipient && !values.sourceRecipientId) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["sourceRecipientId"],
            message: t("validations.catalog"),
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
      mode: "manual_phone",
      accountId: "",
      sourceRecipientId: "",
      name: "",
      phoneNumber: "",
      enabled: "true",
      description: "",
    },
  })

  const selectedCompanyId = form.watch("empresaId")
  const selectedMode = form.watch("mode")
  const selectedAccountId = form.watch("accountId")
  const selectedSourceRecipientId = form.watch("sourceRecipientId")
  const filteredCompanyId = selectedCompanyId?.trim()
    ? Number(selectedCompanyId)
    : defaultCompanyId ?? null

  const filteredAccounts = useMemo(
    () => accounts.filter((account) => (filteredCompanyId ? account.empresaId === filteredCompanyId : true)),
    [accounts, filteredCompanyId],
  )

  const selectedCatalogRecipient = useMemo(
    () => catalog.find((item) => String(item.id) === selectedSourceRecipientId) || null,
    [catalog, selectedSourceRecipientId],
  )

  useEffect(() => {
    if (!open) return
    setOpenSection("source")
    setCatalog([])

    form.reset({
      empresaId:
        typeof recipient?.empresaId === "number"
          ? String(recipient.empresaId)
          : defaultCompanyId
            ? String(defaultCompanyId)
            : "",
      mode: recipient?.type === "manual_phone" ? "manual_phone" : "imported",
      accountId: recipient?.accountId ? String(recipient.accountId) : "",
      sourceRecipientId: "",
      name: recipient?.name || "",
      phoneNumber: recipient?.phoneNumber || "",
      enabled: recipient?.enabled === false ? "false" : "true",
      description: recipient?.description || "",
    })
  }, [defaultCompanyId, form, open, recipient])

  useEffect(() => {
    if (!open || selectedMode !== "imported" || !selectedAccountId) {
      setCatalog([])
      return
    }

    let cancelled = false

    async function loadCatalog() {
      setIsCatalogLoading(true)
      try {
        const items = await emailIntegrationService.listWhatsappRecipientCatalog(Number(selectedAccountId))
        if (cancelled) return
        setCatalog(items)
      } catch (error) {
        if (!cancelled) {
          toast.apiError(error, t("notifications.catalog_error"))
          setCatalog([])
        }
      } finally {
        if (!cancelled) {
          setIsCatalogLoading(false)
        }
      }
    }

    void loadCatalog()

    return () => {
      cancelled = true
    }
  }, [open, selectedAccountId, selectedMode, t])

  useEffect(() => {
    if (selectedMode !== "imported") return
    if (!selectedCatalogRecipient) return

    form.setValue("name", selectedCatalogRecipient.name || "", { shouldDirty: true })
    form.setValue("phoneNumber", selectedCatalogRecipient.phoneNumber || "", { shouldDirty: false })
  }, [form, selectedCatalogRecipient, selectedMode])

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload =
        values.mode === "imported"
          ? {
              ...(values.empresaId ? { empresaId: Number(values.empresaId) } : {}),
              type: "imported" as const,
              sourceRecipientId: Number(values.sourceRecipientId),
              name: values.name.trim(),
              enabled: values.enabled === "true",
              description: values.description?.trim() || undefined,
            }
          : {
              ...(values.empresaId ? { empresaId: Number(values.empresaId) } : {}),
              type: "manual_phone" as const,
              name: values.name.trim(),
              phoneNumber: values.phoneNumber?.trim() || "",
              enabled: values.enabled === "true",
              description: values.description?.trim() || undefined,
            }

      if (recipient) {
        const updatePayload =
          recipient.type === "manual_phone"
            ? {
                name: values.name.trim(),
                phoneNumber: values.phoneNumber?.trim() || "",
                enabled: values.enabled === "true",
                description: values.description?.trim() || undefined,
              }
            : {
                name: values.name.trim(),
                enabled: values.enabled === "true",
                description: values.description?.trim() || undefined,
              }

        await emailIntegrationService.updateWhatsappRecipient(recipient.id, updatePayload)
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
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{recipient ? t("title_edit") : t("title_create")}</DialogTitle>
          <DialogDescription>{recipient ? t("description_edit") : t("description_create")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit}>
            <Accordion
              type="single"
              collapsible
              value={openSection}
              onValueChange={(value) => setOpenSection(value || "source")}
              className="space-y-4"
            >
              <AccordionItem value="source" className="rounded-xl border bg-card">
                <AccordionTrigger className="px-4 py-3 text-left hover:no-underline">
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold">{t("sections.source.title")}</h3>
                    <p className="text-sm text-muted-foreground">{t("sections.source.description")}</p>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 px-4 pb-4">
                  {showCompanySelector ? (
                    <TenantCompanyFormField control={form.control} companies={companies} name="empresaId" />
                  ) : null}

                  {!recipient ? (
                    <FormField
                      control={form.control}
                      name="mode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("fields.mode.label")}</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value)
                              form.setValue("accountId", "", { shouldDirty: true })
                              form.setValue("sourceRecipientId", "", { shouldDirty: true })
                              setCatalog([])
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="manual_phone">{t("fields.mode.manual_phone")}</SelectItem>
                              <SelectItem value="imported">{t("fields.mode.imported")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>{t("fields.mode.help")}</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : null}

                  {selectedMode === "imported" ? (
                    <>
                      <FormField
                        control={form.control}
                        name="accountId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("fields.account.label")}</FormLabel>
                            <Select
                              disabled={isImportedRecipient}
                              onValueChange={(value) => {
                                field.onChange(value)
                                form.setValue("sourceRecipientId", "", { shouldDirty: true })
                              }}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("fields.account.placeholder")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {filteredAccounts.map((account) => (
                                  <SelectItem key={account.id} value={String(account.id)}>
                                    {account.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>{t("fields.account.help")}</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {!recipient ? (
                        <FormField
                          control={form.control}
                          name="sourceRecipientId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("fields.catalog.label")}</FormLabel>
                              <Select
                                disabled={!selectedAccountId || isCatalogLoading}
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue
                                      placeholder={
                                        isCatalogLoading
                                          ? t("fields.catalog.loading")
                                          : t("fields.catalog.placeholder")
                                      }
                                    />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {catalog.map((item) => (
                                    <SelectItem key={item.id} value={String(item.id)}>
                                      {item.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                {!selectedAccountId
                                  ? t("fields.catalog.account_required")
                                  : catalog.length === 0 && !isCatalogLoading
                                    ? t("fields.catalog.empty")
                                    : t("fields.catalog.help")}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : (
                        <div className="rounded-lg border bg-muted/20 px-4 py-3">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{t("fields.catalog.current_label")}</p>
                            <p className="text-sm text-muted-foreground">
                              {recipient.name}
                              {recipient.chatId ? ` • ${recipient.chatId}` : ""}
                            </p>
                          </div>
                        </div>
                      )}

                      {selectedCatalogRecipient ? (
                        <div className="rounded-lg border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                          <div>{selectedCatalogRecipient.phoneNumber || t("fields.catalog.no_phone")}</div>
                          <div className="break-all">{selectedCatalogRecipient.chatId || t("fields.catalog.no_chat")}</div>
                        </div>
                      ) : null}
                    </>
                  ) : null}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="details" className="rounded-xl border bg-card">
                <AccordionTrigger className="px-4 py-3 text-left hover:no-underline">
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold">{t("sections.details.title")}</h3>
                    <p className="text-sm text-muted-foreground">{t("sections.details.description")}</p>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 px-4 pb-4">
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
                            disabled={selectedMode !== "manual_phone"}
                            placeholder={t("fields.phone.placeholder")}
                          />
                        </FormControl>
                        <FormDescription>
                          {selectedMode === "manual_phone"
                            ? t("fields.phone.help")
                            : t("fields.phone.linked_help")}
                        </FormDescription>
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
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <DialogFooter className="mt-6">
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
