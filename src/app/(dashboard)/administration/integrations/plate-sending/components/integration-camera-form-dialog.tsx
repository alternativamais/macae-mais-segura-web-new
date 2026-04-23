"use client"

import { useEffect, useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { useTranslator } from "@/lib/i18n"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { integrationService } from "@/services/integration.service"
import {
  Integration,
  IntegrationCameraBinding,
  IntegrationCameraSummary,
  IntegrationDirectionFilter,
} from "@/types/integration"
import {
  buildDirectionalCodePayload,
  formatDirectionFilter,
  getCameraLocationLabel,
} from "./utils"

const formSchema = z.object({
  directionFilter: z.enum(["ALL", "OBVERSE", "REVERSE"]),
  singleCode: z.string().optional(),
  obverseCode: z.string().optional(),
  reverseCode: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface IntegrationCameraFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  integration: Integration
  camera: IntegrationCameraSummary | null
  binding: IntegrationCameraBinding | null
  onSuccess: () => Promise<void> | void
}

function getIdentifierLabel(code: string, t: ReturnType<typeof useTranslator>) {
  return code.trim().toLowerCase() === "prf"
    ? t("integration_specs.prf.identifier_label")
    : t("integration_specs.pmrj.identifier_label")
}

export function IntegrationCameraFormDialog({
  open,
  onOpenChange,
  integration,
  camera,
  binding,
  onSuccess,
}: IntegrationCameraFormDialogProps) {
  const t = useTranslator("plate_sending")
  const identifierLabel = getIdentifierLabel(integration.code, t)
  const isCustomIntegration = integration.driver === "custom_webhook"
  const targetCamera = binding?.camera || camera
  const isEditing = Boolean(binding)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as never,
    defaultValues: {
      directionFilter: "ALL",
      singleCode: "",
      obverseCode: "",
      reverseCode: "",
    },
  })

  const directionFilter = useWatch({
    control: form.control,
    name: "directionFilter",
  })

  const locationLabel = useMemo(
    () => getCameraLocationLabel(targetCamera, t("shared.not_informed")),
    [t, targetCamera],
  )

  useEffect(() => {
    if (!open) return

    const nextDirection = formatDirectionFilter(binding?.directionFilter)
    form.reset({
      directionFilter: nextDirection,
      singleCode:
        nextDirection === "OBVERSE"
          ? binding?.codCetObverse || binding?.codCet || ""
          : nextDirection === "REVERSE"
            ? binding?.codCetReverse || binding?.codCet || ""
            : binding?.codCet || "",
      obverseCode: binding?.codCetObverse || binding?.codCet || "",
      reverseCode: binding?.codCetReverse || binding?.codCet || "",
    })
  }, [binding, form, open])

  const handleDirectionChange = (value: IntegrationDirectionFilter) => {
    const currentSingle = form.getValues("singleCode")?.trim() || ""
    const currentObverse = form.getValues("obverseCode")?.trim() || ""
    const currentReverse = form.getValues("reverseCode")?.trim() || ""

    form.setValue("directionFilter", value, { shouldDirty: true, shouldValidate: true })

    if (value === "ALL") {
      if (!currentObverse && currentSingle) {
        form.setValue("obverseCode", currentSingle, { shouldDirty: true })
      }
      if (!currentReverse && currentSingle) {
        form.setValue("reverseCode", currentSingle, { shouldDirty: true })
      }
      return
    }

    if (value === "OBVERSE") {
      form.setValue("singleCode", currentSingle || currentObverse, { shouldDirty: true })
      return
    }

    form.setValue("singleCode", currentSingle || currentReverse, { shouldDirty: true })
  }

  const onSubmit = form.handleSubmit(async (values) => {
    const cameraId = binding?.cameraId || camera?.id

    if (!cameraId) {
      toast.error(t("management.notifications.camera_missing"))
      return
    }

    const payload = {
      active: binding?.active ?? false,
      directionFilter: values.directionFilter,
      ...(isCustomIntegration
        ? {}
        : buildDirectionalCodePayload({
            directionFilter: values.directionFilter,
            singleCode: values.singleCode,
            obverseCode: values.obverseCode,
            reverseCode: values.reverseCode,
          })),
    }

    try {
      if (binding) {
        await integrationService.updateCamera(integration.code, cameraId, payload)
        toast.success(t("management.notifications.edit_success"))
      } else {
        await integrationService.addCamera(integration.code, cameraId, payload)
        toast.success(t("management.notifications.add_success"))
      }

      await onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast.apiError(
        error,
        binding
          ? t("management.notifications.edit_error")
          : t("management.notifications.add_error"),
      )
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? t("management.form.edit_title")
              : t("management.form.add_title")}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t("management.form.edit_description", { integration: integration.name })
              : t("management.form.add_description", { integration: integration.name })}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/20 p-4 text-sm">
          <div className="space-y-1">
            <p className="font-medium">
              {targetCamera?.nome || t("management.form.camera_fallback")}
            </p>
            <p className="text-muted-foreground">{locationLabel}</p>
            <p className="text-muted-foreground">
              {targetCamera?.ip || t("shared.not_informed")}
            </p>
          </div>
        </div>

        <Form {...form}>
          <form className="space-y-4" onSubmit={onSubmit}>
            <FormField
              control={form.control}
              name="directionFilter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("management.form.direction_filter")}</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value: IntegrationDirectionFilter) => {
                      field.onChange(value)
                      handleDirectionChange(value)
                    }}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full cursor-pointer">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ALL">
                        {t("management.direction_labels.all")}
                      </SelectItem>
                      <SelectItem value="OBVERSE">
                        {t("management.direction_labels.obverse")}
                      </SelectItem>
                      <SelectItem value="REVERSE">
                        {t("management.direction_labels.reverse")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {t("management.form.direction_help")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isCustomIntegration && directionFilter === "ALL" ? (
              <div className="grid gap-4">
                <FormField
                  control={form.control}
                  name="obverseCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("management.form.identifier_obverse", {
                          label: identifierLabel,
                        })}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder={t("management.form.identifier_placeholder")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reverseCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("management.form.identifier_reverse", {
                          label: identifierLabel,
                        })}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder={t("management.form.identifier_placeholder")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : !isCustomIntegration ? (
              <FormField
                control={form.control}
                name="singleCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("management.form.identifier_single", {
                        label: identifierLabel,
                      })}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        placeholder={t("management.form.identifier_placeholder")}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("management.form.identifier_help")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
                {t("management.form.custom_identifier_help")}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer"
                onClick={() => onOpenChange(false)}
                disabled={form.formState.isSubmitting}
              >
                {t("management.form.cancel")}
              </Button>
              <Button
                type="submit"
                className="cursor-pointer"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting
                  ? t("management.form.saving")
                  : isEditing
                    ? t("management.form.save")
                    : t("management.form.add")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
