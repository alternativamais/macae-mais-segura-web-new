"use client"

import { useEffect, useMemo, useState } from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { notificationCenterService } from "@/services/notification-center.service"
import { NotificationLocality } from "@/types/notification-center"
import { useTranslator } from "@/lib/i18n"

interface LocalityFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  locality?: NotificationLocality | null
  onSuccess: () => void | Promise<void>
}

export function LocalityFormDialog({
  open,
  onOpenChange,
  locality,
  onSuccess,
}: LocalityFormDialogProps) {
  const t = useTranslator("notification_center")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEdit = !!locality

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(1, t("localities.form.validations.name")),
        description: z.string().optional(),
        centerLat: z.coerce
          .number()
          .min(-90, t("localities.form.validations.latitude"))
          .max(90, t("localities.form.validations.latitude")),
        centerLng: z.coerce
          .number()
          .min(-180, t("localities.form.validations.longitude"))
          .max(180, t("localities.form.validations.longitude")),
        radiusKm: z.coerce.number().positive(t("localities.form.validations.radius")),
        maxLocationAgeMinutes: z.coerce
          .number()
          .positive(t("localities.form.validations.max_age")),
      }),
    [t],
  )

  type LocalityFormInput = z.input<typeof schema>
  type LocalityFormValues = z.output<typeof schema>

  const form = useForm<LocalityFormInput, unknown, LocalityFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      centerLat: -22.376534,
      centerLng: -41.794399,
      radiusKm: 2,
      maxLocationAgeMinutes: 120,
    },
  })

  useEffect(() => {
    if (!open) return

    form.reset({
      name: locality?.name || "",
      description: locality?.description || "",
      centerLat: locality?.centerLat ?? -22.376534,
      centerLng: locality?.centerLng ?? -41.794399,
      radiusKm: locality?.radiusKm ?? 2,
      maxLocationAgeMinutes: locality?.maxLocationAgeMinutes ?? 120,
    })
  }, [form, locality, open])

  const onSubmit = async (values: LocalityFormValues) => {
    setIsSubmitting(true)
    try {
      if (isEdit && locality) {
        await notificationCenterService.updateLocality(locality.id, values)
        toast.success(t("localities.form.notifications.update_success"))
      } else {
        await notificationCenterService.createLocality(values)
        toast.success(t("localities.form.notifications.create_success"))
      }
      await onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast.apiError(
        error,
        isEdit
          ? t("localities.form.notifications.update_error")
          : t("localities.form.notifications.create_error"),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? t("localities.form.title_edit")
              : t("localities.form.title_create")}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? t("localities.form.description_edit")
              : t("localities.form.description_create")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("localities.form.labels.name")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t("localities.form.placeholders.name")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("localities.form.labels.description")}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={t("localities.form.placeholders.description")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="centerLat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("localities.form.labels.latitude")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.000001"
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        value={typeof field.value === "number" ? field.value : ""}
                        onChange={(event) => field.onChange(event.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="centerLng"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("localities.form.labels.longitude")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.000001"
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        value={typeof field.value === "number" ? field.value : ""}
                        onChange={(event) => field.onChange(event.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="radiusKm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("localities.form.labels.radius")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        value={typeof field.value === "number" ? field.value : ""}
                        onChange={(event) => field.onChange(event.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxLocationAgeMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("localities.form.labels.max_age")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="1"
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        value={typeof field.value === "number" ? field.value : ""}
                        onChange={(event) => field.onChange(event.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("localities.form.buttons.cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isEdit
                  ? t("localities.form.buttons.save")
                  : t("localities.form.buttons.create")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
