"use client"

import { useEffect, useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { CheckCircle2, Copy, KeyRound, Loader2, Wifi, XCircle } from "lucide-react"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { Badge } from "@/components/ui/badge"
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
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useHasPermission } from "@/hooks/use-has-permission"
import { useTenantCompanySelection } from "@/hooks/use-tenant-company-selection"
import { useTranslator } from "@/lib/i18n"
import { cameraService } from "@/services/camera.service"
import { pontoService } from "@/services/ponto.service"
import { totemService } from "@/services/totem.service"
import { Camera, CameraLprTokenSummary } from "@/types/camera"
import { Ponto } from "@/types/ponto"
import { Totem } from "@/types/totem"

function createCameraFormSchema(messages: {
  nameMin: string
  ipRequired: string
  userRequired: string
  locationRequired: string
  companyRequired: string
}, requireCompanySelection: boolean) {
  return z
    .object({
      nome: z.string().trim().min(2, messages.nameMin),
      marca: z.string().trim().optional(),
      status: z.enum(["active", "inactive"]),
      ip: z.string().trim().min(1, messages.ipRequired),
      usuario: z.string().trim().min(1, messages.userRequired),
      senha: z.string().optional(),
      rtspScheme: z.string(),
      rtspPort: z.number(),
      rtspPath: z.string().trim().optional(),
      cameraType: z.enum(["normal", "lpr"]),
      generateLprToken: z.boolean(),
      destino: z.enum(["ponto", "totem"]),
      pontoId: z.string().optional(),
      totemId: z.string().optional(),
      empresaId: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (requireCompanySelection && !data.empresaId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["empresaId"],
          message: messages.companyRequired,
        })
      }

      const isPointSelected = data.destino === "ponto" && !!data.pontoId
      const isTotemSelected = data.destino === "totem" && !!data.totemId

      if (isPointSelected || isTotemSelected) return

      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [data.destino === "ponto" ? "pontoId" : "totemId"],
        message: messages.locationRequired,
      })
    })
}

type CameraFormValues = z.infer<ReturnType<typeof createCameraFormSchema>>

interface CameraFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void | Promise<void>
  camera?: Camera | null
}

type ConnectionTestState = "idle" | "success" | "error"

