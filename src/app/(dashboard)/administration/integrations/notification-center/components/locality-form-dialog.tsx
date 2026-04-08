"use client"

import { useEffect, useMemo, useState } from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Loader2, MapPinned } from "lucide-react"
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
import {
  formatPointCoordinates,
  parsePointCoordinates,
} from "@/app/(dashboard)/administration/points/components/utils"
import { LocalityMapPickerDialog } from "./locality-map-picker-dialog"

const COORDINATES_REGEX =
  /^\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*$/

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
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false)
  const isEdit = !!locality

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(1, t("localities.form.validations.name")),
        description: z.string().optional(),
        coordinates: z
          .string()
          .trim()
          .min(1, t("localities.form.validations.coordinates"))
          .refine(
            (value) => COORDINATES_REGEX.test(value),
            t("localities.form.validations.coordinates"),
          ),
        radiusKm: z.number().positive(t("localities.form.validations.radius")),
        maxLocationAgeMinutes: z.number().positive(t("localities.form.validations.max_age")),
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
      coordinates: "-22.376534,-41.794399",
      radiusKm: 2,
      maxLocationAgeMinutes: 120,
    },
  })

  const currentCoordinates = form.watch("coordinates")
  const parsedCoordinates = useMemo(
    () => parsePointCoordinates(currentCoordinates),
    [currentCoordinates],
  )

  useEffect(() => {
    if (!open) return

    form.reset({
      name: locality?.name || "",
      description: locality?.description || "",
      coordinates:
        typeof locality?.centerLat === "number" && typeof locality?.centerLng === "number"
          ? formatPointCoordinates({
              lat: locality.centerLat,
              lng: locality.centerLng,
            })
          : "-22.376534,-41.794399",
      radiusKm: locality?.radiusKm ?? 2,
      maxLocationAgeMinutes: locality?.maxLocationAgeMinutes ?? 120,
    })
  }, [form, locality, open])

  const onSubmit = async (values: LocalityFormValues) => {
    setIsSubmitting(true)
    try {
      const coordinates = parsePointCoordinates(values.coordinates)

      if (!coordinates) {
        form.setError("coordinates", {
          type: "manual",
          message: t("localities.form.validations.coordinates"),
        })
        return
      }

      const payload = {
        name: values.name,
        description: values.description,
        centerLat: coordinates.lat,
        centerLng: coordinates.lng,
        radiusKm: values.radiusKm,
        maxLocationAgeMinutes: values.maxLocationAgeMinutes,
      }

      if (isEdit && locality) {
        await notificationCenterService.updateLocality(locality.id, payload)
        toast.success(t("localities.form.notifications.update_success"))
      } else {
        await notificationCenterService.createLocality(payload)
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
            <FormField
              control={form.control}
              name="coordinates"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between gap-3">
                    <FormLabel>{t("localities.form.labels.coordinates")}</FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="cursor-pointer"
                      onClick={() => setIsMapPickerOpen(true)}
                    >
                      <MapPinned className="mr-2 h-4 w-4" />
                      {parsedCoordinates
                        ? t("localities.form.actions.adjust_on_map")
                        : t("localities.form.actions.select_on_map")}
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("localities.form.placeholders.coordinates")}
                      />
                    </FormControl>
                    <div className="rounded-md border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                      {parsedCoordinates
                        ? t("localities.form.selected_coordinates", {
                            coordinates: formatPointCoordinates(parsedCoordinates),
                          })
                        : t("localities.form.no_coordinates")}
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="radiusKm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("localities.form.labels.radius")}</FormLabel>
                    <div className="rounded-md border bg-muted/20 px-3 py-3">
                      <div className="text-lg font-semibold">{field.value} km</div>
                      <div className="text-xs text-muted-foreground">
                        {t("localities.form.summary.radius")}
                      </div>
                    </div>
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
                    <div className="rounded-md border bg-muted/20 px-3 py-3">
                      <div className="text-lg font-semibold">{field.value} min</div>
                      <div className="text-xs text-muted-foreground">
                        {t("localities.form.summary.max_age")}
                      </div>
                    </div>
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

        <LocalityMapPickerDialog
          open={isMapPickerOpen}
          onOpenChange={setIsMapPickerOpen}
          initialCoordinates={parsedCoordinates}
          initialRadiusKm={form.getValues("radiusKm")}
          initialMaxLocationAgeMinutes={form.getValues("maxLocationAgeMinutes")}
          onConfirm={({ coordinates, radiusKm, maxLocationAgeMinutes }) => {
            form.setValue("coordinates", coordinates, {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            })
            form.setValue("radiusKm", radiusKm, {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            })
            form.setValue("maxLocationAgeMinutes", maxLocationAgeMinutes, {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            })
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
