"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { FilePenLine, Loader2, X } from "lucide-react"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import { TenantCompanyFormField } from "@/components/shared/tenant-company-form-field"
import { DataTag } from "@/components/shared/data-tag"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { useTenantCompanySelection } from "@/hooks/use-tenant-company-selection"
import { useTranslator } from "@/lib/i18n"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { cn } from "@/lib/utils"
import { emailIntegrationService } from "@/services/email-integration.service"
import { Camera } from "@/types/camera"
import {
  EmailPlateAlertRule,
  EmailPlateAlertRuleFilters,
  EmailRecipient,
  EmailSmtpAccount,
  WhatsappAccount,
  WhatsappRecipient,
} from "@/types/email-integration"
import { EmailTemplateEditorDialog, EmailTemplateTokenDefinition } from "./email-template-editor-dialog"

const DIRECTION_OPTIONS = [
  { value: "obverse", translationKey: "option_labels.directions.obverse" },
  { value: "reverse", translationKey: "option_labels.directions.reverse" },
]

const VEHICLE_COLOR_OPTIONS = [
  "black",
  "white",
  "gray",
  "silver",
  "blue",
  "red",
  "green",
  "yellow",
  "brown",
  "orange",
  "purple",
].map((value) => ({
  value,
  translationKey: `option_labels.vehicle_colors.${value}`,
}))

const VEHICLE_TYPE_OPTIONS = [
  "car",
  "truck",
  "motorcycle",
  "bus",
  "van",
  "pickup",
  "suv",
].map((value) => ({
  value,
  translationKey: `option_labels.vehicle_types.${value}`,
}))

const VEHICLE_BRAND_OPTIONS = [
  "chevrolet",
  "fiat",
  "ford",
  "volkswagen",
  "toyota",
  "honda",
  "hyundai",
  "renault",
  "jeep",
  "nissan",
  "peugeot",
  "citroen",
  "kia",
  "bmw",
  "mercedes-benz",
  "audi",
].map((value) => ({
  value,
  translationKey: `option_labels.vehicle_brands.${value.replace(/[^a-z0-9]+/g, "_")}`,
}))

function setArraySelection(current: string[], nextValue: string, checked: boolean) {
  return checked ? [...current, nextValue] : current.filter((value) => value !== nextValue)
}

function splitListValues(value?: string | null) {
  return (value || "")
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function normalizePlateDraft(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9;,\s-]+/g, "")
}

function normalizeBrazilianPlate(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]+/g, "")
}

function isValidBrazilianPlate(value: string) {
  return /^[A-Z]{3}\d{4}$/.test(value) || /^[A-Z]{3}\d[A-Z]\d{2}$/.test(value)
}

function parseBrazilianPlateValues(value?: string | null) {
  const valid: string[] = []
  const invalid: string[] = []

  for (const item of splitListValues(value)) {
    const normalized = normalizeBrazilianPlate(item)
    if (!normalized) continue

    if (isValidBrazilianPlate(normalized)) {
      valid.push(normalized)
      continue
    }

    invalid.push(item.trim())
  }

  return {
    valid: Array.from(new Set(valid)),
    invalid: Array.from(new Set(invalid)),
  }
}

function getMultiSelectLabel(selectedValues: string[], emptyLabel: string, optionLabels: Map<string, string>) {
  if (!selectedValues.length) return emptyLabel
  if (selectedValues.length === 1) return optionLabels.get(selectedValues[0]) || selectedValues[0]
  return `${optionLabels.get(selectedValues[0]) || selectedValues[0]} +${selectedValues.length - 1}`
}

function normalizeOptionalNumber(value: unknown) {
  if (value === "" || value === null || value === undefined) return undefined
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : undefined
}

function hasAnyRuleCriteria(values: {
  platesText?: string
  speedThresholdKmh?: unknown
  directions?: string[]
  vehicleColors?: string[]
  vehicleTypes?: string[]
  vehicleBrands?: string[]
}) {
  return Boolean(
    parseBrazilianPlateValues(values.platesText).valid.length ||
      typeof normalizeOptionalNumber(values.speedThresholdKmh) === "number" ||
      values.directions?.length ||
      values.vehicleColors?.length ||
      values.vehicleTypes?.length ||
      values.vehicleBrands?.length,
  )
}

function buildRuleFilters(values: {
  speedThresholdKmh?: unknown
  directions?: string[]
  vehicleColors?: string[]
  vehicleTypes?: string[]
  vehicleBrands?: string[]
}): EmailPlateAlertRuleFilters | null {
  const filters: EmailPlateAlertRuleFilters = {
    speedThresholdKmh: normalizeOptionalNumber(values.speedThresholdKmh),
    directions: values.directions?.length ? values.directions : undefined,
    vehicleColors: values.vehicleColors?.length ? values.vehicleColors : undefined,
    vehicleTypes: values.vehicleTypes?.length ? values.vehicleTypes : undefined,
    vehicleBrands: values.vehicleBrands?.length ? values.vehicleBrands : undefined,
  }

  return hasAnyRuleCriteria({
    platesText: "",
    ...values,
  })
    ? filters
    : null
}

