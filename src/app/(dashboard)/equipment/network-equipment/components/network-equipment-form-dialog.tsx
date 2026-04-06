"use client"

import { useEffect, useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { Button } from "@/components/ui/button"
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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useTranslator } from "@/lib/i18n"
import { networkEquipmentService } from "@/services/network-equipment.service"
import { pontoService } from "@/services/ponto.service"
import { totemService } from "@/services/totem.service"
import {
  NetworkEquipment,
  NetworkEquipmentDestination,
  NetworkEquipmentType,
} from "@/types/network-equipment"
import { Ponto } from "@/types/ponto"
import { Totem } from "@/types/totem"
import {
  buildNetworkEquipmentPayload,
  buildPointOptionLabel,
  buildTotemOptionLabel,
  getNetworkEquipmentDestination,
} from "./utils"

interface NetworkEquipmentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void | Promise<void>
  item?: NetworkEquipment | null
}

const NO_POINT_VALUE = "__none_point__"
const NO_TOTEM_VALUE = "__none_totem__"

function createFormSchema(messages: {
  nameRequired: string
  ipRequired: string
}) {
  return z.object({
    nome: z.string().trim().min(1, messages.nameRequired),
    ip: z.string().trim().min(1, messages.ipRequired),
    status: z.enum(["active", "inactive"]),
    online: z.boolean(),
    destino: z.enum(["ponto", "totem"]),
    pontoId: z.string(),
    totemId: z.string(),
    tipoEquipamento: z.enum(["roteador", "onu", "radio", "switch"]),
    macAddress: z.string().optional(),
    usuarioGerencia: z.string().optional(),
    senhaGerencia: z.string().optional(),
    numeroPortas: z.string().optional(),
    ssid: z.string().optional(),
    senhaWifi: z.string().optional(),
    modoOnu: z.string().optional(),
    pppoeUser: z.string().optional(),
    pppoePass: z.string().optional(),
    modoRadio: z.string().optional(),
    frequencia: z.string().optional(),
    gerenciavel: z.boolean(),
    vlans: z.string().optional(),
  })
}

type NetworkEquipmentFormValues = z.infer<ReturnType<typeof createFormSchema>>

const SECTION_BY_FIELD: Partial<Record<keyof NetworkEquipmentFormValues, string>> = {
  nome: "identification",
  tipoEquipamento: "identification",
  status: "identification",
  ip: "network",
  macAddress: "network",
  usuarioGerencia: "network",
  senhaGerencia: "network",
  destino: "location",
  pontoId: "location",
  totemId: "location",
  numeroPortas: "specific",
  ssid: "specific",
  senhaWifi: "specific",
  modoOnu: "specific",
  pppoeUser: "specific",
  pppoePass: "specific",
  modoRadio: "specific",
  frequencia: "specific",
  gerenciavel: "specific",
  vlans: "specific",
  online: "system",
}

