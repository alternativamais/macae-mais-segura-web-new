"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import { ChevronsUpDown, Loader2, RefreshCcw } from "lucide-react"
import { DataTag } from "@/components/shared/data-tag"
import { TenantCompanyFormField } from "@/components/shared/tenant-company-form-field"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useTenantCompanySelection } from "@/hooks/use-tenant-company-selection"
import { useTranslator } from "@/lib/i18n"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { cn } from "@/lib/utils"
import { dashboardWidgetService } from "@/services/dashboard-widget.service"
import { Camera } from "@/types/camera"
import { DashboardWidget, DashboardWidgetRuntime } from "@/types/dashboard-widget"
import { LprVehicleCountWidgetCard } from "@/app/(dashboard)/dashboard/components/lpr-vehicle-count-widget-card"

function createDashboardWidgetFormSchema(messages: {
  titleRequired: string
  companyRequired: string
}) {
  return z.object({
    empresaId: z.string().trim().min(1, messages.companyRequired),
    title: z.string().trim().min(2, messages.titleRequired),
    size: z.enum(["half", "full"]),
    position: z.number().int().min(0),
    enabled: z.boolean(),
    cameraIds: z.array(z.string()),
    period: z.enum(["today", "7d", "30d"]),
    granularity: z.enum(["hour", "day"]),
    chartType: z.enum(["bar", "line", "area"]),
    showTotal: z.boolean(),
  })
}

type DashboardWidgetFormValues = z.infer<
  ReturnType<typeof createDashboardWidgetFormSchema>
>

