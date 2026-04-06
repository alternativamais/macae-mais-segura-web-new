"use client"

import { useEffect, useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, MapPinned } from "lucide-react"
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
import { Empresa } from "@/types/empresa"
import { Ponto } from "@/types/ponto"
import { pontoService } from "@/services/ponto.service"
import {
  formatPointCoordinates,
  parsePointCoordinates,
} from "./utils"
import { PointMapPickerDialog } from "./point-map-picker-dialog"

interface PointFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void | Promise<void>
  point?: Ponto | null
  companies: Empresa[]
}

const NO_COMPANY_VALUE = "__none__"
const COORDINATES_REGEX =
  /^\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*$/

function createPointFormSchema(messages: {
  nameMin: string
  coordinatesInvalid: string
}) {
  return z.object({
    nome: z.string().trim().min(2, messages.nameMin),
    pontoDeReferencia: z.string().trim().optional(),
    coordenadas: z
      .string()
      .trim()
      .optional()
      .refine(
        (value) => !value || COORDINATES_REGEX.test(value),
        messages.coordinatesInvalid,
      ),
    status: z.enum(["active", "inactive"]),
    empresaId: z.string(),
  })
}

type PointFormValues = z.infer<ReturnType<typeof createPointFormSchema>>

export function PointFormDialog({
  open,
  onOpenChange,
  onSuccess,
  point,
  companies,
}: PointFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false)
  const isEdit = !!point

  const t = useTranslator("points.form")
  const tTable = useTranslator("points.table")

  const pointFormSchema = useMemo(
    () =>
      createPointFormSchema({
        nameMin: t("validations.name_min"),
        coordinatesInvalid: t("validations.coordinates_invalid"),
      }),
    [t],
  )

  const form = useForm<PointFormValues>({
    resolver: zodResolver(pointFormSchema) as never,
    defaultValues: {
      nome: "",
      pontoDeReferencia: "",
      coordenadas: "",
      status: "active",
      empresaId: NO_COMPANY_VALUE,
    },
  })

  const currentCoordinates = form.watch("coordenadas")
  const parsedCoordinates = useMemo(
    () => parsePointCoordinates(currentCoordinates),
    [currentCoordinates],
  )

  useEffect(() => {
    if (!open) return

    form.reset({
      nome: point?.nome || "",
      pontoDeReferencia: point?.pontoDeReferencia || "",
      coordenadas: point?.coordenadas || "",
      status: point?.status === "inactive" ? "inactive" : "active",
      empresaId:
        typeof point?.empresaId === "number"
          ? String(point.empresaId)
          : NO_COMPANY_VALUE,
    })
  }, [form, open, point])

  const onSubmit = async (values: PointFormValues) => {
    setIsSubmitting(true)

    try {
      const payload = {
        nome: values.nome.trim(),
        pontoDeReferencia: values.pontoDeReferencia?.trim() || null,
        coordenadas: values.coordenadas?.trim() || null,
        status: values.status,
        empresaId:
          values.empresaId === NO_COMPANY_VALUE ? null : Number(values.empresaId),
      }

      if (isEdit && point) {
        await pontoService.update(point.id, payload)
        toast.success(t("notifications.update_success"))
      } else {
        await pontoService.create(payload)
        toast.success(t("notifications.create_success"))
      }

      await onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast.apiError(
        error,
        isEdit ? t("notifications.update_error") : t("notifications.create_error"),
      )
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
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("labels.name")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("placeholders.name")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pontoDeReferencia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("labels.reference")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("placeholders.reference")} {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="coordenadas"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between gap-3">
                    <FormLabel>{t("labels.coordinates")}</FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="cursor-pointer"
                      onClick={() => setIsMapPickerOpen(true)}
                    >
                      <MapPinned className="mr-2 h-4 w-4" />
                      {parsedCoordinates
                        ? t("actions.adjust_on_map")
                        : t("actions.select_on_map")}
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <FormControl>
                      <Input placeholder={t("placeholders.coordinates")} {...field} value={field.value ?? ""} />
                    </FormControl>
                    <div className="rounded-md border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                      {parsedCoordinates
                        ? t("selected_coordinates", {
                            coordinates: formatPointCoordinates(parsedCoordinates),
                          })
                        : t("map_picker.no_selection")}
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
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

              <FormField
                control={form.control}
                name="empresaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("labels.company")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full cursor-pointer">
                          <SelectValue placeholder={t("placeholders.company")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NO_COMPANY_VALUE}>
                          {t("options.system_default")}
                        </SelectItem>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={String(company.id)}>
                            {company.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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

        <PointMapPickerDialog
          open={isMapPickerOpen}
          onOpenChange={setIsMapPickerOpen}
          initialCoordinates={parsedCoordinates}
          onConfirm={(coordinates) => {
            form.setValue("coordenadas", coordinates, {
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