function RecipientMultiSelectField({
  items,
  value,
  onChange,
  placeholder,
  emptyLabel,
  searchPlaceholder,
  clearLabel,
}: {
  items: Array<{ id: string; label: string; description?: string | null }>
  value: string[]
  onChange: (nextValue: string[]) => void
  placeholder: string
  emptyLabel: string
  searchPlaceholder: string
  clearLabel: string
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
          className={cn("w-full cursor-pointer justify-between text-left font-normal", !selectedItems.length && "text-muted-foreground")}
        >
          <span className="truncate">{triggerLabel}</span>
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
                        <p className="truncate text-xs text-muted-foreground">{item.description}</p>
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
                  <CommandItem onSelect={() => onChange([])} className="cursor-pointer justify-center text-center">
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

function PlateTagInputField({
  value,
  onChange,
  placeholder,
  onInvalidPlates,
}: {
  value: string
  onChange: (nextValue: string) => void
  placeholder: string
  onInvalidPlates?: (invalidValues: string[]) => void
}) {
  const [draft, setDraft] = useState("")
  const plates = useMemo(() => parseBrazilianPlateValues(value).valid, [value])

  const commitDraft = () => {
    const { valid, invalid } = parseBrazilianPlateValues(draft)
    if (!valid.length) {
      if (invalid.length) {
        onInvalidPlates?.(invalid)
      }
      setDraft("")
      return
    }

    const merged = Array.from(new Set([...plates, ...valid]))
    onChange(merged.join(";"))
    if (invalid.length) {
      onInvalidPlates?.(invalid)
    }
    setDraft("")
  }

  const removePlate = (plateToRemove: string) => {
    onChange(plates.filter((plate) => plate !== plateToRemove).join(";"))
  }

  return (
    <div className="rounded-md border bg-background px-3 py-2">
      <div className="flex min-h-9 flex-wrap items-center gap-2">
        {plates.map((plate) => (
          <Badge key={plate} variant="secondary" className="flex items-center gap-1 px-2 py-1">
            <span>{plate}</span>
            <button
              type="button"
              className="inline-flex cursor-pointer items-center rounded-sm text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => removePlate(plate)}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <Input
          value={draft}
          onChange={(event) => setDraft(normalizePlateDraft(event.target.value))}
          onBlur={commitDraft}
          onKeyDown={(event) => {
            if (event.key === ";" || event.key === "Enter" || event.key === ",") {
              event.preventDefault()
              commitDraft()
            }
            if (event.key === "Backspace" && !draft && plates.length) {
              event.preventDefault()
              removePlate(plates[plates.length - 1]!)
            }
          }}
          placeholder={plates.length ? "" : placeholder}
          className="h-8 min-w-[12rem] flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
        />
      </div>
    </div>
  )
}

function CriteriaToggleRow({
  label,
  checked,
  onCheckedChange,
  children,
  activeLabel,
  inactiveLabel,
}: {
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  children?: ReactNode
  activeLabel: string
  inactiveLabel: string
}) {
  return (
    <div className="rounded-md border bg-muted/20">
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <p className="text-sm font-medium">{label}</p>
        <div className="flex items-center gap-2">
          <DataTag tone={checked ? "success" : "neutral"}>{checked ? activeLabel : inactiveLabel}</DataTag>
          <Switch checked={checked} onCheckedChange={onCheckedChange} />
        </div>
      </div>
      {checked ? <div className="border-t px-4 py-4">{children}</div> : null}
    </div>
  )
}

interface EmailRuleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rule: EmailPlateAlertRule | null
  smtpAccounts: EmailSmtpAccount[]
  recipients: EmailRecipient[]
  whatsappAccounts: WhatsappAccount[]
  whatsappRecipients: WhatsappRecipient[]
  cameras: Camera[]
  onSuccess: () => Promise<void> | void
}

function createInitialCriteriaEnabled(rule: EmailPlateAlertRule | null) {
  return {
    plates: Boolean(rule?.plates.length),
    vehicle: Boolean(
      rule?.filters?.vehicleColors?.length ||
        rule?.filters?.vehicleTypes?.length ||
        rule?.filters?.vehicleBrands?.length,
    ),
    detection: Boolean(
      typeof rule?.filters?.speedThresholdKmh === "number" || rule?.filters?.directions?.length,
    ),
  }
}

export function EmailRuleFormDialog(props: EmailRuleFormDialogProps) {
  if (!props.open) {
    return null
  }

  return (
    <OpenEmailRuleFormDialog
      key={props.rule?.id ?? "new"}
      {...props}
    />
  )
}

function OpenEmailRuleFormDialog({
  onOpenChange,
  rule,
  smtpAccounts,
  recipients,
  whatsappAccounts,
  whatsappRecipients,
  cameras,
  onSuccess,
}: EmailRuleFormDialogProps) {
  const t = useTranslator("email_integrations.rules.form")
  const { companies, defaultCompanyId, showCompanySelector } = useTenantCompanySelection()
  const [openSection, setOpenSection] = useState("scope")
  const [isTemplateEditorOpen, setIsTemplateEditorOpen] = useState(false)
  const [criteriaEnabled, setCriteriaEnabled] = useState(() =>
    createInitialCriteriaEnabled(rule),
  )

  const schema = useMemo(
    () => {
      return z.object({
        empresaId: z.string().optional(),
        name: z.string().trim().min(2, t("validations.name")),
        description: z.string().optional(),
        cameraId: z.string().min(1, t("validations.camera")),
        smtpAccountId: z.string().optional(),
        recipientIds: z.array(z.string()),
        whatsappAccountId: z.string().optional(),
        whatsappRecipientIds: z.array(z.string()),
        platesText: z.string().optional(),
        speedThresholdKmh: z.string().optional(),
        directions: z.array(z.string()),
        vehicleColors: z.array(z.string()),
        vehicleTypes: z.array(z.string()),
        vehicleBrands: z.array(z.string()),
        subjectTemplate: z.string().trim().min(1, t("validations.subject")),
        bodyTemplate: z.string().trim().min(1, t("validations.body")),
        cooldownSeconds: z.number().min(0),
        enabled: z.boolean(),
        emailEnabled: z.boolean(),
        whatsappEnabled: z.boolean(),
      }).superRefine((values, ctx) => {
        if (!values.emailEnabled && !values.whatsappEnabled) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["emailEnabled"],
            message: t("validations.channels"),
          })
        }
        if (!hasAnyRuleCriteria(values)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["platesText"],
            message: t("validations.criteria"),
          })
        }
        if (values.emailEnabled) {
          if (!values.smtpAccountId) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["smtpAccountId"],
              message: t("validations.smtp_account"),
            })
          }
          if (values.smtpAccountId && !values.recipientIds.length) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["recipientIds"],
              message: t("validations.recipients"),
            })
          }
        }
        if (values.whatsappEnabled) {
          if (!values.whatsappAccountId) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["whatsappAccountId"],
              message: t("validations.whatsapp_account"),
            })
          }
          if (values.whatsappAccountId && !values.whatsappRecipientIds.length) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["whatsappRecipientIds"],
              message: t("validations.whatsapp_recipients"),
            })
          }
        }
      })
    },
    [t],
  )

  type FormValues = z.infer<typeof schema>

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      empresaId: defaultCompanyId ? String(defaultCompanyId) : "",
      name: "",
      description: "",
      cameraId: "",
      smtpAccountId: "",
      recipientIds: [],
      whatsappAccountId: "",
      whatsappRecipientIds: [],
      platesText: "",
      speedThresholdKmh: "",
      directions: [],
      vehicleColors: [],
      vehicleTypes: [],
      vehicleBrands: [],
      subjectTemplate: "Alerta LPR: {{detection.plateText}} em {{camera.nome}}",
      bodyTemplate:
        "Placa: {{detection.plateText}}\nCâmera: {{camera.nome}}\nEmpresa: {{empresa.nome}}\nData/Hora: {{detection.detectedAt}}",
      cooldownSeconds: 300,
      enabled: true,
      emailEnabled: true,
      whatsappEnabled: false,
    },
  })

  useEffect(() => {
    form.reset({
      empresaId:
        typeof rule?.empresaId === "number"
          ? String(rule.empresaId)
          : defaultCompanyId
            ? String(defaultCompanyId)
            : "",
      name: rule?.name || "",
      description: rule?.description || "",
      cameraId: rule?.cameraId ? String(rule.cameraId) : "",
      smtpAccountId: rule?.smtpAccountId ? String(rule.smtpAccountId) : "",
      recipientIds: rule?.recipients.map((item) => String(item.id)) || [],
      whatsappAccountId: rule?.whatsappAccountId ? String(rule.whatsappAccountId) : "",
      whatsappRecipientIds: rule?.whatsappRecipients.map((item) => String(item.id)) || [],
      platesText: rule?.plates.map((item) => item.plateText).join("\n") || "",
      speedThresholdKmh:
        typeof rule?.filters?.speedThresholdKmh === "number"
          ? String(rule.filters.speedThresholdKmh)
          : "",
      directions: rule?.filters?.directions || [],
      vehicleColors: rule?.filters?.vehicleColors || [],
      vehicleTypes: rule?.filters?.vehicleTypes || [],
      vehicleBrands: rule?.filters?.vehicleBrands || [],
      subjectTemplate:
        rule?.subjectTemplate || "Alerta LPR: {{detection.plateText}} em {{camera.nome}}",
      bodyTemplate:
        rule?.bodyTemplate ||
        "Placa: {{detection.plateText}}\nCâmera: {{camera.nome}}\nEmpresa: {{empresa.nome}}\nData/Hora: {{detection.detectedAt}}",
      cooldownSeconds: rule?.cooldownSeconds || 300,
      enabled: rule?.enabled !== false,
      emailEnabled: rule?.emailEnabled !== false,
      whatsappEnabled: rule?.whatsappEnabled === true,
    })
  }, [defaultCompanyId, form, rule])

  const selectedCompanyId = useWatch({ control: form.control, name: "empresaId" })
  const filteredCompanyId = selectedCompanyId?.trim()
    ? Number(selectedCompanyId)
    : null

  const filteredCameras = useMemo(
    () => cameras.filter((camera) => (filteredCompanyId ? camera.empresaId === filteredCompanyId : true)),
    [cameras, filteredCompanyId],
  )

  const filteredSmtpAccounts = useMemo(
    () => smtpAccounts.filter((account) => (filteredCompanyId ? account.empresaId === filteredCompanyId : true)),
    [filteredCompanyId, smtpAccounts],
  )

  const filteredRecipients = useMemo(
    () => recipients.filter((recipient) => (filteredCompanyId ? recipient.empresaId === filteredCompanyId : true)),
    [filteredCompanyId, recipients],
  )

  const filteredWhatsappAccounts = useMemo(
    () => whatsappAccounts.filter((account) => (filteredCompanyId ? account.empresaId === filteredCompanyId : true)),
    [filteredCompanyId, whatsappAccounts],
  )

  const selectedWhatsappAccountId = useWatch({
    control: form.control,
    name: "whatsappAccountId",
  })
  const emailEnabled = useWatch({ control: form.control, name: "emailEnabled" })
  const smtpAccountId = useWatch({ control: form.control, name: "smtpAccountId" })
  const whatsappEnabled = useWatch({
    control: form.control,
    name: "whatsappEnabled",
  })
  const subjectTemplate = useWatch({
    control: form.control,
    name: "subjectTemplate",
  })
  const bodyTemplate = useWatch({ control: form.control, name: "bodyTemplate" })
  const filteredWhatsappRecipients = useMemo(
    () =>
      whatsappRecipients.filter((recipient) => {
        if (filteredCompanyId && recipient.empresaId !== filteredCompanyId) return false
        if (!selectedWhatsappAccountId) return !recipient.accountId
        return !recipient.accountId || recipient.accountId === Number(selectedWhatsappAccountId)
      }),
    [filteredCompanyId, selectedWhatsappAccountId, whatsappRecipients],
  )

  useEffect(() => {
    if (smtpAccountId && !filteredSmtpAccounts.some((account) => account.id === Number(smtpAccountId))) {
      form.setValue("smtpAccountId", "", { shouldDirty: true, shouldValidate: true })
      form.setValue("recipientIds", [], { shouldDirty: true, shouldValidate: true })
    }
  }, [filteredSmtpAccounts, form, smtpAccountId])

  useEffect(() => {
    const allowedRecipientIds = new Set(filteredRecipients.map((recipient) => String(recipient.id)))
    const current = form.getValues("recipientIds")
    const next = current.filter((recipientId) => allowedRecipientIds.has(recipientId))
    if (next.length !== current.length) {
      form.setValue("recipientIds", next, { shouldDirty: true, shouldValidate: true })
    }
  }, [filteredRecipients, form])

  useEffect(() => {
    if (
      selectedWhatsappAccountId &&
      !filteredWhatsappAccounts.some((account) => account.id === Number(selectedWhatsappAccountId))
    ) {
      form.setValue("whatsappAccountId", "", { shouldDirty: true, shouldValidate: true })
      form.setValue("whatsappRecipientIds", [], { shouldDirty: true, shouldValidate: true })
    }
  }, [filteredWhatsappAccounts, form, selectedWhatsappAccountId])

  useEffect(() => {
    const allowedWhatsappRecipientIds = new Set(
      filteredWhatsappRecipients.map((recipient) => String(recipient.id)),
    )
    const current = form.getValues("whatsappRecipientIds")
    const next = current.filter((recipientId) => allowedWhatsappRecipientIds.has(recipientId))
    if (next.length !== current.length) {
      form.setValue("whatsappRecipientIds", next, {
        shouldDirty: true,
        shouldValidate: true,
      })
    }
  }, [filteredWhatsappRecipients, form])

  const directionLabelMap = useMemo(
    () => new Map(DIRECTION_OPTIONS.map((option) => [option.value, t(option.translationKey)])),
    [t],
  )
  const vehicleColorLabelMap = useMemo(
    () => new Map(VEHICLE_COLOR_OPTIONS.map((option) => [option.value, t(option.translationKey)])),
    [t],
  )
  const vehicleTypeLabelMap = useMemo(
    () => new Map(VEHICLE_TYPE_OPTIONS.map((option) => [option.value, t(option.translationKey)])),
    [t],
  )
  const vehicleBrandLabelMap = useMemo(
    () => new Map(VEHICLE_BRAND_OPTIONS.map((option) => [option.value, t(option.translationKey)])),
    [t],
  )

  const recipientOptions = useMemo(
    () =>
      filteredRecipients.map((recipient) => ({
        id: String(recipient.id),
        label: recipient.name,
        description: recipient.email,
      })),
    [filteredRecipients],
  )

  const whatsappRecipientOptions = useMemo(
    () =>
      filteredWhatsappRecipients.map((recipient) => ({
        id: String(recipient.id),
        label: recipient.name,
        description: recipient.phoneNumber || recipient.chatId || t("labels.not_informed"),
      })),
    [filteredWhatsappRecipients, t],
  )

  const templateTokens = useMemo<EmailTemplateTokenDefinition[]>(
    () => [
      {
        label: t("editor.tokens.plate.label"),
        description: t("editor.tokens.plate.description"),
        token: "{{detection.plateText}}",
        tone: "info",
      },
      {
        label: t("editor.tokens.detected_at.label"),
        description: t("editor.tokens.detected_at.description"),
        token: "{{detection.detectedAt}}",
        tone: "accent",
      },
      {
        label: t("editor.tokens.speed_kmh.label"),
        description: t("editor.tokens.speed_kmh.description"),
        token: "{{detection.speedKmh}}",
        tone: "warning",
      },
      {
        label: t("editor.tokens.direction.label"),
        description: t("editor.tokens.direction.description"),
        token: "{{detection.direction}}",
        tone: "neutral",
      },
      {
        label: t("editor.tokens.vehicle_color.label"),
        description: t("editor.tokens.vehicle_color.description"),
        token: "{{detection.vehicleColor}}",
        tone: "info",
      },
      {
        label: t("editor.tokens.vehicle_type.label"),
        description: t("editor.tokens.vehicle_type.description"),
        token: "{{detection.vehicleType}}",
        tone: "success",
      },
      {
        label: t("editor.tokens.vehicle_brand.label"),
        description: t("editor.tokens.vehicle_brand.description"),
        token: "{{detection.vehicleBrand}}",
        tone: "accent",
      },
      {
        label: t("editor.tokens.image_markdown.label"),
        description: t("editor.tokens.image_markdown.description"),
        token: "{{detection.imageMarkdown}}",
        tone: "danger",
      },
      {
        label: t("editor.tokens.camera_name.label"),
        description: t("editor.tokens.camera_name.description"),
        token: "{{camera.nome}}",
        tone: "success",
      },
      {
        label: t("editor.tokens.camera_ip.label"),
        description: t("editor.tokens.camera_ip.description"),
        token: "{{camera.ip}}",
        tone: "neutral",
      },
      {
        label: t("editor.tokens.company_name.label"),
        description: t("editor.tokens.company_name.description"),
        token: "{{empresa.nome}}",
        tone: "warning",
      },
      {
        label: t("editor.tokens.smtp_name.label"),
        description: t("editor.tokens.smtp_name.description"),
        token: "{{smtpAccount.name}}",
        tone: "danger",
      },
      {
        label: t("editor.tokens.whatsapp_name.label"),
        description: t("editor.tokens.whatsapp_name.description"),
        token: "{{whatsappAccount.name}}",
        tone: "success",
      },
      {
        label: t("editor.tokens.rule_name.label"),
        description: t("editor.tokens.rule_name.description"),
        token: "{{rule.name}}",
        tone: "accent",
      },
    ],
    [t],
  )

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = {
        ...(values.empresaId ? { empresaId: Number(values.empresaId) } : {}),
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        cameraId: Number(values.cameraId),
        smtpAccountId: values.emailEnabled && values.smtpAccountId ? Number(values.smtpAccountId) : null,
        recipientIds: values.emailEnabled ? values.recipientIds.map(Number) : [],
        whatsappAccountId:
          values.whatsappEnabled && values.whatsappAccountId ? Number(values.whatsappAccountId) : null,
        whatsappRecipientIds: values.whatsappEnabled ? values.whatsappRecipientIds.map(Number) : [],
        plates: parseBrazilianPlateValues(values.platesText).valid,
        filters: buildRuleFilters(values),
        subjectTemplate: values.subjectTemplate.trim(),
        bodyTemplate: values.bodyTemplate.trim(),
        cooldownSeconds: Number(values.cooldownSeconds ?? 0),
        emailEnabled: values.emailEnabled,
        whatsappEnabled: values.whatsappEnabled,
        enabled: values.enabled,
      }

      if (rule) {
        await emailIntegrationService.updateRule(rule.id, payload)
        toast.success(t("notifications.edit_success"))
      } else {
        await emailIntegrationService.createRule(payload)
        toast.success(t("notifications.create_success"))
      }

      await onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast.apiError(error, rule ? t("notifications.edit_error") : t("notifications.create_error"))
    }
  })

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{rule ? t("title_edit") : t("title_create")}</DialogTitle>
          <DialogDescription>{rule ? t("description_edit") : t("description_create")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-6" onSubmit={onSubmit}>
            {showCompanySelector ? (
              <TenantCompanyFormField control={form.control} companies={companies} />
            ) : null}

            <Accordion
              type="single"
              collapsible
              value={openSection}
              onValueChange={(value) => setOpenSection(value || "")}
              className="rounded-md border bg-card"
            >
              <AccordionItem value="scope" className="px-4">
                <AccordionTrigger className="cursor-pointer py-4 hover:no-underline">
                  <div className="space-y-1 text-left">
                    <div>{t("sections.scope")}</div>
                    <div className="text-xs font-normal text-muted-foreground">
                      {t("sections.scope_desc")}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  <div className="space-y-4 pb-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="name"
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
                        name="cooldownSeconds"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("labels.cooldown")}</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder={t("placeholders.cooldown")}
                                value={field.value ?? 0}
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

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("labels.description")}</FormLabel>
                          <FormControl>
                            <Input placeholder={t("placeholders.description")} {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-3">
                      <FormField
                        control={form.control}
                        name="emailEnabled"
                        render={({ field }) => (
                          <FormItem className="rounded-md border bg-muted/20 px-4 py-3">
                            <div className="flex items-center justify-between gap-4">
                              <FormLabel>{t("labels.enable_email")}</FormLabel>
                              <div className="flex items-center gap-2">
                                <DataTag tone={field.value ? "success" : "neutral"}>
                                  {field.value ? t("options.enabled") : t("options.disabled")}
                                </DataTag>
                                <Switch checked={field.value} onCheckedChange={(value) => field.onChange(Boolean(value))} />
                              </div>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="whatsappEnabled"
                        render={({ field }) => (
                          <FormItem className="rounded-md border bg-muted/20 px-4 py-3">
                            <div className="flex items-center justify-between gap-4">
                              <FormLabel>{t("labels.enable_whatsapp")}</FormLabel>
                              <div className="flex items-center gap-2">
                                <DataTag tone={field.value ? "success" : "neutral"}>
                                  {field.value ? t("options.enabled") : t("options.disabled")}
                                </DataTag>
                                <Switch checked={field.value} onCheckedChange={(value) => field.onChange(Boolean(value))} />
                              </div>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="enabled"
                        render={({ field }) => (
                          <FormItem className="rounded-md border bg-muted/20 px-4 py-3">
                            <div className="flex items-center justify-between gap-4">
                              <FormLabel>{t("labels.status")}</FormLabel>
                              <div className="flex items-center gap-2">
                                <DataTag tone={field.value ? "success" : "neutral"}>
                                  {field.value ? t("options.enabled") : t("options.disabled")}
                                </DataTag>
                                <Switch checked={field.value} onCheckedChange={(value) => field.onChange(Boolean(value))} />
                              </div>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-1">
                      <FormField
                        control={form.control}
                        name="cameraId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("labels.camera")}</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger className="w-full cursor-pointer">
                                  <SelectValue placeholder={t("placeholders.camera")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {filteredCameras.map((camera) => (
                                  <SelectItem key={camera.id} value={String(camera.id)}>
                                    {camera.nome || `#${camera.id}`} {camera.ip ? `• ${camera.ip}` : ""}
                                  </SelectItem>
                                ))}
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

              <AccordionItem value="criteria" className="px-4">
                <AccordionTrigger className="cursor-pointer py-4 hover:no-underline">
                  <div className="space-y-1 text-left">
                    <div>{t("sections.criteria")}</div>
                    <div className="text-xs font-normal text-muted-foreground">
                      {t("sections.criteria_desc")}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  <div className="space-y-4 pb-4">
                    <CriteriaToggleRow
                      label={t("labels.criteria_group_identity")}
                      checked={criteriaEnabled.plates}
                      activeLabel={t("options.enabled")}
                      inactiveLabel={t("options.disabled")}
                      onCheckedChange={(checked) => {
                        setCriteriaEnabled((current) => ({ ...current, plates: checked }))
                        if (!checked) {
                          form.setValue("platesText", "", { shouldDirty: true, shouldValidate: true })
                        }
                      }}
                    >
                      <FormField
                        control={form.control}
                        name="platesText"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <PlateTagInputField
                                value={field.value || ""}
                                onChange={(nextValue) => field.onChange(nextValue)}
                                placeholder={t("placeholders.plates")}
                                onInvalidPlates={(invalidValues) => {
                                  toast.warning(
                                    t("notifications.invalid_plates", {
                                      value: invalidValues.join(", "),
                                    }),
                                  )
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CriteriaToggleRow>

                    <CriteriaToggleRow
                      label={t("labels.criteria_group_vehicle")}
                      checked={criteriaEnabled.vehicle}
                      activeLabel={t("options.enabled")}
                      inactiveLabel={t("options.disabled")}
                      onCheckedChange={(checked) => {
                        setCriteriaEnabled((current) => ({ ...current, vehicle: checked }))
                        if (!checked) {
                          form.setValue("vehicleColors", [], { shouldDirty: true, shouldValidate: true })
                          form.setValue("vehicleTypes", [], { shouldDirty: true, shouldValidate: true })
                          form.setValue("vehicleBrands", [], { shouldDirty: true, shouldValidate: true })
                        }
                      }}
                    >
                      <div className="grid gap-4 md:grid-cols-3">
                        <FormField
                          control={form.control}
                          name="vehicleColors"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("labels.vehicle_colors")}</FormLabel>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button type="button" variant="outline" className="w-full justify-between">
                                    <span className="truncate">
                                      {getMultiSelectLabel(field.value, t("placeholders.vehicle_colors"), vehicleColorLabelMap)}
                                    </span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                                  {VEHICLE_COLOR_OPTIONS.map((option) => (
                                    <DropdownMenuCheckboxItem
                                      key={option.value}
                                      checked={field.value.includes(option.value)}
                                      onCheckedChange={(checked) => field.onChange(setArraySelection(field.value, option.value, Boolean(checked)))}
                                    >
                                      {t(option.translationKey)}
                                    </DropdownMenuCheckboxItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="vehicleTypes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("labels.vehicle_types")}</FormLabel>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button type="button" variant="outline" className="w-full justify-between">
                                    <span className="truncate">
                                      {getMultiSelectLabel(field.value, t("placeholders.vehicle_types"), vehicleTypeLabelMap)}
                                    </span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                                  {VEHICLE_TYPE_OPTIONS.map((option) => (
                                    <DropdownMenuCheckboxItem
                                      key={option.value}
                                      checked={field.value.includes(option.value)}
                                      onCheckedChange={(checked) => field.onChange(setArraySelection(field.value, option.value, Boolean(checked)))}
                                    >
                                      {t(option.translationKey)}
                                    </DropdownMenuCheckboxItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="vehicleBrands"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("labels.vehicle_brands")}</FormLabel>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button type="button" variant="outline" className="w-full justify-between">
                                    <span className="truncate">
                                      {getMultiSelectLabel(field.value, t("placeholders.vehicle_brands"), vehicleBrandLabelMap)}
                                    </span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                                  {VEHICLE_BRAND_OPTIONS.map((option) => (
                                    <DropdownMenuCheckboxItem
                                      key={option.value}
                                      checked={field.value.includes(option.value)}
                                      onCheckedChange={(checked) => field.onChange(setArraySelection(field.value, option.value, Boolean(checked)))}
                                    >
                                      {t(option.translationKey)}
                                    </DropdownMenuCheckboxItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CriteriaToggleRow>

                    <CriteriaToggleRow
                      label={t("labels.criteria_group_detection")}
                      checked={criteriaEnabled.detection}
                      activeLabel={t("options.enabled")}
                      inactiveLabel={t("options.disabled")}
                      onCheckedChange={(checked) => {
                        setCriteriaEnabled((current) => ({ ...current, detection: checked }))
                        if (!checked) {
                          form.setValue("speedThresholdKmh", "", { shouldDirty: true, shouldValidate: true })
                          form.setValue("directions", [], { shouldDirty: true, shouldValidate: true })
                        }
                      }}
                    >
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="speedThresholdKmh"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("labels.speed_threshold")}</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder={t("placeholders.speed_threshold")}
                                  {...field}
                                  value={(field.value as string | number | undefined) ?? ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="directions"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("labels.directions")}</FormLabel>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button type="button" variant="outline" className="w-full justify-between">
                                    <span className="truncate">
                                      {getMultiSelectLabel(field.value, t("placeholders.directions"), directionLabelMap)}
                                    </span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                                  {DIRECTION_OPTIONS.map((option) => (
                                    <DropdownMenuCheckboxItem
                                      key={option.value}
                                      checked={field.value.includes(option.value)}
                                      onCheckedChange={(checked) => field.onChange(setArraySelection(field.value, option.value, Boolean(checked)))}
                                    >
                                      {t(option.translationKey)}
                                    </DropdownMenuCheckboxItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CriteriaToggleRow>

                    {form.formState.errors.platesText?.message ? (
                      <p className="text-sm text-destructive">{form.formState.errors.platesText.message}</p>
                    ) : null}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="recipients" className="px-4">
                <AccordionTrigger className="cursor-pointer py-4 hover:no-underline">
                  <div className="space-y-1 text-left">
                    <div>{t("sections.recipients")}</div>
                    <div className="text-xs font-normal text-muted-foreground">
                      {t("sections.recipients_desc")}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  <div className="space-y-4 pb-4">
                    {emailEnabled ? (
                      <>
                        <FormField
                          control={form.control}
                          name="smtpAccountId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("labels.smtp_account")}</FormLabel>
                              <Select
                                value={field.value}
                                onValueChange={(value) => {
                                  field.onChange(value)
                                  form.setValue("recipientIds", [], { shouldDirty: true })
                                }}
                              >
                                <FormControl>
                                  <SelectTrigger className="w-full cursor-pointer">
                                    <SelectValue placeholder={t("placeholders.smtp_account")} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {filteredSmtpAccounts.map((account) => (
                                    <SelectItem key={account.id} value={String(account.id)}>
                                      {account.name} • {account.fromEmail}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                        {smtpAccountId ? (
                          <FormField
                            control={form.control}
                            name="recipientIds"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("labels.recipients")}</FormLabel>
                                <FormControl>
                                  <RecipientMultiSelectField
                                    items={recipientOptions}
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder={t("labels.recipients")}
                                    emptyLabel={t("empty_recipients")}
                                    searchPlaceholder={t("placeholders.search_recipient")}
                                    clearLabel={t("buttons.clear_selection")}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ) : null}
                      </>
                    ) : null}

                    {whatsappEnabled ? (
                      <>
                        <FormField
                          control={form.control}
                          name="whatsappAccountId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("labels.whatsapp_account")}</FormLabel>
                              <Select value={field.value} onValueChange={(value) => {
                                field.onChange(value)
                                form.setValue("whatsappRecipientIds", [], { shouldDirty: true })
                              }}>
                                <FormControl>
                                  <SelectTrigger className="w-full cursor-pointer">
                                    <SelectValue placeholder={t("placeholders.whatsapp_account")} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {filteredWhatsappAccounts.map((account) => (
                                    <SelectItem key={account.id} value={String(account.id)}>
                                      {account.name} {account.phoneNumber ? `• ${account.phoneNumber}` : ""}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                        {selectedWhatsappAccountId ? (
                          <FormField
                            control={form.control}
                            name="whatsappRecipientIds"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("labels.whatsapp_recipients")}</FormLabel>
                                <FormControl>
                                  <RecipientMultiSelectField
                                    items={whatsappRecipientOptions}
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder={t("labels.whatsapp_recipients")}
                                    emptyLabel={t("empty_whatsapp_recipients")}
                                    searchPlaceholder={t("placeholders.search_whatsapp_recipient")}
                                    clearLabel={t("buttons.clear_selection")}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ) : null}
                      </>
                    ) : null}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="templates" className="px-4">
                <AccordionTrigger className="cursor-pointer py-4 hover:no-underline">
                  <div className="space-y-1 text-left">
                    <div>{t("sections.templates")}</div>
                    <div className="text-xs font-normal text-muted-foreground">
                      {t("sections.templates_desc")}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  <div className="space-y-4 pb-4">
                    <input type="hidden" {...form.register("subjectTemplate")} />
                    <input type="hidden" {...form.register("bodyTemplate")} />

                    <div className="rounded-md border bg-muted/20 p-4">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">{t("labels.template_editor")}</p>
                          <FormDescription>{t("labels.template_help")}</FormDescription>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="cursor-pointer md:self-start"
                          onClick={() => setIsTemplateEditorOpen(true)}
                        >
                          <FilePenLine className="h-4 w-4" />
                          {t("buttons.open_editor")}
                        </Button>
                      </div>

                      {form.formState.errors.subjectTemplate?.message ? (
                        <p className="mt-3 text-sm text-destructive">{form.formState.errors.subjectTemplate.message}</p>
                      ) : null}

                      {form.formState.errors.bodyTemplate?.message ? (
                        <p className="mt-2 text-sm text-destructive">{form.formState.errors.bodyTemplate.message}</p>
                      ) : null}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <DialogFooter>
              <Button type="button" variant="outline" className="cursor-pointer" onClick={() => onOpenChange(false)}>
                {t("buttons.cancel")}
              </Button>
              <Button type="submit" className="cursor-pointer" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {rule ? t("buttons.save") : t("buttons.create")}
              </Button>
            </DialogFooter>
          </form>
        </Form>

        <EmailTemplateEditorDialog
          open={isTemplateEditorOpen}
          onOpenChange={setIsTemplateEditorOpen}
          title={t("editor.title")}
          description={t("editor.description")}
          subjectLabel={t("labels.subject")}
          subjectPlaceholder={t("placeholders.subject")}
          bodyLabel={t("labels.body")}
          bodyPlaceholder={t("placeholders.body")}
          toolbarLabel={t("editor.toolbar_title")}
          emptyTokensLabel={t("editor.empty_tokens")}
          subjectValue={subjectTemplate}
          bodyValue={bodyTemplate}
          onSave={({ subject, body }) => {
            form.setValue("subjectTemplate", subject, { shouldDirty: true, shouldValidate: true })
            form.setValue("bodyTemplate", body, { shouldDirty: true, shouldValidate: true })
          }}
          tokens={templateTokens}
          actions={{
            cancel: t("editor.cancel"),
            save: t("editor.save"),
            bold: t("editor.toolbar.bold"),
            italic: t("editor.toolbar.italic"),
            heading1: t("editor.toolbar.heading1"),
            heading2: t("editor.toolbar.heading2"),
            list: t("editor.toolbar.list"),
            quote: t("editor.toolbar.quote"),
            code: t("editor.toolbar.code"),
            link: t("editor.toolbar.link"),
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
