"use client"

import { useEffect, useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Info, Loader2 } from "lucide-react"
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
  FormDescription,
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
import { pontoService } from "@/services/ponto.service"
import { totemService } from "@/services/totem.service"
import { Ponto } from "@/types/ponto"
import { Totem, TotemCallCenterExtension } from "@/types/totem"
import {
  buildCallCenterExtensionLabel,
  getTotemPointLabel,
  getTotemPointReference,
  isCallCenterExtensionDisabled,
} from "./utils"

interface TotemFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void | Promise<void>
  totem?: Totem | null
}

const NO_POINT_VALUE = "__none__"
const NO_EXTENSION_VALUE = "__none__"

function createTotemFormSchema(messages: {
  numberMin: string
  pointRequired: string
  pointEditableInfo: string
}, isEdit: boolean) {
  return z.object({
    numero: z.string().trim().min(1, messages.numberMin),
    pontoId: isEdit
      ? z.string()
      : z.string().refine((value) => value !== NO_POINT_VALUE, messages.pointRequired),
    status: z.enum(["active", "inactive"]),
    callCenterExtensionId: z.string(),
    pointEditableInfo: z.string().optional(),
  })
}

type TotemFormValues = z.infer<ReturnType<typeof createTotemFormSchema>>

export function TotemFormDialog({
  open,
  onOpenChange,
  onSuccess,
  totem,
}: TotemFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [points, setPoints] = useState<Ponto[]>([])
  const [extensions, setExtensions] = useState<TotemCallCenterExtension[]>([])
  const [isLoadingDependencies, setIsLoadingDependencies] = useState(false)
  const isEdit = !!totem

  const t = useTranslator("totens.form")
  const tTable = useTranslator("totens.table")
  const tDetails = useTranslator("totens.details")

  const numberMinMessage = t("validations.number_min")
  const pointRequiredMessage = t("validations.point_required")
  const pointEditableInfoMessage = t("descriptions.point_edit_locked")
  const loadDependenciesErrorMessage = t("notifications.load_dependencies_error")
  const createSuccessMessage = t("notifications.create_success")
  const updateSuccessMessage = t("notifications.update_success")
  const createErrorMessage = t("notifications.create_error")
  const updateErrorMessage = t("notifications.update_error")

  const formSchema = useMemo(
    () =>
      createTotemFormSchema(
        {
          numberMin: numberMinMessage,
          pointRequired: pointRequiredMessage,
          pointEditableInfo: pointEditableInfoMessage,
        },
        isEdit,
      ),
    [isEdit, numberMinMessage, pointEditableInfoMessage, pointRequiredMessage],
  )

  const form = useForm<TotemFormValues>({
    resolver: zodResolver(formSchema) as never,
    defaultValues: {
      numero: "",
      pontoId: NO_POINT_VALUE,
      status: "active",
      callCenterExtensionId: NO_EXTENSION_VALUE,
      pointEditableInfo: "",
    },
  })

  const currentPointLabel = useMemo(() => {
    if (!totem) return ""

    return [
      getTotemPointLabel(totem, tDetails("not_informed")),
      getTotemPointReference(totem, ""),
    ]
      .filter(Boolean)
      .join(" - ")
  }, [tDetails, totem])

  const extensionLabelMessages = useMemo(
    () => ({
      inactiveSuffix: t("options.extension_inactive"),
      assignedSuffix: t("options.extension_assigned_to", {
        numero: "{numero}",
      }),
    }),
    [t],
  )

  useEffect(() => {
    if (!open) return

    async function loadDependencies() {
      setIsLoadingDependencies(true)

      try {
        const [pointsData, extensionsData] = await Promise.all([
          pontoService.findAllNoPagination(),
          totemService.listCallCenterExtensions(),
        ])

        setPoints(pointsData)
        setExtensions(extensionsData)
      } catch (error) {
        toast.apiError(error, loadDependenciesErrorMessage)
        setPoints([])
        setExtensions([])
      } finally {
        setIsLoadingDependencies(false)
      }
    }

    loadDependencies()

    form.reset({
      numero: totem?.numero || "",
      pontoId:
        typeof totem?.pontoId === "number"
          ? String(totem.pontoId)
          : NO_POINT_VALUE,
      status: totem?.status === "inactive" ? "inactive" : "active",
      callCenterExtensionId:
        typeof totem?.callCenterExtension?.id === "number"
          ? String(totem.callCenterExtension.id)
          : NO_EXTENSION_VALUE,
      pointEditableInfo: currentPointLabel,
    })
  }, [currentPointLabel, form, loadDependenciesErrorMessage, open, totem])

  const onSubmit = async (values: TotemFormValues) => {
    setIsSubmitting(true)

    try {
      if (isEdit && totem) {
        await totemService.update(totem.id, {
          numero: values.numero.trim(),
          status: values.status,
          callCenterExtensionId:
            values.callCenterExtensionId === NO_EXTENSION_VALUE
              ? null
              : Number(values.callCenterExtensionId),
        })
        toast.success(updateSuccessMessage)
      } else {
        await totemService.create({
          numero: values.numero.trim(),
          pontoId:
            values.pontoId === NO_POINT_VALUE
              ? null
              : Number(values.pontoId),
          status: values.status,
          callCenterExtensionId:
            values.callCenterExtensionId === NO_EXTENSION_VALUE
              ? null
              : Number(values.callCenterExtensionId),
        })
        toast.success(createSuccessMessage)
      }

      await onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast.apiError(error, isEdit ? updateErrorMessage : createErrorMessage)
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
              name="numero"
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

            {isEdit ? (
              <FormItem>
                <FormLabel>{t("labels.point")}</FormLabel>
                <FormControl>
                  <Input
                    value={currentPointLabel || tDetails("not_informed")}
                    readOnly
                  />
                </FormControl>
                <FormDescription>
                  <span className="inline-flex items-start gap-2">
                    <Info className="mt-0.5 h-4 w-4 shrink-0" />
                    {t("descriptions.point_edit_locked")}
                  </span>
                </FormDescription>
              </FormItem>
            ) : (
              <FormField
                control={form.control}
                name="pontoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("labels.point")}</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isLoadingDependencies}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full cursor-pointer">
                          <SelectValue placeholder={t("placeholders.point")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NO_POINT_VALUE}>
                          {isLoadingDependencies
                            ? t("placeholders.loading")
                            : t("options.select_point")}
                        </SelectItem>
                        {points.map((point) => (
                          <SelectItem key={point.id} value={String(point.id)}>
                            {[
                              point.nome,
                              point.pontoDeReferencia || null,
                            ]
                              .filter(Boolean)
                              .join(" - ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="callCenterExtensionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("labels.extension")}</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isLoadingDependencies}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full cursor-pointer">
                        <SelectValue placeholder={t("placeholders.extension")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NO_EXTENSION_VALUE}>
                        {isLoadingDependencies
                          ? t("placeholders.loading")
                          : t("options.unassigned_extension")}
                      </SelectItem>
                      {extensions.map((extension) => (
                        <SelectItem
                          key={extension.id}
                          value={String(extension.id)}
                          disabled={isCallCenterExtensionDisabled(extension, totem?.id)}
                        >
                          {buildCallCenterExtensionLabel(extension, extensionLabelMessages)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>{t("descriptions.extension")}</FormDescription>
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
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full cursor-pointer">
                        <SelectValue placeholder={t("placeholders.status")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">{tTable("status_active")}</SelectItem>
                      <SelectItem value="inactive">{tTable("status_inactive")}</SelectItem>
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
                onClick={() => onOpenChange(false)}
                className="cursor-pointer"
                disabled={isSubmitting}
              >
                {t("buttons.cancel")}
              </Button>
              <Button type="submit" className="cursor-pointer" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isSubmitting
                  ? t("buttons.saving")
                  : isEdit
                    ? t("buttons.save")
                    : t("buttons.create")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
