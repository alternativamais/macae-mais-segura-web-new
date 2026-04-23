"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { backupService } from "@/services/backup.service"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useTranslator } from "@/lib/i18n"
import { useMemo } from "react"
import { formatLocaleNumber } from "./utils"

interface CreateBackupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void | Promise<void>
}

export function CreateBackupDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateBackupDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const t = useTranslator("backup.create_dialog")
  const currentLocale = t.getLocale()
  const validationPasswordMin = t("val_pwd_min")
  const validationPasswordMax = t("val_pwd_max")
  const validationNotesMax = t("val_notes")

  const formSchema = useMemo(
    () =>
      z.object({
        password: z
          .string()
          .min(8, validationPasswordMin)
          .max(128, validationPasswordMax),
        notes: z.string().max(256, validationNotesMax).optional(),
      }),
    [validationNotesMax, validationPasswordMax, validationPasswordMin]
  )

  type FormValues = z.infer<typeof formSchema>

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      notes: "",
    },
  })

  useEffect(() => {
    if (!open) return

    form.reset({
      password: "",
      notes: "",
    })
  }, [open, form])

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true)

    try {
      const response = await backupService.createBackup(
        values.password!,
        values.notes?.trim() || undefined
      )
      toast.success(
        t("success", { count: formatLocaleNumber(response.summary.rowCount, currentLocale) })
      )
      await onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast.apiError(error, t("error"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("desc")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form_pwd")}</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder={t("placeholder_pwd")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form_notes")}</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder={t("placeholder_notes")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                {t("btn_cancel")}
              </Button>
              <Button type="submit" className="cursor-pointer" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t("btn_submit")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
