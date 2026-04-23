"use client"

import { useEffect, useState } from "react"
import { Loader2, Upload } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTranslator } from "@/lib/i18n"
import { useMemo } from "react"
import { formatLocaleNumber } from "./utils"

interface RestoreUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void | Promise<void>
}

export function RestoreUploadDialog({
  open,
  onOpenChange,
  onSuccess,
}: RestoreUploadDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const t = useTranslator("backup.restore_upload_dialog")
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

  type FormValues = z.infer<typeof formSchema>

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      mode: "dry-run",
    },
  })

  useEffect(() => {
    if (!open) return

    setFile(null)
    form.reset({
      password: "",
      mode: "dry-run",
    })
  }, [open, form])

  const onSubmit = async (values: FormValues) => {
    if (!file) {
      toast.error(t("error_no_file"))
      return
    }

    setIsSubmitting(true)

    try {
      const response = await backupService.restoreFromUpload(file, values.password!, values.mode)
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
            <div className="space-y-2">
              <FormLabel>{t("form_file")}</FormLabel>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed bg-muted/30 px-4 py-4">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {file ? file.name : t("placeholder_file")}
                </span>
                <Input
                  type="file"
                  accept=".mmsbkp"
                  className="hidden"
                  onChange={(event) => setFile(event.target.files?.[0] || null)}
                />
              </label>
            </div>

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
