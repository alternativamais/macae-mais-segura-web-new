"use client"

import { useEffect, useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, RefreshCcw } from "lucide-react"
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTranslator } from "@/lib/i18n"
import { pontoService } from "@/services/ponto.service"
import { smartSwitchService } from "@/services/smart-switch.service"
import { totemService } from "@/services/totem.service"
import { Ponto } from "@/types/ponto"
import {
  HomeAssistantSwitchEntity,
  SmartSwitch,
  SmartSwitchDestination,
} from "@/types/smart-switch"
import { Totem } from "@/types/totem"
import {
  buildHomeAssistantEntityLabel,
  getPointDisplayName,
  getSmartSwitchDestination,
  getSmartSwitchPointLabel,
  truncateWithEllipsis,
} from "./utils"

interface SmartSwitchFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void | Promise<void>
  item?: SmartSwitch | null
}

const NO_TOTEM_VALUE = "__none_totem__"
const NO_POINT_VALUE = "__none_point__"

function createFormSchema(messages: {
  entityRequired: string
  totemRequired: string
  pointRequired: string
}) {
  return z
    .object({
      nome: z.string().trim().optional(),
      homeAssistantEntityId: z.string().trim().min(1, messages.entityRequired),
      destino: z.enum(["totem", "ponto"]),
      totemId: z.string(),
      pontoId: z.string(),
      status: z.enum(["active", "inactive"]),
    })
    .superRefine((values, context) => {
      if (values.destino === "totem" && values.totemId === NO_TOTEM_VALUE) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["totemId"],
          message: messages.totemRequired,
        })
      }

      if (values.destino === "ponto" && values.pontoId === NO_POINT_VALUE) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["pontoId"],
          message: messages.pointRequired,
        })
      }
    })
}

type SmartSwitchFormValues = z.infer<ReturnType<typeof createFormSchema>>

function buildTotemOptionLabel(totem: Totem, fallback: string) {
  const pointLabel = getPointDisplayName(totem.ponto, fallback)
  return `${totem.numero} - ${pointLabel}`
}

function buildPointOptionLabel(point: Ponto, fallback: string) {
  return getPointDisplayName(point, fallback)
}

