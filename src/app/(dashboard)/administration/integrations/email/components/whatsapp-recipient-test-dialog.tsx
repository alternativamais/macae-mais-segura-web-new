"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2 } from "lucide-react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslator } from "@/lib/i18n"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { emailIntegrationService } from "@/services/email-integration.service"
import { WhatsappAccount, WhatsappRecipient } from "@/types/email-integration"

interface WhatsappRecipientTestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recipient: WhatsappRecipient | null
  accounts: WhatsappAccount[]
}

export function WhatsappRecipientTestDialog({
  open,
  onOpenChange,
  recipient,
  accounts,
}: WhatsappRecipientTestDialogProps) {
  const t = useTranslator("email_integrations.whatsapp_recipients.test_dialog")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const availableAccounts = useMemo(() => {
    if (!recipient) return []

    return accounts.filter((account) => {
      if (!account.enabled) return false
      if (account.empresaId !== recipient.empresaId) return false
      if (recipient.accountId) return account.id === recipient.accountId
      return true
    })
  }, [accounts, recipient])

  const schema = useMemo(
    () =>
      z.object({
        accountId:
          availableAccounts.length > 1
            ? z.string().min(1, t("validations.account"))
            : z.string().optional(),
      }),
    [availableAccounts.length, t],
  )

  type FormValues = z.infer<typeof schema>

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      accountId: "",
    },
  })

  useEffect(() => {
    if (!open) return

    form.reset({
      accountId:
        recipient?.accountId
          ? String(recipient.accountId)
          : availableAccounts.length === 1
            ? String(availableAccounts[0].id)
            : "",
    })
  }, [availableAccounts, form, open, recipient])

  const onSubmit = form.handleSubmit(async (values) => {
    if (!recipient) return

    setIsSubmitting(true)
    try {
      await emailIntegrationService.testWhatsappRecipient(recipient.id, {
        accountId: values.accountId ? Number(values.accountId) : undefined,
      })
      toast.success(t("notifications.success"))
      onOpenChange(false)
    } catch (error) {
      toast.apiError(error, t("notifications.error"))
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description", { name: recipient?.name || t("default_name") })}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="rounded-xl border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
              <div>{recipient?.phoneNumber || t("no_phone")}</div>
              {recipient?.chatId ? <div className="break-all">{recipient.chatId}</div> : null}
            </div>

            {availableAccounts.length > 1 ? (
              <FormField
                control={form.control}
                name="accountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fields.account.label")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("fields.account.placeholder")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableAccounts.map((account) => (
                          <SelectItem key={account.id} value={String(account.id)}>
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <div className="space-y-1">
                <p className="text-sm font-medium">{t("fields.account.label")}</p>
                <div className="rounded-lg border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                  {availableAccounts[0]?.name || t("no_account")}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                {t("actions.cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting || !recipient || availableAccounts.length === 0}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t("actions.submit")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