function CameraMultiSelectField({
  items,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyLabel,
  clearLabel,
  disabled,
}: {
  items: Array<{ id: string; label: string; description?: string | null }>
  value: string[]
  onChange: (nextValue: string[]) => void
  placeholder: string
  searchPlaceholder: string
  emptyLabel: string
  clearLabel: string
  disabled?: boolean
}) {
  const selectedItems = items.filter((item) => value.includes(item.id))
  const triggerLabel = (() => {
    if (!selectedItems.length) return placeholder
    if (selectedItems.length === 1) return selectedItems[0]?.label || placeholder
    return `${selectedItems[0]?.label || placeholder} +${selectedItems.length - 1}`
  })()

  const toggleItem = (itemId: string) => {
    if (value.includes(itemId)) {
      onChange(value.filter((current) => current !== itemId))
      return
    }

    onChange([...value, itemId])
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full cursor-pointer justify-between text-left font-normal",
            !selectedItems.length && "text-muted-foreground",
          )}
        >
          <span className="truncate">{triggerLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyLabel}</CommandEmpty>
            <CommandGroup>
              {items.map((item) => {
                const checked = value.includes(item.id)
                return (
                  <CommandItem
                    key={item.id}
                    value={`${item.label} ${item.description || ""}`}
                    onSelect={() => toggleItem(item.id)}
                    className="cursor-pointer items-start gap-2 py-3"
                  >
                    <Checkbox
                      checked={checked}
                      onClick={(event) => event.stopPropagation()}
                      onCheckedChange={() => toggleItem(item.id)}
                      className="mt-0.5"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{item.label}</p>
                      {item.description ? (
                        <p className="truncate text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      ) : null}
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {value.length ? (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => onChange([])}
                    className="cursor-pointer justify-center text-center"
                  >
                    {clearLabel}
                  </CommandItem>
                </CommandGroup>
              </>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function ToggleRow({
  label,
  checked,
  onCheckedChange,
  activeLabel,
  inactiveLabel,
  children,
}: {
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  activeLabel: string
  inactiveLabel: string
  children?: ReactNode
}) {
  return (
    <div className="rounded-md border bg-muted/20">
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <p className="text-sm font-medium">{label}</p>
        <div className="flex items-center gap-2">
          <DataTag tone={checked ? "success" : "neutral"}>
            {checked ? activeLabel : inactiveLabel}
          </DataTag>
          <Switch checked={checked} onCheckedChange={onCheckedChange} />
        </div>
      </div>
      {checked && children ? <div className="border-t px-4 py-4">{children}</div> : null}
    </div>
  )
}

interface DashboardWidgetFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void | Promise<void>
  widget?: DashboardWidget | null
  cameras: Camera[]
}

export function DashboardWidgetFormDialog({
  open,
  onOpenChange,
  onSuccess,
  widget,
  cameras,
}: DashboardWidgetFormDialogProps) {
  const t = useTranslator("dashboard_management.form")
  const tCompany = useTranslator("company_field")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [openSection, setOpenSection] = useState("setup")
  const [cameraFilterEnabled, setCameraFilterEnabled] = useState(false)
  const [previewWidget, setPreviewWidget] = useState<DashboardWidgetRuntime | null>(null)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const { companies, showCompanySelector, defaultCompanyId } =
    useTenantCompanySelection()

  const isEdit = !!widget
  const formSchema = useMemo(
    () =>
      createDashboardWidgetFormSchema({
        titleRequired: t("validations.title_required"),
        companyRequired: tCompany("required"),
      }),
    [t, tCompany],
  )

  const form = useForm<DashboardWidgetFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      empresaId: defaultCompanyId ? String(defaultCompanyId) : "",
      title: "",
      size: "half",
      position: 0,
      enabled: true,
      cameraIds: [],
      period: "7d",
      granularity: "day",
      chartType: "bar",
      showTotal: true,
    },
  })

  const watchedEmpresaId = useWatch({ control: form.control, name: "empresaId" })
  const watchedTitle = useWatch({ control: form.control, name: "title" })
  const watchedSize = useWatch({ control: form.control, name: "size" })
  const watchedPosition = useWatch({ control: form.control, name: "position" })
  const watchedEnabled = useWatch({ control: form.control, name: "enabled" })
  const watchedCameraIdsValue = useWatch({ control: form.control, name: "cameraIds" })
  const watchedCameraIds = useMemo(
    () => watchedCameraIdsValue ?? [],
    [watchedCameraIdsValue],
  )
  const watchedPeriod = useWatch({ control: form.control, name: "period" })
  const watchedGranularity = useWatch({ control: form.control, name: "granularity" })
  const watchedChartType = useWatch({ control: form.control, name: "chartType" })
  const watchedShowTotal = useWatch({ control: form.control, name: "showTotal" })

  const selectedCompanyId = Number(watchedEmpresaId || 0)

  const filteredCameraItems = useMemo(() => {
    if (!selectedCompanyId) return []

    return cameras
      .filter((camera) => camera.empresaId === selectedCompanyId)
      .map((camera) => ({
        id: String(camera.id),
        label: camera.nome || `Câmera ${camera.id}`,
        description: camera.ip || null,
      }))
  }, [cameras, selectedCompanyId])

  useEffect(() => {
    if (!open) return

    const initialCameraIds = (widget?.config?.cameraIds ?? []).map(String)

    form.reset({
      empresaId:
        typeof widget?.empresaId === "number"
          ? String(widget.empresaId)
          : defaultCompanyId
            ? String(defaultCompanyId)
            : "",
      title: widget?.title || "",
      size: widget?.size || "half",
      position: widget?.position ?? 0,
      enabled: widget?.enabled ?? true,
      cameraIds: initialCameraIds,
      period: widget?.config?.period || "7d",
      granularity: widget?.config?.granularity || "day",
      chartType: widget?.config?.chartType || "bar",
      showTotal: widget?.config?.showTotal ?? true,
    })
    setCameraFilterEnabled(initialCameraIds.length > 0)
    setOpenSection("setup")
    setPreviewError(null)
  }, [defaultCompanyId, form, open, widget])

  useEffect(() => {
    const currentCameraIds = form.getValues("cameraIds")
    const nextValidIds = currentCameraIds.filter((cameraId) =>
      filteredCameraItems.some((item) => item.id === cameraId),
    )

    if (nextValidIds.length !== currentCameraIds.length) {
      form.setValue("cameraIds", nextValidIds, { shouldDirty: true })
    }
  }, [filteredCameraItems, form])

  useEffect(() => {
    if (!open) return

    const empresaId = Number(watchedEmpresaId || 0)
    if (!empresaId) {
      setPreviewWidget(null)
      setPreviewError(null)
      setIsPreviewLoading(false)
      return
    }

    const timeout = window.setTimeout(async () => {
      setIsPreviewLoading(true)
      setPreviewError(null)

      try {
        const data = await dashboardWidgetService.preview({
          empresaId,
          title: watchedTitle?.trim() || t("preview.default_title"),
          type: "lpr_vehicle_count",
          size: watchedSize || "half",
          enabled: watchedEnabled ?? true,
          position: Number(watchedPosition ?? 0),
          config: {
            cameraIds: cameraFilterEnabled ? watchedCameraIds.map(Number) : [],
            period: watchedPeriod || "7d",
            granularity: watchedGranularity || "day",
            chartType: watchedChartType || "bar",
            showTotal: watchedShowTotal ?? true,
          },
        })

        setPreviewWidget(data)
      } catch (error) {
        setPreviewWidget(null)
        setPreviewError(t("preview.error"))
        console.error(error)
      } finally {
        setIsPreviewLoading(false)
      }
    }, 350)

    return () => window.clearTimeout(timeout)
  }, [
    open,
    watchedEmpresaId,
    watchedTitle,
    watchedSize,
    watchedEnabled,
    watchedPosition,
    watchedCameraIds,
    watchedPeriod,
    watchedGranularity,
    watchedChartType,
    watchedShowTotal,
    cameraFilterEnabled,
    t,
  ])

  const onSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true)

    const payload = {
      empresaId: Number(values.empresaId),
      title: values.title.trim(),
      type: "lpr_vehicle_count" as const,
      size: values.size,
      position: values.position,
      enabled: values.enabled,
      config: {
        cameraIds: cameraFilterEnabled ? values.cameraIds.map(Number) : [],
        period: values.period,
        granularity: values.granularity,
        chartType: values.chartType,
        showTotal: values.showTotal,
      },
    }

    try {
      if (widget) {
        await dashboardWidgetService.update(widget.id, payload)
        toast.success(t("notifications.update_success"))
      } else {
        await dashboardWidgetService.create(payload)
        toast.success(t("notifications.create_success"))
      }

      await onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast.apiError(
        error,
        widget ? t("notifications.update_error") : t("notifications.create_error"),
      )
    } finally {
      setIsSubmitting(false)
    }
  })

  const selectedCameraLabels = useMemo(
    () =>
      watchedCameraIds
        .map((cameraId) => filteredCameraItems.find((item) => item.id === cameraId))
        .filter(Boolean) as Array<{ id: string; label: string; description?: string | null }>,
    [filteredCameraItems, watchedCameraIds],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>{widget ? t("title_edit") : t("title_create")}</DialogTitle>
          <DialogDescription>
            {widget ? t("description_edit") : t("description_create")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-6">
            {showCompanySelector ? (
              <TenantCompanyFormField
                control={form.control}
                companies={companies}
                disabled={isEdit}
                description={isEdit ? tCompany("edit_locked") : undefined}
              />
            ) : null}

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_440px]">
              <div className="space-y-6">
                <Accordion
                  type="single"
                  collapsible
                  value={openSection}
                  onValueChange={(value) => setOpenSection(value || "")}
                  className="rounded-md border bg-card"
                >
                  <AccordionItem value="setup" className="px-4">
                    <AccordionTrigger className="cursor-pointer py-4 hover:no-underline">
                      <div className="space-y-1 text-left">
                        <div>{t("sections.setup")}</div>
                        <div className="text-xs font-normal text-muted-foreground">
                          {t("sections.setup_desc")}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-0">
                      <div className="space-y-4 pb-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("labels.title")}</FormLabel>
                                <FormControl>
                                  <Input placeholder={t("placeholders.title")} {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="position"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("labels.position")}</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={0}
                                    value={field.value}
                                    onChange={(event) =>
                                      field.onChange(Number(event.target.value) || 0)
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="size"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("labels.size")}</FormLabel>
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <FormControl>
                                    <SelectTrigger className="w-full cursor-pointer">
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="half">{t("sizes.half")}</SelectItem>
                                    <SelectItem value="full">{t("sizes.full")}</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="enabled"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <ToggleRow
                                    label={t("labels.enabled")}
                                    checked={field.value}
                                    onCheckedChange={(value) => field.onChange(Boolean(value))}
                                    activeLabel={t("status.enabled")}
                                    inactiveLabel={t("status.disabled")}
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

                  <AccordionItem value="data" className="px-4">
                    <AccordionTrigger className="cursor-pointer py-4 hover:no-underline">
                      <div className="space-y-1 text-left">
                        <div>{t("sections.data")}</div>
                        <div className="text-xs font-normal text-muted-foreground">
                          {t("sections.data_desc")}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-0">
                      <div className="space-y-4 pb-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="period"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("labels.period")}</FormLabel>
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <FormControl>
                                    <SelectTrigger className="w-full cursor-pointer">
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="today">{t("periods.today")}</SelectItem>
                                    <SelectItem value="7d">{t("periods.7d")}</SelectItem>
                                    <SelectItem value="30d">{t("periods.30d")}</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="granularity"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("labels.granularity")}</FormLabel>
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <FormControl>
                                    <SelectTrigger className="w-full cursor-pointer">
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="hour">{t("granularities.hour")}</SelectItem>
                                    <SelectItem value="day">{t("granularities.day")}</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <ToggleRow
                          label={t("labels.camera_filter")}
                          checked={cameraFilterEnabled}
                          onCheckedChange={(checked) => setCameraFilterEnabled(Boolean(checked))}
                          activeLabel={t("status.enabled")}
                          inactiveLabel={t("status.disabled")}
                        >
                          <FormField
                            control={form.control}
                            name="cameraIds"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("labels.cameras")}</FormLabel>
                                <FormControl>
                                  <CameraMultiSelectField
                                    items={filteredCameraItems}
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder={t("placeholders.cameras")}
                                    searchPlaceholder={t("placeholders.search_cameras")}
                                    emptyLabel={t("empty.cameras")}
                                    clearLabel={t("buttons.clear_cameras")}
                                    disabled={!selectedCompanyId}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {selectedCameraLabels.length ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {selectedCameraLabels.map((item) => (
                                <div
                                  key={item.id}
                                  className="inline-flex items-center gap-2 rounded-md border bg-muted/30 px-2.5 py-1 text-xs font-medium text-muted-foreground"
                                >
                                  {item.label}
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </ToggleRow>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="appearance" className="px-4">
                    <AccordionTrigger className="cursor-pointer py-4 hover:no-underline">
                      <div className="space-y-1 text-left">
                        <div>{t("sections.appearance")}</div>
                        <div className="text-xs font-normal text-muted-foreground">
                          {t("sections.appearance_desc")}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-0">
                      <div className="space-y-4 pb-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="chartType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("labels.chart_type")}</FormLabel>
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <FormControl>
                                    <SelectTrigger className="w-full cursor-pointer">
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="bar">{t("chart_types.bar")}</SelectItem>
                                    <SelectItem value="line">{t("chart_types.line")}</SelectItem>
                                    <SelectItem value="area">{t("chart_types.area")}</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="showTotal"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <ToggleRow
                                    label={t("labels.show_total")}
                                    checked={field.value}
                                    onCheckedChange={(value) => field.onChange(Boolean(value))}
                                    activeLabel={t("status.enabled")}
                                    inactiveLabel={t("status.disabled")}
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
                </Accordion>
              </div>

              <div className="space-y-4 xl:sticky xl:top-0 xl:self-start">
                <Card className="rounded-xl border bg-card">
                  <CardHeader className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <CardTitle className="text-base">{t("preview.title")}</CardTitle>
                        <CardDescription>{t("preview.description")}</CardDescription>
                      </div>
                      {isPreviewLoading ? (
                        <DataTag tone="info">
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          {t("preview.loading")}
                        </DataTag>
                      ) : (
                        <DataTag tone="success">
                          <RefreshCcw className="mr-1 h-3 w-3" />
                          {t("preview.live")}
                        </DataTag>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!selectedCompanyId ? (
                      <div className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                        {t("preview.select_company")}
                      </div>
                    ) : previewError ? (
                      <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-8 text-center text-sm text-muted-foreground">
                        {previewError}
                      </div>
                    ) : previewWidget ? (
                      <LprVehicleCountWidgetCard
                        key={`${previewWidget.data?.chartType || "bar"}-${previewWidget.data?.showTotal ? "1" : "0"}-${previewWidget.title}`}
                        widget={previewWidget}
                      />
                    ) : (
                      <div className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                        {t("preview.waiting")}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="cursor-pointer"
              >
                {t("buttons.cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {widget ? t("buttons.save") : t("buttons.create")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