export function NetworkEquipmentFormDialog({
  open,
  onOpenChange,
  onSuccess,
  item,
}: NetworkEquipmentFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingDependencies, setIsLoadingDependencies] = useState(false)
  const [points, setPoints] = useState<Ponto[]>([])
  const [totens, setTotens] = useState<Totem[]>([])
  const [openSection, setOpenSection] = useState("identification")
  const isEdit = !!item

  const t = useTranslator("network_equipment.form")
  const tRoot = useTranslator("network_equipment")
  const tShared = useTranslator("network_equipment.shared")

  const schema = useMemo(
    () =>
      createFormSchema({
        nameRequired: t("validations.name_required"),
        ipRequired: t("validations.ip_required"),
      }),
    [t],
  )

  const form = useForm<NetworkEquipmentFormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      nome: "",
      ip: "",
      status: "active",
      online: false,
      destino: "ponto",
      pontoId: NO_POINT_VALUE,
      totemId: NO_TOTEM_VALUE,
      tipoEquipamento: "roteador",
      macAddress: "",
      usuarioGerencia: "",
      senhaGerencia: "",
      numeroPortas: "",
      ssid: "",
      senhaWifi: "",
      modoOnu: "bridge",
      pppoeUser: "",
      pppoePass: "",
      modoRadio: "ap",
      frequencia: "2.4GHz",
      gerenciavel: false,
      vlans: "",
    },
  })

  const destination = form.watch("destino")
  const equipmentType = form.watch("tipoEquipamento")
  const onuMode = form.watch("modoOnu")
  const isManagedSwitch = form.watch("gerenciavel")

  const loadDependenciesErrorMessage = t("notifications.load_dependencies_error")
  const createSuccessMessage = t("notifications.create_success")
  const updateSuccessMessage = t("notifications.update_success")
  const createErrorMessage = t("notifications.create_error")
  const updateErrorMessage = t("notifications.update_error")

  useEffect(() => {
    if (!open) return

    async function loadDependencies() {
      setIsLoadingDependencies(true)

      try {
        const [pointsData, totensData] = await Promise.all([
          pontoService.findAllNoPagination(),
          totemService.findAllNoPagination(),
        ])

        setPoints(pointsData)
        setTotens(totensData)
      } catch (error) {
        toast.apiError(error, loadDependenciesErrorMessage)
        setPoints([])
        setTotens([])
      } finally {
        setIsLoadingDependencies(false)
      }
    }

    loadDependencies()
    setOpenSection("identification")

    const destinationValue: NetworkEquipmentDestination = item
      ? getNetworkEquipmentDestination(item)
      : "ponto"

    form.reset({
      nome: item?.nome || "",
      ip: item?.ip || "",
      status: item?.status === "inactive" ? "inactive" : "active",
      online: !!item?.online,
      destino: destinationValue,
      pontoId:
        destinationValue === "ponto" && typeof item?.pontoId === "number"
          ? String(item.pontoId)
          : NO_POINT_VALUE,
      totemId:
        destinationValue === "totem" && typeof item?.totemId === "number"
          ? String(item.totemId)
          : NO_TOTEM_VALUE,
      tipoEquipamento:
        item?.tipoEquipamento === "onu" ||
        item?.tipoEquipamento === "radio" ||
        item?.tipoEquipamento === "switch"
          ? item.tipoEquipamento
          : "roteador",
      macAddress: item?.macAddress || "",
      usuarioGerencia: item?.usuarioGerencia || "",
      senhaGerencia: item?.senhaGerencia || "",
      numeroPortas:
        typeof item?.numeroPortas === "number" ? String(item.numeroPortas) : "",
      ssid: item?.ssid || "",
      senhaWifi: item?.senhaWifi || "",
      modoOnu: item?.modoOnu || "bridge",
      pppoeUser: item?.pppoeUser || "",
      pppoePass: item?.pppoePass || "",
      modoRadio: item?.modoRadio || "ap",
      frequencia: item?.frequencia || "2.4GHz",
      gerenciavel: !!item?.gerenciavel,
      vlans: item?.vlans || "",
    })
  }, [form, item, loadDependenciesErrorMessage, open])

  const handleDestinationChange = (value: NetworkEquipmentDestination) => {
    form.setValue("destino", value, { shouldDirty: true, shouldValidate: true })

    if (value === "ponto") {
      form.setValue("totemId", NO_TOTEM_VALUE, { shouldDirty: true })
      return
    }

    form.setValue("pontoId", NO_POINT_VALUE, { shouldDirty: true })
  }

  const onSubmit = async (values: NetworkEquipmentFormValues) => {
    setIsSubmitting(true)

    try {
      const payload = buildNetworkEquipmentPayload(values)

      if (isEdit && item) {
        await networkEquipmentService.update(item.id, payload)
        toast.success(updateSuccessMessage)
      } else {
        await networkEquipmentService.create(payload)
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

  const handleInvalidSubmit = (errors: Partial<Record<keyof NetworkEquipmentFormValues, unknown>>) => {
    const firstField = Object.keys(errors)[0] as keyof NetworkEquipmentFormValues | undefined

    if (!firstField) {
      return
    }

    const section = SECTION_BY_FIELD[firstField]

    if (section) {
      setOpenSection(section)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
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
            <Accordion
              type="single"
              collapsible
              value={openSection}
              onValueChange={(value) => setOpenSection(value || "")}
              className="rounded-md border bg-card"
            >
              <AccordionItem value="identification" className="px-4">
                <AccordionTrigger className="cursor-pointer py-4 hover:no-underline">
                  <div className="space-y-1">
                    <div>{t("sections.general")}</div>
                    <div className="text-xs font-normal text-muted-foreground">
                      {t("sections.general_desc")}
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
                        name="tipoEquipamento"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("labels.type")}</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger className="w-full cursor-pointer">
                                  <SelectValue placeholder={t("placeholders.type")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="roteador">{tRoot("types.router")}</SelectItem>
                                <SelectItem value="onu">{tRoot("types.onu")}</SelectItem>
                                <SelectItem value="radio">{tRoot("types.radio")}</SelectItem>
                                <SelectItem value="switch">{tRoot("types.switch")}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid items-start gap-4 md:grid-cols-2">
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
                                <SelectItem value="active">{tRoot("table.status_active")}</SelectItem>
                                <SelectItem value="inactive">{tRoot("table.status_inactive")}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="network" className="px-4">
                <AccordionTrigger className="cursor-pointer py-4 hover:no-underline">
                  <div className="space-y-1">
                    <div>{t("sections.network")}</div>
                    <div className="text-xs font-normal text-muted-foreground">
                      {t("sections.network_desc")}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  <div className="space-y-4 pb-4">
                    <div className="grid items-start gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="ip"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("labels.ip")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("placeholders.ip")} {...field} />
                            </FormControl>
                            <FormDescription>{t("descriptions.ip")}</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="macAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("labels.mac")}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t("placeholders.mac")}
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid items-start gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="usuarioGerencia"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("labels.management_user")}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t("placeholders.management_user")}
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="senhaGerencia"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("labels.management_password")}</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder={t("placeholders.management_password")}
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="location" className="px-4">
                <AccordionTrigger className="cursor-pointer py-4 hover:no-underline">
                  <div className="space-y-1">
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
                                handleDestinationChange(value as NetworkEquipmentDestination)
                              }
                              className="grid gap-3 md:grid-cols-2"
                            >
                              <div className="flex items-center gap-3 rounded-lg border p-4">
                                <RadioGroupItem value="ponto" id="network-destino-ponto" />
                                <label
                                  htmlFor="network-destino-ponto"
                                  className="cursor-pointer text-sm font-medium"
                                >
                                  {t("options.install_in_point")}
                                </label>
                              </div>
                              <div className="flex items-center gap-3 rounded-lg border p-4">
                                <RadioGroupItem value="totem" id="network-destino-totem" />
                                <label
                                  htmlFor="network-destino-totem"
                                  className="cursor-pointer text-sm font-medium"
                                >
                                  {t("options.install_in_totem")}
                                </label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormDescription>{t("descriptions.destination")}</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid items-start gap-4 md:grid-cols-2">
                      {destination === "ponto" ? (
                        <FormField
                          control={form.control}
                          name="pontoId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("labels.point")}</FormLabel>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger
                                    className="w-full cursor-pointer"
                                    disabled={isLoadingDependencies}
                                  >
                                    <SelectValue
                                      placeholder={
                                        isLoadingDependencies
                                          ? t("placeholders.loading")
                                          : t("placeholders.point")
                                      }
                                    />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value={NO_POINT_VALUE}>
                                    {t("options.none")}
                                  </SelectItem>
                                  {points.map((point) => (
                                    <SelectItem key={point.id} value={String(point.id)}>
                                      {buildPointOptionLabel(point, tShared("not_informed"))}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormDescription>{t("descriptions.point")}</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : (
                        <FormField
                          control={form.control}
                          name="totemId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("labels.totem")}</FormLabel>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger
                                    className="w-full cursor-pointer"
                                    disabled={isLoadingDependencies}
                                  >
                                    <SelectValue
                                      placeholder={
                                        isLoadingDependencies
                                          ? t("placeholders.loading")
                                          : t("placeholders.totem")
                                      }
                                    />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value={NO_TOTEM_VALUE}>
                                    {t("options.none")}
                                  </SelectItem>
                                  {totens.map((totem) => (
                                    <SelectItem key={totem.id} value={String(totem.id)}>
                                      {buildTotemOptionLabel(totem, tShared("not_informed"))}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormDescription>{t("descriptions.totem")}</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="specific" className="px-4">
                <AccordionTrigger className="cursor-pointer py-4 hover:no-underline">
                  <div className="space-y-1">
                    <div>{t("sections.specific")}</div>
                    <div className="text-xs font-normal text-muted-foreground">
                      {t("sections.specific_desc")}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  <div className="space-y-4 pb-4">
                    <div className="grid items-start gap-4 md:grid-cols-2">
                      {(equipmentType === "roteador" ||
                        equipmentType === "onu" ||
                        equipmentType === "switch") ? (
                        <FormField
                          control={form.control}
                          name="numeroPortas"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("labels.ports")}</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder={t("placeholders.ports")}
                                  {...field}
                                  value={field.value ?? ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : null}

                      {(equipmentType === "roteador" || equipmentType === "radio") ? (
                        <FormField
                          control={form.control}
                          name="ssid"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("labels.ssid")}</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder={t("placeholders.ssid")}
                                  {...field}
                                  value={field.value ?? ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : null}

                      {(equipmentType === "roteador" || equipmentType === "radio") ? (
                        <FormField
                          control={form.control}
                          name="senhaWifi"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("labels.wifi_password")}</FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder={t("placeholders.wifi_password")}
                                  {...field}
                                  value={field.value ?? ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : null}

                      {equipmentType === "onu" ? (
                        <FormField
                          control={form.control}
                          name="modoOnu"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("labels.onu_mode")}</FormLabel>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger className="w-full cursor-pointer">
                                    <SelectValue placeholder={t("placeholders.onu_mode")} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="bridge">{t("options.onu_bridge")}</SelectItem>
                                  <SelectItem value="roteada">{t("options.onu_routed")}</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : null}

                      {equipmentType === "onu" && onuMode === "roteada" ? (
                        <>
                          <FormField
                            control={form.control}
                            name="pppoeUser"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("labels.pppoe_user")}</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder={t("placeholders.pppoe_user")}
                                    {...field}
                                    value={field.value ?? ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="pppoePass"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("labels.pppoe_password")}</FormLabel>
                                <FormControl>
                                  <Input
                                    type="password"
                                    placeholder={t("placeholders.pppoe_password")}
                                    {...field}
                                    value={field.value ?? ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
                      ) : null}

                      {equipmentType === "radio" ? (
                        <>
                          <FormField
                            control={form.control}
                            name="modoRadio"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("labels.radio_mode")}</FormLabel>
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <FormControl>
                                    <SelectTrigger className="w-full cursor-pointer">
                                      <SelectValue placeholder={t("placeholders.radio_mode")} />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="ap">{t("options.radio_ap")}</SelectItem>
                                    <SelectItem value="station">{t("options.radio_station")}</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="frequencia"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("labels.frequency")}</FormLabel>
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <FormControl>
                                    <SelectTrigger className="w-full cursor-pointer">
                                      <SelectValue placeholder={t("placeholders.frequency")} />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="2.4GHz">{t("options.frequency_24")}</SelectItem>
                                    <SelectItem value="5GHz">{t("options.frequency_5")}</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
                      ) : null}
                    </div>

                    {equipmentType === "switch" ? (
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="gerenciavel"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-md border bg-card px-4 py-3">
                              <div className="space-y-1">
                                <FormLabel>{t("labels.managed")}</FormLabel>
                                <FormDescription>{t("descriptions.managed")}</FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        {isManagedSwitch ? (
                          <FormField
                            control={form.control}
                            name="vlans"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("labels.vlans")}</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder={t("placeholders.vlans")}
                                    {...field}
                                    value={field.value ?? ""}
                                  />
                                </FormControl>
                                <FormDescription>{t("descriptions.vlans")}</FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="system" className="px-4">
                <AccordionTrigger className="cursor-pointer py-4 hover:no-underline">
                  <div className="space-y-1">
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
                      name="online"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-md border bg-card px-4 py-3">
                          <div className="space-y-1">
                            <FormLabel>{t("labels.online")}</FormLabel>
                            <FormDescription>{t("descriptions.online")}</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="cursor-pointer"
              >
                {t("buttons.cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
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