export function SmartSwitchFormDialog({
  open,
  onOpenChange,
  onSuccess,
  item,
}: SmartSwitchFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingDependencies, setIsLoadingDependencies] = useState(false)
  const [isRefreshingEntities, setIsRefreshingEntities] = useState(false)
  const [totens, setTotens] = useState<Totem[]>([])
  const [points, setPoints] = useState<Ponto[]>([])
  const [entities, setEntities] = useState<HomeAssistantSwitchEntity[]>([])
  const isEdit = !!item

  const t = useTranslator("smart_switches.form")
  const tTable = useTranslator("smart_switches.table")
  const tShared = useTranslator("smart_switches.shared")

  const schema = useMemo(
    () =>
      createFormSchema({
        entityRequired: t("validations.entity_required"),
        totemRequired: t("validations.totem_required"),
        pointRequired: t("validations.point_required"),
      }),
    [t],
  )

  const form = useForm<SmartSwitchFormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      nome: "",
      homeAssistantEntityId: "",
      destino: "totem",
      totemId: NO_TOTEM_VALUE,
      pontoId: NO_POINT_VALUE,
      status: "active",
    },
  })

  const destination = form.watch("destino")
  const selectedEntityId = form.watch("homeAssistantEntityId")
  const selectedTotemId = form.watch("totemId")
  const selectedPointId = form.watch("pontoId")

  const notInformed = tShared("not_informed")

  const totemsById = useMemo(
    () => new Map(totens.map((totem) => [totem.id, totem])),
    [totens],
  )

  const pointsById = useMemo(
    () => new Map(points.map((point) => [point.id, point])),
    [points],
  )

  const selectedTotem =
    selectedTotemId !== NO_TOTEM_VALUE ? totemsById.get(Number(selectedTotemId)) : null
  const selectedPoint =
    selectedPointId !== NO_POINT_VALUE ? pointsById.get(Number(selectedPointId)) : null

  const selectedEntityLabel = useMemo(() => {
    const entity = entities.find((entry) => entry.entityId === selectedEntityId)

    if (!entity) {
      return undefined
    }

    return buildHomeAssistantEntityLabel(entity, {
      friendlyNameFallback: t("options.entity_without_name"),
    })
  }, [entities, selectedEntityId, t])

  const selectedTotemLabel = selectedTotem
    ? buildTotemOptionLabel(selectedTotem, notInformed)
    : undefined
  const selectedPointLabel = selectedPoint
    ? buildPointOptionLabel(selectedPoint, notInformed)
    : undefined

  const loadDependenciesErrorMessage = t("notifications.load_dependencies_error")
  const createSuccessMessage = t("notifications.create_success")
  const updateSuccessMessage = t("notifications.update_success")
  const createErrorMessage = t("notifications.create_error")
  const updateErrorMessage = t("notifications.update_error")
  const refreshEntitiesErrorMessage = t("notifications.refresh_entities_error")

  async function loadEntities(currentId?: number, currentItem?: SmartSwitch | null) {
    const data = await smartSwitchService.listAssignableHomeAssistantEntities(currentId)
    const currentEntityId = currentItem?.homeAssistantEntityId?.trim()

    if (
      currentEntityId &&
      !data.some((entity) => entity.entityId === currentEntityId)
    ) {
      return [
        ...data,
        {
          entityId: currentEntityId,
          friendlyName: currentItem?.nome || undefined,
        },
      ]
    }

    return data
  }

  useEffect(() => {
    if (!open) return

    async function loadDependencies() {
      setIsLoadingDependencies(true)

      try {
        const [totensData, pointsData, entitiesData] = await Promise.all([
          totemService.findAllNoPagination(),
          pontoService.findAllNoPagination(),
          loadEntities(item?.id, item),
        ])

        setTotens(totensData)
        setPoints(pointsData)
        setEntities(entitiesData)
      } catch (error) {
        toast.apiError(error, loadDependenciesErrorMessage)
        setTotens([])
        setPoints([])
        setEntities([])
      } finally {
        setIsLoadingDependencies(false)
      }
    }

    const destinationValue: SmartSwitchDestination = item
      ? getSmartSwitchDestination(item)
      : "totem"

    loadDependencies()

    form.reset({
      nome: item?.nome || "",
      homeAssistantEntityId: item?.homeAssistantEntityId || "",
      destino: destinationValue,
      totemId:
        destinationValue === "totem" && typeof item?.totemId === "number"
          ? String(item.totemId)
          : NO_TOTEM_VALUE,
      pontoId:
        destinationValue === "ponto" && typeof item?.pontoId === "number"
          ? String(item.pontoId)
          : NO_POINT_VALUE,
      status: item?.status === "inactive" ? "inactive" : "active",
    })
  }, [form, item, loadDependenciesErrorMessage, open])

  const handleRefreshEntities = async () => {
    setIsRefreshingEntities(true)

    try {
      const data = await loadEntities(item?.id, item)
      setEntities(data)
    } catch (error) {
      toast.apiError(error, refreshEntitiesErrorMessage)
    } finally {
      setIsRefreshingEntities(false)
    }
  }

  const handleEntityChange = (value: string, onChange: (value: string) => void) => {
    onChange(value)

    const entity = entities.find((entry) => entry.entityId === value)
    const currentName = form.getValues("nome")?.trim()

    if (!currentName && entity?.friendlyName) {
      form.setValue("nome", entity.friendlyName, {
        shouldDirty: true,
      })
    }
  }

  const handleDestinationChange = (value: SmartSwitchDestination) => {
    form.setValue("destino", value, { shouldDirty: true, shouldValidate: true })

    if (value === "totem") {
      form.setValue("pontoId", NO_POINT_VALUE, { shouldDirty: true, shouldValidate: true })
      form.clearErrors("pontoId")
      return
    }

    form.setValue("totemId", NO_TOTEM_VALUE, { shouldDirty: true, shouldValidate: true })
    form.clearErrors("totemId")
  }

  const onSubmit = async (values: SmartSwitchFormValues) => {
    setIsSubmitting(true)

    try {
      const payload = {
        homeAssistantEntityId: values.homeAssistantEntityId.trim(),
        status: values.status,
        nome: values.nome?.trim() || undefined,
        totemId:
          values.destino === "totem" ? Number(values.totemId) : null,
        pontoId:
          values.destino === "ponto" ? Number(values.pontoId) : null,
      }

      if (isEdit && item) {
        await smartSwitchService.update(item.id, payload)
        toast.success(updateSuccessMessage)
      } else {
        await smartSwitchService.create(payload)
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
              name="homeAssistantEntityId"
              render={({ field }) => (
                <FormItem className="min-w-0">
                  <FormLabel>{t("labels.entity_id")}</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => handleEntityChange(value, field.onChange)}
                    disabled={isLoadingDependencies}
                  >
                    <FormControl>
                      <SelectTrigger
                        className="w-full cursor-pointer"
                        title={selectedEntityLabel}
                      >
                        <SelectValue placeholder={t("placeholders.entity_id")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {entities.map((entity) => {
                        const fullLabel = buildHomeAssistantEntityLabel(entity, {
                          friendlyNameFallback: t("options.entity_without_name"),
                        })

                        return (
                          <SelectItem key={entity.entityId} value={entity.entityId}>
                            <span title={fullLabel}>
                              {truncateWithEllipsis(fullLabel, 40)}
                            </span>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="cursor-pointer"
                      onClick={handleRefreshEntities}
                      disabled={isRefreshingEntities || isLoadingDependencies}
                    >
                      {isRefreshingEntities ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCcw className="mr-2 h-4 w-4" />
                      )}
                      {t("actions.refresh_entities")}
                    </Button>
                  </div>
                  <FormDescription>{t("descriptions.entity_id")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem className="min-w-0">
                  <FormLabel>{t("labels.name")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("placeholders.name")}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription>{t("descriptions.name")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="destino"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("labels.destination")}</FormLabel>
                  <FormControl>
                    <RadioGroup
                      className="grid gap-3 sm:grid-cols-2"
                      value={field.value}
                      onValueChange={(value) =>
                        handleDestinationChange(value as SmartSwitchDestination)
                      }
                    >
                      <label className="border-input hover:bg-accent/40 flex cursor-pointer items-center gap-3 rounded-md border px-3 py-3 text-sm">
                        <RadioGroupItem value="totem" />
                        <div className="space-y-1">
                          <div className="font-medium">{t("options.install_in_totem")}</div>
                          <div className="text-xs text-muted-foreground">
                            {t("descriptions.destination_totem")}
                          </div>
                        </div>
                      </label>
                      <label className="border-input hover:bg-accent/40 flex cursor-pointer items-center gap-3 rounded-md border px-3 py-3 text-sm">
                        <RadioGroupItem value="ponto" />
                        <div className="space-y-1">
                          <div className="font-medium">{t("options.install_in_point")}</div>
                          <div className="text-xs text-muted-foreground">
                            {t("descriptions.destination_point")}
                          </div>
                        </div>
                      </label>
                    </RadioGroup>
                  </FormControl>
                  <FormDescription>{t("descriptions.destination")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {destination === "totem" ? (
              <FormField
                control={form.control}
                name="totemId"
                render={({ field }) => (
                  <FormItem className="min-w-0">
                    <FormLabel>{t("labels.totem")}</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isLoadingDependencies}
                    >
                      <FormControl>
                        <SelectTrigger
                          className="w-full cursor-pointer"
                          title={selectedTotemLabel}
                        >
                          <SelectValue placeholder={t("placeholders.totem")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NO_TOTEM_VALUE}>
                          {isLoadingDependencies
                            ? t("placeholders.loading")
                            : t("options.select_totem")}
                        </SelectItem>
                        {totens.map((totem) => {
                          const fullLabel = buildTotemOptionLabel(totem, notInformed)

                          return (
                            <SelectItem key={totem.id} value={String(totem.id)}>
                              <span title={fullLabel}>
                                {truncateWithEllipsis(fullLabel, 40)}
                              </span>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    <FormDescription>{t("descriptions.totem")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="pontoId"
                render={({ field }) => (
                  <FormItem className="min-w-0">
                    <FormLabel>{t("labels.point")}</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isLoadingDependencies}
                    >
                      <FormControl>
                        <SelectTrigger
                          className="w-full cursor-pointer"
                          title={selectedPointLabel}
                        >
                          <SelectValue placeholder={t("placeholders.point")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NO_POINT_VALUE}>
                          {isLoadingDependencies
                            ? t("placeholders.loading")
                            : t("options.select_point")}
                        </SelectItem>
                        {points.map((point) => {
                          const fullLabel = buildPointOptionLabel(point, notInformed)

                          return (
                            <SelectItem key={point.id} value={String(point.id)}>
                              <span title={fullLabel}>
                                {truncateWithEllipsis(fullLabel, 40)}
                              </span>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    <FormDescription>{t("descriptions.point")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {destination === "totem" && selectedTotem ? (
              <div className="rounded-md border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                {t("selected_point", {
                  point: getSmartSwitchPointLabel(
                    { totemId: selectedTotem.id, totem: selectedTotem } as SmartSwitch,
                    totemsById,
                    notInformed,
                  ),
                })}
              </div>
            ) : null}

            {destination === "ponto" && selectedPoint ? (
              <div className="rounded-md border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                {t("selected_direct_point", {
                  point: getPointDisplayName(selectedPoint, notInformed),
                })}
              </div>
            ) : null}

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="min-w-0">
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