export function CameraFormDialog({
  open,
  onOpenChange,
  onSuccess,
  camera,
}: CameraFormDialogProps) {
  const t = useTranslator("cameras.form")
  const tTable = useTranslator("cameras")
  const tCompany = useTranslator("company_field")
  const { hasPermission } = useHasPermission()
  const [pontos, setPontos] = useState<Ponto[]>([])
  const [totens, setTotens] = useState<Totem[]>([])
  const [isLoadingDependencies, setIsLoadingDependencies] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testState, setTestState] = useState<ConnectionTestState>("idle")
  const [openSection, setOpenSection] = useState("identification")
  const [lprTokens, setLprTokens] = useState<CameraLprTokenSummary[]>([])
  const [isLoadingLprTokens, setIsLoadingLprTokens] = useState(false)
  const [isGeneratingLprToken, setIsGeneratingLprToken] = useState(false)
  const [revokingTokenId, setRevokingTokenId] = useState<number | null>(null)
  const [generatedToken, setGeneratedToken] = useState<string | null>(null)
  const [generatedTokenMessage, setGeneratedTokenMessage] = useState<string | null>(null)
  const [isCreateCompleted, setIsCreateCompleted] = useState(false)
  const { companies, showCompanySelector, defaultCompanyId } =
    useTenantCompanySelection()

  const isEdit = !!camera
  const notInformed = tTable("shared.not_informed")
  const canReadLprTokens = hasPermission("listar_integracoes")
  const canManageLprTokens = hasPermission("configurar_integracao")

  const nameMinMessage = t("validations.name_min")
  const ipRequiredMessage = t("validations.ip_required")
  const userRequiredMessage = t("validations.user_required")
  const locationRequiredMessage = t("validations.location_required")
  const loadDependenciesErrorMessage = t("notifications.load_dependencies_error")
  const createSuccessMessage = t("notifications.create_success")
  const updateSuccessMessage = t("notifications.update_success")
  const createErrorMessage = t("notifications.create_error")
  const updateErrorMessage = t("notifications.update_error")
  const testMissingIpMessage = t("notifications.test_missing_ip")
  const testSuccessMessage = t("notifications.test_success")
  const testErrorMessage = t("notifications.test_error")

  const cameraFormSchema = useMemo(
    () =>
      createCameraFormSchema(
        {
          nameMin: nameMinMessage,
          ipRequired: ipRequiredMessage,
          userRequired: userRequiredMessage,
          locationRequired: locationRequiredMessage,
          companyRequired: tCompany("required"),
        },
        showCompanySelector && !isEdit,
      ),
    [
      ipRequiredMessage,
      isEdit,
      locationRequiredMessage,
      nameMinMessage,
      showCompanySelector,
      tCompany,
      userRequiredMessage,
    ],
  )

  const form = useForm<CameraFormValues>({
    resolver: zodResolver(cameraFormSchema),
    defaultValues: {
      nome: "",
      marca: "",
      status: "active",
      ip: "",
      usuario: "",
      senha: "",
      rtspScheme: "rtsp",
      rtspPort: 554,
      rtspPath: "",
      cameraType: "normal",
      generateLprToken: true,
      destino: "ponto",
      pontoId: "",
      totemId: "",
      empresaId: defaultCompanyId ? String(defaultCompanyId) : "",
    },
  })

  const destination = form.watch("destino")
  const hasIp = !!form.watch("ip")?.trim()
  const rawCompanyId = form.watch("empresaId")
  const selectedCameraType = form.watch("cameraType")
  const selectedCompanyId =
    rawCompanyId && rawCompanyId.trim()
      ? Number(rawCompanyId)
      : defaultCompanyId ?? null
  const brandOptions = [
    { value: "Hikvision", label: "Hikvision" },
    { value: "Intelbras", label: "Intelbras" },
    { value: "Dahua", label: "Dahua" },
    { value: "Axis", label: "Axis" },
    { value: "Generico", label: t("options.brand_generic") },
  ]

  useEffect(() => {
    if (!open) return
    setTestState("idle")
    setOpenSection("identification")
    setGeneratedToken(null)
    setGeneratedTokenMessage(null)
    setIsCreateCompleted(false)
    form.reset({
      nome: camera?.nome || "",
      marca: camera?.marca || "",
      status: camera?.status === "inactive" ? "inactive" : "active",
      ip: camera?.ip || "",
      usuario: camera?.usuario || "",
      senha: "",
      rtspScheme: camera?.rtspScheme || "rtsp",
      rtspPort: camera?.rtspPort || 554,
      rtspPath: camera?.rtspPath || "",
      cameraType: camera?.cameraType === "lpr" ? "lpr" : "normal",
      generateLprToken: !camera,
      destino: camera?.totemId ? "totem" : "ponto",
      pontoId: camera?.pontoId ? String(camera.pontoId) : "",
      totemId: camera?.totemId ? String(camera.totemId) : "",
      empresaId:
        typeof camera?.empresaId === "number"
          ? String(camera.empresaId)
          : defaultCompanyId
            ? String(defaultCompanyId)
            : "",
    })
  }, [camera, defaultCompanyId, form, open])

  useEffect(() => {
    if (!open) return

    if (showCompanySelector && !selectedCompanyId) {
      setPontos([])
      setTotens([])
      return
    }

    async function loadDependencies() {
      setIsLoadingDependencies(true)

      try {
        const params =
          showCompanySelector && selectedCompanyId
            ? { empresaId: selectedCompanyId }
            : undefined
        if (destination === "totem") {
          const totemsData = await totemService.findAllNoPagination(params)
          setTotens(Array.isArray(totemsData) ? totemsData : [])
          return
        }

        const pointsData = await pontoService.findAllNoPagination(params)
        setPontos(Array.isArray(pointsData) ? pointsData : [])
      } catch (error) {
        toast.apiError(error, loadDependenciesErrorMessage)
        if (destination === "totem") {
          setTotens([])
        } else {
          setPontos([])
        }
      } finally {
        setIsLoadingDependencies(false)
      }
    }

    void loadDependencies()
  }, [
    destination,
    loadDependenciesErrorMessage,
    open,
    selectedCompanyId,
    showCompanySelector,
  ])

  useEffect(() => {
    if (!open || !camera?.id || camera.cameraType !== "lpr" || !canReadLprTokens) {
      setLprTokens([])
      return
    }

    let active = true

    const loadTokens = async () => {
      setIsLoadingLprTokens(true)
      try {
        const response = await cameraService.listLprTokens(camera.id)
        if (!active) return
        setLprTokens(response)
      } catch (error) {
        if (!active) return
        setLprTokens([])
        toast.apiError(error, t("notifications.load_lpr_tokens_error"))
      } finally {
        if (active) {
          setIsLoadingLprTokens(false)
        }
      }
    }

    void loadTokens()

    return () => {
      active = false
    }
  }, [camera?.cameraType, camera?.id, canReadLprTokens, open, t])

  useEffect(() => {
    if (open) return

    setLprTokens([])
    setIsLoadingLprTokens(false)
    setIsGeneratingLprToken(false)
    setRevokingTokenId(null)
  }, [open])

  const handleTestConnection = async () => {
    const ip = form.getValues("ip")?.trim()

    if (!ip) {
      toast.warning(testMissingIpMessage)
      return
    }

    setIsTesting(true)
    setTestState("idle")

    try {
      const result = await cameraService.testConnection({
        ip,
        usuario: form.getValues("usuario")?.trim() || undefined,
        senha: form.getValues("senha") || undefined,
        marca: form.getValues("marca")?.trim() || undefined,
      })

      if (result.success) {
        setTestState("success")

        if (result.pathDiscovered) {
          form.setValue("rtspPath", result.pathDiscovered, {
            shouldDirty: true,
          })
          toast.success(
            t("notifications.test_success_with_path", {
              path: result.pathDiscovered,
            })
          )
        } else {
          toast.success(testSuccessMessage)
        }

        return
      }

      setTestState("error")
      toast.error(result.error || testErrorMessage)
    } catch (error) {
      setTestState("error")
      toast.apiError(error, testErrorMessage)
    } finally {
      setIsTesting(false)
    }
  }

  const onSubmit = async (values: CameraFormValues) => {
    setIsSubmitting(true)

    try {
      const empresaId =
        showCompanySelector && selectedCompanyId
          ? selectedCompanyId
          : undefined
      const payload = {
        nome: values.nome.trim(),
        marca: values.marca?.trim() || undefined,
        status: values.status,
        ip: values.ip.trim(),
        usuario: values.usuario.trim(),
        senha: values.senha || undefined,
        rtspScheme: values.rtspScheme,
        rtspPort: values.rtspPort,
        rtspPath: values.rtspPath?.trim() || undefined,
        cameraType: values.cameraType,
        generateLprToken: values.cameraType === "lpr" ? values.generateLprToken : false,
        pontoId:
          values.destino === "ponto" && values.pontoId
            ? Number(values.pontoId)
            : undefined,
        totemId:
          values.destino === "totem" && values.totemId
            ? Number(values.totemId)
            : undefined,
        ...(empresaId ? { empresaId } : {}),
      }

      if (isEdit && !payload.senha) {
        delete (payload as { senha?: string }).senha
      }

      if (isEdit && camera) {
        const response = await cameraService.update(camera.id, payload)
        if (response.generatedLprToken) {
          setGeneratedToken(response.generatedLprToken)
          setGeneratedTokenMessage(t("notifications.token_generated_on_save"))
          if (canReadLprTokens) {
            const tokens = await cameraService.listLprTokens(camera.id)
            setLprTokens(tokens)
          }
        }
        toast.success(updateSuccessMessage)
      } else {
        const response = await cameraService.create(payload)
        if (response.generatedLprToken) {
          setGeneratedToken(response.generatedLprToken)
          setGeneratedTokenMessage(t("notifications.token_generated_on_create"))
          setIsCreateCompleted(true)
          toast.success(createSuccessMessage)
          await onSuccess()
          return
        }
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

  const copyToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token)
      toast.success(t("notifications.copy_lpr_token_success"))
    } catch {
      toast.error(t("notifications.copy_lpr_token_error"))
    }
  }

  const handleGenerateLprToken = async () => {
    if (!camera?.id) return

    setIsGeneratingLprToken(true)
    try {
      const response = await cameraService.generateLprToken(camera.id)
      setGeneratedToken(response.token)
      setGeneratedTokenMessage(response.message)
      if (canReadLprTokens) {
        const tokens = await cameraService.listLprTokens(camera.id)
        setLprTokens(tokens)
      }
      toast.success(t("notifications.generate_lpr_token_success"))
      await onSuccess()
    } catch (error) {
      toast.apiError(error, t("notifications.generate_lpr_token_error"))
    } finally {
      setIsGeneratingLprToken(false)
    }
  }

  const handleRevokeLprToken = async (tokenId: number) => {
    if (!camera?.id) return

    setRevokingTokenId(tokenId)
    try {
      await cameraService.revokeLprToken(camera.id, tokenId)
      const tokens = await cameraService.listLprTokens(camera.id)
      setLprTokens(tokens)
      toast.success(t("notifications.revoke_lpr_token_success"))
      await onSuccess()
    } catch (error) {
      toast.apiError(error, t("notifications.revoke_lpr_token_error"))
    } finally {
      setRevokingTokenId(null)
    }
  }

  if (isCreateCompleted && generatedToken) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t("token_dialog.title")}</DialogTitle>
            <DialogDescription>{t("token_dialog.description")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
              <p className="text-sm text-muted-foreground">{generatedTokenMessage}</p>
              <code className="mt-3 block overflow-x-auto rounded-md border bg-background/60 px-3 py-2 font-mono text-xs">
                {generatedToken}
              </code>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={() => void copyToken(generatedToken)}
            >
              <Copy className="mr-2 h-4 w-4" />
              {t("token_dialog.copy")}
            </Button>
            <Button type="button" className="cursor-pointer" onClick={() => onOpenChange(false)}>
              {t("token_dialog.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {showCompanySelector ? (
              <TenantCompanyFormField
                control={form.control}
                companies={companies}
                disabled={isEdit}
                description={isEdit ? tCompany("edit_locked") : undefined}
              />
            ) : null}

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
                        name="marca"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("labels.brand")}</FormLabel>
                            <Select value={field.value || ""} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger className="w-full cursor-pointer">
                                  <SelectValue placeholder={t("placeholders.brand")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {brandOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
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
                        name="cameraType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("labels.camera_type")}</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger className="w-full cursor-pointer">
                                  <SelectValue placeholder={t("placeholders.camera_type")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="normal">{t("options.camera_type_normal")}</SelectItem>
                                <SelectItem value="lpr">{t("options.camera_type_lpr")}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>{t("descriptions.camera_type")}</FormDescription>
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
                                <SelectItem value="active">{tTable("table.status_active")}</SelectItem>
                                <SelectItem value="inactive">{tTable("table.status_inactive")}</SelectItem>
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
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="usuario"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("labels.user")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("placeholders.user")} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid items-start gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="senha"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {isEdit ? t("labels.password_edit") : t("labels.password")}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder={t("placeholders.password")}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="cursor-pointer"
                        disabled={isTesting || !hasIp}
                        onClick={handleTestConnection}
                      >
                        {isTesting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : testState === "success" ? (
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                        ) : testState === "error" ? (
                          <XCircle className="mr-2 h-4 w-4" />
                        ) : (
                          <Wifi className="mr-2 h-4 w-4" />
                        )}
                        {isTesting
                          ? t("test_button.testing")
                          : testState === "success"
                            ? t("test_button.success")
                            : testState === "error"
                              ? t("test_button.error")
                              : t("test_button.idle")}
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        {t("descriptions.test_connection")}
                      </p>
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
                              onValueChange={field.onChange}
                              className="grid gap-3 md:grid-cols-2"
                            >
                              <div className="flex items-center gap-3 rounded-lg border p-4">
                                <RadioGroupItem value="ponto" id="camera-destino-ponto" />
                                <label
                                  htmlFor="camera-destino-ponto"
                                  className="cursor-pointer text-sm font-medium"
                                >
                                  {t("labels.ponto")}
                                </label>
                              </div>
                              <div className="flex items-center gap-3 rounded-lg border p-4">
                                <RadioGroupItem value="totem" id="camera-destino-totem" />
                                <label
                                  htmlFor="camera-destino-totem"
                                  className="cursor-pointer text-sm font-medium"
                                >
                                  {t("labels.totem")}
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
                              <FormLabel>{t("labels.ponto")}</FormLabel>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger
                                    className="w-full cursor-pointer"
                                    disabled={isLoadingDependencies || (showCompanySelector && !selectedCompanyId)}
                                  >
                                    <SelectValue
                                      placeholder={
                                        isLoadingDependencies
                                          ? t("placeholders.loading")
                                          : t("placeholders.ponto")
                                      }
                                    />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {pontos.map((point) => (
                                    <SelectItem key={point.id} value={String(point.id)}>
                                      {point.nome}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
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
                                    disabled={isLoadingDependencies || (showCompanySelector && !selectedCompanyId)}
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
                                  {totens.map((totem) => (
                                    <SelectItem key={totem.id} value={String(totem.id)}>
                                      {totem.numero}
                                      {totem.ponto?.nome ? ` - ${totem.ponto.nome}` : ""}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="advanced" className="px-4">
                <AccordionTrigger className="cursor-pointer py-4 hover:no-underline">
                  <div className="space-y-1">
                    <div>{t("sections.advanced")}</div>
                    <div className="text-xs font-normal text-muted-foreground">
                      {t("sections.advanced_desc")}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  <div className="space-y-4 pb-4">
                    <div className="grid items-start gap-4 md:grid-cols-3">
                      <FormField
                        control={form.control}
                        name="rtspScheme"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("labels.rtsp_scheme")}</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger className="w-full cursor-pointer">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="rtsp">RTSP</SelectItem>
                                <SelectItem value="http">HTTP</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="rtspPort"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("labels.rtsp_port")}</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                inputMode="numeric"
                                value={field.value}
                                onChange={(event) =>
                                  field.onChange(Number(event.target.value) || 554)
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="rtspPath"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("labels.rtsp_path")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("placeholders.rtsp_path")} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {selectedCameraType === "lpr" || (isEdit && camera?.cameraType === "lpr") ? (
                <AccordionItem value="lpr" className="px-4">
                  <AccordionTrigger className="cursor-pointer py-4 hover:no-underline">
                    <div className="space-y-1">
                      <div>{t("sections.lpr")}</div>
                      <div className="text-xs font-normal text-muted-foreground">
                        {t("sections.lpr_desc")}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-0">
                    <div className="space-y-4 pb-4">
                      {generatedToken ? (
                        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-emerald-500">
                                {t("labels.active_generated_token")}
                              </p>
                              <p className="text-sm text-muted-foreground">{generatedTokenMessage}</p>
                              <code className="mt-3 block overflow-x-auto rounded-md border bg-background/60 px-3 py-2 font-mono text-xs">
                                {generatedToken}
                              </code>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              className="cursor-pointer"
                              onClick={() => void copyToken(generatedToken)}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              {t("actions.copy_token")}
                            </Button>
                          </div>
                        </div>
                      ) : null}

                      {!isEdit ? (
                        <FormField
                          control={form.control}
                          name="generateLprToken"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border bg-card p-4">
                              <div className="space-y-1">
                                <FormLabel>{t("labels.generate_lpr_token")}</FormLabel>
                                <FormDescription>{t("descriptions.generate_lpr_token")}</FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      ) : selectedCameraType !== "lpr" && camera?.cameraType === "lpr" ? (
                        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-muted-foreground">
                          {t("descriptions.disable_lpr_warning")}
                        </div>
                      ) : camera?.cameraType === "lpr" ? (
                        <>
                          <div className="flex items-center justify-between rounded-lg border bg-card p-4">
                            <div className="space-y-1">
                              <p className="text-sm font-medium">{t("labels.lpr_tokens")}</p>
                              <p className="text-sm text-muted-foreground">
                                {t("descriptions.lpr_tokens")}
                              </p>
                            </div>
                            {canManageLprTokens ? (
                              <Button
                                type="button"
                                className="cursor-pointer"
                                disabled={isGeneratingLprToken}
                                onClick={() => void handleGenerateLprToken()}
                              >
                                {isGeneratingLprToken ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <KeyRound className="mr-2 h-4 w-4" />
                                )}
                                {t("actions.generate_token")}
                              </Button>
                            ) : null}
                          </div>

                          <div className="space-y-2 rounded-lg border bg-card p-4">
                            {isLoadingLprTokens ? (
                              <p className="text-sm text-muted-foreground">{t("placeholders.loading")}</p>
                            ) : lprTokens.length > 0 ? (
                              lprTokens.map((token) => (
                                <div
                                  key={token.id}
                                  className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-3 md:flex-row md:items-center md:justify-between"
                                >
                                  <div className="min-w-0 space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <Badge variant={token.revoked ? "destructive" : "default"}>
                                        {token.revoked
                                          ? t("status.token_revoked")
                                          : t("status.token_active")}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        {token.createdAt || notInformed}
                                      </span>
                                    </div>
                                    <code className="block overflow-x-auto rounded bg-background px-2 py-1 font-mono text-xs">
                                      {token.token || token.tokenPreview || notInformed}
                                    </code>
                                  </div>

                                  <div className="flex flex-wrap gap-2">
                                    {!token.revoked && token.token ? (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        className="cursor-pointer"
                                        onClick={() => void copyToken(token.token!)}
                                      >
                                        <Copy className="mr-2 h-4 w-4" />
                                        {t("actions.copy_token")}
                                      </Button>
                                    ) : null}
                                    {!token.revoked && canManageLprTokens ? (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        className="cursor-pointer text-destructive hover:text-destructive"
                                        disabled={revokingTokenId === token.id}
                                        onClick={() => void handleRevokeLprToken(token.id)}
                                      >
                                        {revokingTokenId === token.id ? (
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : null}
                                        {t("actions.revoke_token")}
                                      </Button>
                                    ) : null}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-muted-foreground">{t("empty.lpr_tokens")}</p>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-muted-foreground">
                          {t("descriptions.save_before_manage_lpr")}
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ) : null}
            </Accordion>

            <DialogFooter className="pt-2">
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
