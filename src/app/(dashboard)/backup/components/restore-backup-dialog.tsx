"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { backupService } from "@/services/backup.service"
import { BackupRecord } from "@/types/backup"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTranslator } from "@/lib/i18n"
import { formatLocaleNumber } from "./utils"

interface RestoreBackupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void | Promise<void>
  backup: BackupRecord | null
}

type FormValues = {
  password?: string
  mode: "replace" | "dry-run"
}

export function RestoreBackupDialog({
  open,
  onOpenChange,
  onSuccess,
  backup,
}: RestoreBackupDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const t = useTranslator("backup.restore_dialog")
  const currentLocale = t.getLocale()
  const validationPasswordMin = t("val_pwd_min")
  const validationPasswordMax = t("val_pwd_max")

  const formSchema = useMemo(
    () =>
      z.object({
        password: z
          .string()
          .min(8, validationPasswordMin)
          .max(128, validationPasswordMax),
        mode: z.enum(["replace", "dry-run"]),
      }),
    [validationPasswordMax, validationPasswordMin]
  )

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      password: "",
      mode: "dry-run",
    },
  })

  useEffect(() => {
    if (!open) return

    form.reset({
      password: "",
      mode: "dry-run",
    })
  }, [open, form])

  const onSubmit = async (values: FormValues) => {
    if (!backup) return

    setIsSubmitting(true)

    try {
      const response = await backupService.restoreFromRecord(
        backup.id,
        values.password!,
        values.mode
      )
      toast.success(
        response.applied
          ? t("success_restore", { count: formatLocaleNumber(response.summary.rowCount, currentLocale) })
          : t("success_dryrun", { count: formatLocaleNumber(response.summary.rowCount, currentLocale) })
      )
      await onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast.apiError(error, t("error"))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!backup) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("desc", { file: backup.fileName || `#${backup.id}` })}
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
              name="mode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form_mode")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="cursor-pointer">
                        <SelectValue placeholder={t("placeholder_mode")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="dry-run">{t("mode_dryrun")}</SelectItem>
                      <SelectItem value="replace">{t("mode_replace")}</SelectItem>
                    </SelectContent>
                  </Select>
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
                {form.watch("mode") === "dry-run" ? t("btn_validate") : t("btn_restore")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
