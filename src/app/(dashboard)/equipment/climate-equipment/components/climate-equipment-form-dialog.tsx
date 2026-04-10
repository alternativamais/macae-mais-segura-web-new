"use client"

import { useEffect, useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, RefreshCcw } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { Button } from "@/components/ui/button"
import { TenantCompanyFormField } from "@/components/shared/tenant-company-form-field"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
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
import { Textarea } from "@/components/ui/textarea"
import { useTenantCompanySelection } from "@/hooks/use-tenant-company-selection"
import { useTranslator } from "@/lib/i18n"
import { climateEquipmentService } from "@/services/climate-equipment.service"
import { pontoService } from "@/services/ponto.service"
import { totemService } from "@/services/totem.service"
import {
  ClimateEquipment,
  ClimateEquipmentDestination,
  HomeAssistantClimateDeviceOption,
} from "@/types/climate-equipment"
import { Ponto } from "@/types/ponto"
import { Totem } from "@/types/totem"
import {
  buildClimateEquipmentPayload,
  buildClimatePointOptionLabel,
  buildClimateTotemOptionLabel,
  getClimateEquipmentDestination,
} from "./utils"

interface ClimateEquipmentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void | Promise<void>
  item?: ClimateEquipment | null
}

const NO_POINT_VALUE = "__none_point__"
const NO_TOTEM_VALUE = "__none_totem__"

function createFormSchema(messages: {
  nameRequired: string
  deviceRequired: string
  companyRequired: string
}, requireCompanySelection: boolean) {
  return z
    .object({
      nome: z.string().trim().min(1, messages.nameRequired),
      homeAssistantDeviceKey: z.string().trim().min(1, messages.deviceRequired),
      homeAssistantLabel: z.string().optional(),
      descricao: z.string().optional(),
      destino: z.enum(["totem", "ponto"]),
      pontoId: z.string().optional(),
      totemId: z.string().optional(),
      status: z.enum(["active", "inactive"]),
      empresaId: z.string().optional(),
    })
    .superRefine((data, context) => {
      if (requireCompanySelection && !data.empresaId) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["empresaId"],
          message: messages.companyRequired,
        })
      }
    })
}

type ClimateEquipmentFormValues = z.infer<ReturnType<typeof createFormSchema>>

const SECTION_BY_FIELD: Partial<Record<keyof ClimateEquipmentFormValues, string>> = {
  nome: "identification",
  homeAssistantLabel: "identification",
  descricao: "identification",
  homeAssistantDeviceKey: "integration",
  destino: "location",
  pontoId: "location",
  totemId: "location",
  status: "system",
}

