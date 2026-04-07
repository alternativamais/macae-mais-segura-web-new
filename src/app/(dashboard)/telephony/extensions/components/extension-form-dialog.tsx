"use client"

import { useEffect, useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { notificationService as toast } from "@/lib/notifications/notification-service"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTranslator } from "@/lib/i18n"
import { callCenterExtensionService } from "@/services/call-center-extension.service"
import { CallCenterExtension } from "@/types/call-center-extension"

interface ExtensionFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void | Promise<void>
  extension?: CallCenterExtension | null
}

function createExtensionFormSchema(messages: {
  numberMin: string
  descriptionMin: string
  queueMin: string
}) {
  return z.object({
    numeroRamal: z.string().trim().min(1, messages.numberMin),
    descricao: z.string().trim().min(1, messages.descriptionMin),
    queueName: z.string().trim().min(1, messages.queueMin),
    type: z.enum(["operator", "totem"]),
    status: z.enum(["active", "inactive"]),
  })
}

type ExtensionFormValues = z.infer<ReturnType<typeof createExtensionFormSchema>>

export function ExtensionFormDialog({
  open,
  onOpenChange,
  onSuccess,
  extension,
}: ExtensionFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEdit = !!extension
  const t = useTranslator("call_center_extensions.form")

  const formSchema = useMemo(
    () =>
      createExtensionFormSchema({
        numberMin: t("validations.number_min"),
        descriptionMin: t("validations.description_min"),
        queueMin: t("validations.queue_min"),
      }),
    [t],
  )

  const form = useForm<ExtensionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numeroRamal: "",
      descricao: "",
      queueName: "",
      type: "operator",
      status: "active",
    },
  })

  useEffect(() => {
    if (!open) return

    form.reset({
      numeroRamal: extension?.numeroRamal || "",
      descricao: extension?.descricao || "",
      queueName: extension?.queueName || "",
      type: extension?.type === "totem" ? "totem" : "operator",
      status: extension?.status === "inactive" ? "inactive" : "active",
    })
  }, [extension, form, open])

  const onSubmit = async (values: ExtensionFormValues) => {
    setIsSubmitting(true)

    try {
      if (isEdit && extension) {
        await callCenterExtensionService.update(extension.id, values)
        toast.success(t("notifications.update_success"))
      } else {
        await callCenterExtensionService.create(values)
        toast.success(t("notifications.create_success"))
      }

      await onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast.apiError(error, isEdit ? t("notifications.update_error") : t("notifications.create_error"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
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
              name="numeroRamal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("labels.number")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("placeholders.number")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("labels.description")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("placeholders.description")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="queueName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("labels.queue")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("placeholders.queue")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("labels.type")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t("placeholders.type")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="operator">{t("options.type_operator")}</SelectItem>
                        <SelectItem value="totem">{t("options.type_totem")}</SelectItem>
                      </SelectContent>
                    </Select>
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t("placeholders.status")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">{t("options.status_active")}</SelectItem>
                        <SelectItem value="inactive">{t("options.status_inactive")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("buttons.cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isEdit ? t("buttons.save") : t("buttons.create")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