export function ClimateEquipmentFormDialog({
  open,
  onOpenChange,
  onSuccess,
  item,
}: ClimateEquipmentFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingDependencies, setIsLoadingDependencies] = useState(false)
  const [isRefreshingDevices, setIsRefreshingDevices] = useState(false)
  const [points, setPoints] = useState<Ponto[]>([])
  const [totens, setTotens] = useState<Totem[]>([])
  const [devices, setDevices] = useState<HomeAssistantClimateDeviceOption[]>([])
  const [openSection, setOpenSection] = useState("identification")
  const isEdit = !!item
  const { companies, showCompanySelector, defaultCompanyId } =
    useTenantCompanySelection()

  const t = useTranslator("climate_equipment.form")
  const tShared = useTranslator("climate_equipment.shared")
  const tCompany = useTranslator("company_field")

  const schema = useMemo(
    () =>
      createFormSchema(
        {
          nameRequired: t("validations.name_required"),
          deviceRequired: t("validations.device_required"),
          companyRequired: tCompany("required"),
        },
        showCompanySelector && !isEdit,
      ),
    [isEdit, showCompanySelector, t, tCompany],
  )

  const form = useForm<ClimateEquipmentFormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      nome: "",
      homeAssistantDeviceKey: "",
      homeAssistantLabel: "",
      descricao: "",
      destino: "totem",
      pontoId: NO_POINT_VALUE,
      totemId: NO_TOTEM_VALUE,
      status: "active",
      empresaId: defaultCompanyId ? String(defaultCompanyId) : "",
    },
  })

  const destination = form.watch("destino")
  const rawCompanyId = form.watch("empresaId")
  const selectedCompanyId =
    rawCompanyId && rawCompanyId.trim()
      ? Number(rawCompanyId)
      : defaultCompanyId ?? null

  const ensureDeviceOptions = useMemo(() => {
    if (!item) {
      return devices
    }

    const exists = devices.some((device) => device.deviceKey === item.homeAssistantDeviceKey)
    if (exists) {
      return devices
    }

    return [
      ...devices,
      {
        deviceKey: item.homeAssistantDeviceKey,
        friendlyName:
          item.homeAssistantLabel || item.nome || item.homeAssistantDeviceKey,
        linkedEquipmentId: item.id,
        available: true,
        sensors: item.sensors || [],
      },
    ]
  }, [devices, item])

  const selectedDevice = ensureDeviceOptions.find(
    (device) => device.deviceKey === form.watch("homeAssistantDeviceKey"),
  )

  const loadDependenciesErrorMessage = t("notifications.load_dependencies_error")

  const loadDevices = async (empresaId?: number | null) => {
    setIsRefreshingDevices(true)

    try {
      const data = await climateEquipmentService.listHomeAssistantDevices(
        empresaId ?? undefined,
      )
      setDevices(data)
    } catch (error) {
      toast.apiError(error, t("notifications.load_devices_error"))
      setDevices([])
    } finally {
      setIsRefreshingDevices(false)
    }
  }

  useEffect(() => {
    if (!open) return

    if (showCompanySelector && !selectedCompanyId) {
      setPoints([])
      setTotens([])
      setDevices([])
      return
    }

    async function loadDependencies() {
      setIsLoadingDependencies(true)

      try {
        const params = selectedCompanyId ? { empresaId: selectedCompanyId } : undefined
        const [pointsData, totemsData, devicesData] = await Promise.all([
          pontoService.findAllNoPagination(params),
          totemService.findAllNoPagination(params),
          climateEquipmentService.listHomeAssistantDevices(selectedCompanyId ?? undefined),
        ])

        setPoints(pointsData)
        setTotens(totemsData)
        setDevices(devicesData)
      } catch (error) {
        toast.apiError(error, loadDependenciesErrorMessage)
        setPoints([])
        setTotens([])
        setDevices([])
      } finally {
        setIsLoadingDependencies(false)
      }
    }

    void loadDependencies()
  }, [
    loadDependenciesErrorMessage,
    open,
    selectedCompanyId,
    showCompanySelector,
  ])

  useEffect(() => {
    if (!open) return

    setOpenSection("identification")

    const destinationValue: ClimateEquipmentDestination = item
      ? getClimateEquipmentDestination(item)
      : "totem"

    form.reset({
      nome: item?.nome || "",
      homeAssistantDeviceKey: item?.homeAssistantDeviceKey || "",
      homeAssistantLabel: item?.homeAssistantLabel || "",
      descricao: item?.descricao || "",
      destino: destinationValue,
      pontoId:
        destinationValue === "ponto" && typeof item?.pontoId === "number"
          ? String(item.pontoId)
          : NO_POINT_VALUE,
      totemId:
        destinationValue === "totem" && typeof item?.totem?.id === "number"
          ? String(item.totem.id)
          : NO_TOTEM_VALUE,
      status: item?.status === "inactive" ? "inactive" : "active",
      empresaId:
        typeof item?.empresaId === "number"
          ? String(item.empresaId)
          : defaultCompanyId
            ? String(defaultCompanyId)
            : "",
    })
  }, [defaultCompanyId, form, item, open])

  const handleDestinationChange = (value: ClimateEquipmentDestination) => {
    form.setValue("destino", value, { shouldDirty: true, shouldValidate: true })

    if (value === "ponto") {
      form.setValue("totemId", NO_TOTEM_VALUE, { shouldDirty: true })
      return
    }

    form.setValue("pontoId", NO_POINT_VALUE, { shouldDirty: true })
  }

  const handleDeviceChange = (value: string) => {
    const selected = ensureDeviceOptions.find((device) => device.deviceKey === value)

    form.setValue("homeAssistantDeviceKey", value, {
      shouldDirty: true,
      shouldValidate: true,
    })

    if (!form.getValues("nome")?.trim()) {
      form.setValue("nome", selected?.friendlyName || value, { shouldDirty: true })
    }

    if (!form.getValues("homeAssistantLabel")?.trim()) {
      form.setValue("homeAssistantLabel", selected?.friendlyName || "", {
        shouldDirty: true,
      })
    }
  }

  const handleInvalidSubmit = (errors: Partial<Record<keyof ClimateEquipmentFormValues, unknown>>) => {
    const firstField = Object.keys(errors)[0] as keyof ClimateEquipmentFormValues | undefined
    if (!firstField) return

    const section = SECTION_BY_FIELD[firstField]
    if (section) {
      setOpenSection(section)
    }
  }

  const onSubmit = async (values: ClimateEquipmentFormValues) => {
    setIsSubmitting(true)

    try {
      const payload = buildClimateEquipmentPayload(values)

      if (item) {
        const { empresaId: _empresaId, ...updatePayload } = payload
        await climateEquipmentService.update(item.id, updatePayload)
        toast.success(t("notifications.update_success"))
      } else {
        await climateEquipmentService.create(payload)
        toast.success(t("notifications.create_success"))
      }

      await onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast.apiError(
        error,
        item ? t("notifications.update_error") : t("notifications.create_error"),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("title_edit") : t("title_create")}</DialogTitle>
          <DialogDescription>
            {isEdit ? t("description_edit") : t("description_create")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, handleInvalidSubmit)}
            className="space-y-6"
          >
            {showCompanySelector || (isEdit && item?.empresaId) ? (
              <TenantCompanyFormField
                control={form.control}
                companies={companies}
                disabled={isEdit}
                description={
                  isEdit ? tCompany("edit_locked") : tCompany("select_first")
                }
              />
            ) : null}

            <Accordion
              type="single"
              collapsible
              value={openSection}
              onValueChange={(value) => setOpenSection(value || "identification")}
              className="rounded-md border bg-card"
            >
              <AccordionItem value="identification" className="px-4">
                <AccordionTrigger className="cursor-pointer py-4 hover:no-underline">
                  <div className="space-y-1 text-left">
                    <div>{t("sections.identification")}</div>
                    <div className="text-xs font-normal text-muted-foreground">
                      {t("sections.identification_desc")}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  <div className="space-y-4 pb-4">
                    <div className="grid items-start gap-4 md:grid-cols-2">
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
                        name="homeAssistantLabel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("labels.home_assistant_label")}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t("placeholders.home_assistant_label")}
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="descricao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("labels.description")}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("placeholders.description")}
                              rows={3}
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="integration" className="px-4">
                <AccordionTrigger className="cursor-pointer py-4 hover:no-underline">
                  <div className="space-y-1 text-left">
                    <div>{t("sections.integration")}</div>
                    <div className="text-xs font-normal text-muted-foreground">
                      {t("sections.integration_desc")}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  <div className="space-y-4 pb-4">
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void loadDevices(selectedCompanyId)}
                        disabled={
                          isRefreshingDevices ||
                          (showCompanySelector && !selectedCompanyId)
                        }
                        className="cursor-pointer"
                      >
                        {isRefreshingDevices ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCcw className="mr-2 h-4 w-4" />
                        )}
                        {t("buttons.refresh_devices")}
                      </Button>
                    </div>

                    <FormField
                      control={form.control}
                      name="homeAssistantDeviceKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("labels.home_assistant_device_key")}</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={handleDeviceChange}
                            disabled={
                              isLoadingDependencies ||
                              isRefreshingDevices ||
                              (showCompanySelector && !selectedCompanyId)
                            }
                          >
                            <FormControl>
                              <SelectTrigger className="w-full cursor-pointer">
                                <SelectValue placeholder={t("placeholders.home_assistant_device_key")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {ensureDeviceOptions.map((device) => {
                                const isDisabled =
                                  !device.available && device.linkedEquipmentId !== item?.id

                                return (
                                  <SelectItem
                                    key={device.deviceKey}
                                    value={device.deviceKey}
                                    disabled={isDisabled}
                                  >
                                    {device.friendlyName || device.deviceKey}
                                    {device.friendlyName ? ` (${device.deviceKey})` : ""}
                                    {isDisabled ? ` - ${t("options.in_use")}` : ""}
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            {t("descriptions.home_assistant_device_key")}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {selectedDevice?.sensors?.length ? (
                      <div className="rounded-lg border bg-muted/20 p-4">
                        <p className="mb-3 text-sm font-medium">{t("labels.detected_sensors")}</p>
                        <div className="grid gap-2">
                          {selectedDevice.sensors.map((sensor) => (
                            <div
                              key={`${sensor.entityId}-${sensor.type}`}
                              className="flex flex-col gap-1 rounded-md border bg-background px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <span className="text-sm font-medium">{sensor.label}</span>
                              <span className="font-mono text-xs text-muted-foreground">
                                {sensor.entityId}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="location" className="px-4">
                <AccordionTrigger className="cursor-pointer py-4 hover:no-underline">
                  <div className="space-y-1 text-left">
                    <div>{t("sections.location")}</div>
                    <div className="text-xs font-normal text-muted-foreground">
                      {t("sections.location_desc")}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  <div className="space-y-4 pb-4">
                    <FormField
                      control={form.control}
                      name="destino"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>{t("labels.destination")}</FormLabel>
                          <FormControl>
                            <RadioGroup
                              value={field.value}
                              onValueChange={(value) =>
                                handleDestinationChange(value as ClimateEquipmentDestination)
                              }
                              className="flex flex-col gap-3 sm:flex-row"
                            >
                              <div className="flex items-center gap-3 rounded-lg border px-4 py-3">
                                <RadioGroupItem value="totem" id="climate-destination-totem" />
                                <label
                                  htmlFor="climate-destination-totem"
                                  className="cursor-pointer text-sm font-medium"
                                >
                                  {t("options.install_in_totem")}
                                </label>
                              </div>
                              <div className="flex items-center gap-3 rounded-lg border px-4 py-3">
                                <RadioGroupItem value="ponto" id="climate-destination-point" />
                                <label
                                  htmlFor="climate-destination-point"
                                  className="cursor-pointer text-sm font-medium"
                                >
                                  {t("options.install_in_point")}
                                </label>
                              </div>
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
                          <FormItem>
                            <FormLabel>{t("labels.totem")}</FormLabel>
                            <Select
                              value={field.value || NO_TOTEM_VALUE}
                              onValueChange={field.onChange}
                              disabled={
                                isLoadingDependencies ||
                                (showCompanySelector && !selectedCompanyId)
                              }
                            >
                              <FormControl>
                                <SelectTrigger className="w-full cursor-pointer">
                                  <SelectValue placeholder={t("placeholders.totem")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value={NO_TOTEM_VALUE}>
                                  {t("options.unassigned")}
                                </SelectItem>
                                {totens.map((totem) => (
                                  <SelectItem key={totem.id} value={String(totem.id)}>
                                    {buildClimateTotemOptionLabel(
                                      totem,
                                      tShared("not_informed"),
                                    )}
                                  </SelectItem>
                                ))}
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
                          <FormItem>
                            <FormLabel>{t("labels.point")}</FormLabel>
                            <Select
                              value={field.value || NO_POINT_VALUE}
                              onValueChange={field.onChange}
                              disabled={
                                isLoadingDependencies ||
                                (showCompanySelector && !selectedCompanyId)
                              }
                            >
                              <FormControl>
                                <SelectTrigger className="w-full cursor-pointer">
                                  <SelectValue placeholder={t("placeholders.point")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value={NO_POINT_VALUE}>
                                  {t("options.unassigned")}
                                </SelectItem>
                                {points.map((point) => (
                                  <SelectItem key={point.id} value={String(point.id)}>
                                    {buildClimatePointOptionLabel(
                                      point,
                                      tShared("not_informed"),
                                    )}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>{t("descriptions.point")}</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="system" className="px-4">
                <AccordionTrigger className="cursor-pointer py-4 hover:no-underline">
                  <div className="space-y-1 text-left">
                    <div>{t("sections.system")}</div>
                    <div className="text-xs font-normal text-muted-foreground">
                      {t("sections.system_desc")}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  <div className="space-y-4 pb-4">
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
                              <SelectItem value="active">{t("options.status_active")}</SelectItem>
                              <SelectItem value="inactive">
                                {t("options.status_inactive")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("buttons.cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("buttons.saving")}
                  </>
                ) : isEdit ? (
                  t("buttons.save")
                ) : (
                  t("buttons.create")
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
