"use client"

import { useEffect, useRef, useState } from "react"
import {
  Check,
  Clock3,
  ImagePlus,
  LayoutTemplate,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react"
import { parseISO } from "date-fns"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { empresaService } from "@/services/empresa.service"
import {
  CompanyAsset,
  CompanyAssetDraft,
  CompanyAssetType,
  Empresa,
} from "@/types/empresa"
import { COMPANY_ASSET_PRESETS, COMPANY_ASSET_TYPE_ORDER } from "@/lib/company-assets"
import { useTranslator } from "@/lib/i18n"
import { formatLocalizedDate } from "@/lib/i18n/date"
import { CompanyAssetEditorDialog } from "./company-asset-editor-dialog"
import {
  CompanyDropdownPreview,
  CompanyMapPinPreview,
  CompanySelectorButtonPreview,
} from "./company-branding-preview"

type CompanyAssetCategory = "wide" | "square" | "map"

const COMPANY_ASSET_CATEGORY_ORDER: CompanyAssetCategory[] = [
  "wide",
  "square",
  "map",
]

const COMPANY_ASSET_TYPES_BY_CATEGORY: Record<
  CompanyAssetCategory,
  CompanyAssetType[]
> = {
  wide: ["logo_light", "logo_dark"],
  square: ["logo_square_light", "logo_square_dark"],
  map: ["point_pin", "totem_pin"],
}

const EMPTY_INPUT_REFS = {
  logo_light: null,
  logo_dark: null,
  logo_square_light: null,
  logo_square_dark: null,
  point_pin: null,
  totem_pin: null,
} as Record<CompanyAssetType, HTMLInputElement | null>

interface CompanyAssetsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  company?: Empresa
  draftAssets: Partial<Record<CompanyAssetType, CompanyAssetDraft>>
  onDraftAssetsChange: (
    updater:
      | Partial<Record<CompanyAssetType, CompanyAssetDraft>>
      | ((
          current: Partial<Record<CompanyAssetType, CompanyAssetDraft>>,
        ) => Partial<Record<CompanyAssetType, CompanyAssetDraft>>),
  ) => void
  onCompanyChange?: (company: Empresa) => void
  onCompanyMutated?: () => Promise<void> | void
}

function AssetThumb({
  src,
  assetType,
  alt,
}: {
  src?: string | null
  assetType: CompanyAssetType
  alt: string
}) {
  const variant = COMPANY_ASSET_PRESETS[assetType].variant

  return (
    <div className="flex h-28 items-center justify-center rounded-xl border bg-muted/20 p-4">
      {src ? (
        <img
          src={src}
          alt={alt}
          className={
            variant === "wide"
              ? "max-h-12 max-w-full object-contain"
              : "size-20 object-contain"
          }
        />
      ) : (
        <div className="text-xs text-muted-foreground">{alt}</div>
      )}
    </div>
  )
}

function AssetSystemPreview({
  assetType,
  companyName,
  src,
}: {
  assetType: CompanyAssetType
  companyName: string
  src?: string | null
}) {
  const variant = COMPANY_ASSET_PRESETS[assetType].variant

  if (!src) {
    return null
  }

  if (variant === "wide") {
    return (
      <CompanySelectorButtonPreview
        companyName={companyName}
        logoUrl={src}
        darkMode={assetType === "logo_dark"}
      />
    )
  }

  if (variant === "square") {
    return (
      <CompanyDropdownPreview
        companyName={companyName}
        logoUrl={src}
        darkMode={assetType === "logo_square_dark"}
      />
    )
  }

  return (
    <CompanyMapPinPreview
      companyName={companyName}
      logoUrl={src}
      darkMode
      totem={assetType === "totem_pin"}
    />
  )
}

export function CompanyAssetsDialog({
  open,
  onOpenChange,
  company,
  draftAssets,
  onDraftAssetsChange,
  onCompanyChange,
  onCompanyMutated,
}: CompanyAssetsDialogProps) {
  const t = useTranslator("companies.assets")
  const currentLocale = t.getLocale()
  const inputRefs = useRef({ ...EMPTY_INPUT_REFS })
  const [assets, setAssets] = useState<CompanyAsset[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] =
    useState<CompanyAssetCategory>("wide")
  const [selectedAssetType, setSelectedAssetType] =
    useState<CompanyAssetType>("logo_light")
  const [editorAssetType, setEditorAssetType] =
    useState<CompanyAssetType | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [isMutating, setIsMutating] = useState(false)

  const loadAssets = async () => {
    if (!company?.id) {
      setAssets([])
      return
    }

    setIsLoading(true)
    try {
      setAssets(await empresaService.listAssets(company.id))
    } catch (error) {
      toast.apiError(error, t("notifications.load_error"))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!open) {
      return
    }

    setSelectedCategory("wide")
    setSelectedAssetType("logo_light")
    void loadAssets()
  }, [company?.id, open])

  useEffect(() => {
    const types = COMPANY_ASSET_TYPES_BY_CATEGORY[selectedCategory]
    if (!types.includes(selectedAssetType)) {
      setSelectedAssetType(types[0])
    }
  }, [selectedAssetType, selectedCategory])

  const openFilePicker = (assetType: CompanyAssetType) => {
    inputRefs.current[assetType]?.click()
  }

  const updateDraftAsset = (assetType: CompanyAssetType, file: File) => {
    onDraftAssetsChange((current) => {
      const existingPreview = current[assetType]?.previewUrl
      if (existingPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(existingPreview)
      }

      return {
        ...current,
        [assetType]: {
          assetType,
          file,
          previewUrl: URL.createObjectURL(file),
          fileName: file.name,
        },
      }
    })
  }

  const handleSaveEditor = async (editedFile: File) => {
    if (!editorAssetType) {
      return
    }

    if (!company?.id) {
      updateDraftAsset(editorAssetType, editedFile)
      return
    }

    setIsMutating(true)
    try {
      const response = await empresaService.uploadAsset(
        company.id,
        editorAssetType,
        editedFile,
        true,
      )
      onCompanyChange?.(response.company)
      await loadAssets()
      await onCompanyMutated?.()
      toast.success(t("notifications.upload_success"))
    } catch (error) {
      toast.apiError(error, t("notifications.upload_error"))
    } finally {
      setIsMutating(false)
    }
  }

  const handleActivateAsset = async (asset: CompanyAsset) => {
    if (!company?.id || asset.isActive) {
      return
    }

    setIsMutating(true)
    try {
      const response = await empresaService.activateAsset(company.id, asset.id)
      onCompanyChange?.(response.company)
      await loadAssets()
      await onCompanyMutated?.()
      toast.success(t("notifications.activate_success"))
    } catch (error) {
      toast.apiError(error, t("notifications.activate_error"))
    } finally {
      setIsMutating(false)
    }
  }

  const handleDeleteAsset = async (asset: CompanyAsset) => {
    if (!company?.id || asset.isActive) {
      return
    }

    setIsMutating(true)
    try {
      await empresaService.deleteAsset(company.id, asset.id)
      await loadAssets()
      await onCompanyMutated?.()
      toast.success(t("notifications.delete_success"))
    } catch (error) {
      toast.apiError(error, t("notifications.delete_error"))
    } finally {
      setIsMutating(false)
    }
  }

  const handleRemoveDraftAsset = (assetType: CompanyAssetType) => {
    onDraftAssetsChange((current) => {
      const preview = current[assetType]?.previewUrl
      if (preview?.startsWith("blob:")) {
        URL.revokeObjectURL(preview)
      }

      const nextDrafts = { ...current }
      delete nextDrafts[assetType]
      return nextDrafts
    })
  }

  const history = assets.filter((asset) => asset.assetType === selectedAssetType)
  const activeAsset = history.find((asset) => asset.isActive)
  const draftAsset = draftAssets[selectedAssetType]
  const activePreviewUrl = draftAsset?.previewUrl || activeAsset?.fileUrl || null
  const totalConfigured = COMPANY_ASSET_TYPE_ORDER.filter(
    (assetType) =>
      draftAssets[assetType] ||
      assets.some((asset) => asset.assetType === assetType && asset.isActive),
  ).length

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-7xl">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>
              {company?.id ? t("description_edit") : t("description_create")}
            </DialogDescription>
          </DialogHeader>

          <Card className="gap-0 overflow-hidden py-0">
            <CardHeader className="border-b px-6 py-5">
              <CardTitle className="flex items-center gap-2 text-base">
                <LayoutTemplate className="h-4 w-4 text-primary" />
                {t("workspace_title")}
              </CardTitle>
              <CardDescription>
                {company?.id ? t("helper_live") : t("helper_draft")}
              </CardDescription>
              <CardAction>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {t("configured_count", {
                      count: totalConfigured,
                      total: COMPANY_ASSET_TYPE_ORDER.length,
                    })}
                  </Badge>
                  <Button
                    type="button"
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => openFilePicker(selectedAssetType)}
                    disabled={isMutating}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {t("buttons.add_image")}
                  </Button>
                </div>
              </CardAction>
            </CardHeader>

            <CardContent className="px-0">
              <div className="border-b px-6 py-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">
                      {t("selectors.category_label")}
                    </div>
                    <Select
                      value={selectedCategory}
                      onValueChange={(value) =>
                        setSelectedCategory(value as CompanyAssetCategory)
                      }
                    >
                      <SelectTrigger className="w-full cursor-pointer">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COMPANY_ASSET_CATEGORY_ORDER.map((category) => (
                          <SelectItem key={category} value={category}>
                            {t(`categories.${category}.title`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">
                      {t("selectors.variant_label")}
                    </div>
                    <Select
                      value={selectedAssetType}
                      onValueChange={(value) =>
                        setSelectedAssetType(value as CompanyAssetType)
                      }
                    >
                      <SelectTrigger className="w-full cursor-pointer">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COMPANY_ASSET_TYPES_BY_CATEGORY[selectedCategory].map(
                          (assetType) => {
                            const hasAny =
                              !!draftAssets[assetType] ||
                              assets.some(
                                (asset) => asset.assetType === assetType,
                              )

                            return (
                              <SelectItem key={assetType} value={assetType}>
                                {t(`types.${assetType}.title`)}
                                {hasAny ? " • " + t("selectors.configured") : ""}
                              </SelectItem>
                            )
                          },
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="px-6 py-6">
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_420px]">
                  <div className="space-y-6">
                    <Card className="gap-0 overflow-hidden py-0">
                      <CardHeader className="border-b px-6 py-5">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">
                            {t(`types.${selectedAssetType}.title`)}
                          </CardTitle>
                          <Badge variant="outline">
                            {t(`types.${selectedAssetType}.format`)}
                          </Badge>
                          {draftAsset ? <Badge>{t("draft_badge")}</Badge> : null}
                        </div>
                        <CardDescription>
                          {t(`types.${selectedAssetType}.description`)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-5 px-6 py-6">
                        {activePreviewUrl ? (
                          <>
                            <AssetSystemPreview
                              assetType={selectedAssetType}
                              companyName={company?.nome || "Empresa Exemplo"}
                              src={activePreviewUrl}
                            />
                            <Separator />
                          </>
                        ) : null}

                        <div className="grid gap-4 md:grid-cols-[280px_minmax(0,1fr)]">
                          <div className="space-y-3">
                            <div className="text-sm font-medium">
                              {t("current_image")}
                            </div>
                            <AssetThumb
                              src={activePreviewUrl}
                              assetType={selectedAssetType}
                              alt={t("no_image")}
                            />
                          </div>
                          <div className="space-y-3 rounded-xl border bg-muted/10 p-4">
                            <div className="text-sm font-medium">
                              {t("current_context_title")}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {t(`types.${selectedAssetType}.description`)}
                            </p>
                            {draftAsset ? (
                              <div className="flex items-center justify-between rounded-lg border bg-background px-3 py-2 text-xs">
                                <span className="truncate">
                                  {draftAsset.fileName}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 cursor-pointer"
                                  onClick={() =>
                                    handleRemoveDraftAsset(selectedAssetType)
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="rounded-lg border bg-background px-3 py-3 text-sm text-muted-foreground">
                                {activeAsset
                                  ? t("active_ready")
                                  : t("empty_current")}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="gap-0 overflow-hidden py-0">
                    <CardHeader className="border-b px-6 py-5">
                      <CardTitle className="text-base">{t("history")}</CardTitle>
                      <CardDescription>
                        {company?.id
                          ? t("history_description")
                          : t("history_after_create")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-0 py-0">
                      {company?.id ? (
                        history.length > 0 ? (
                          <ScrollArea className="h-[34rem]">
                            <div className="space-y-3 p-4">
                              {history.map((asset) => (
                                <div
                                  key={asset.id}
                                  className="rounded-2xl border bg-muted/10 p-4 transition-colors hover:border-primary/30"
                                >
                                  <div className="space-y-4">
                                    <AssetThumb
                                      src={asset.fileUrl}
                                      assetType={selectedAssetType}
                                      alt={t("history_item")}
                                    />

                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Clock3 className="h-3.5 w-3.5" />
                                        {formatLocalizedDate(
                                          parseISO(asset.createdAt),
                                          currentLocale,
                                        )}
                                      </div>
                                      <div className="truncate text-sm text-muted-foreground">
                                        {asset.originalFileName ||
                                          t("unknown_file")}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      {asset.isActive ? (
                                        <Badge>
                                          <Check className="mr-1 h-3 w-3" />
                                          {t("active_badge")}
                                        </Badge>
                                      ) : (
                                        <>
                                          <Button
                                            type="button"
                                            size="sm"
                                            className="cursor-pointer"
                                            onClick={() =>
                                              handleActivateAsset(asset)
                                            }
                                            disabled={isMutating}
                                          >
                                            {t("buttons.use_now")}
                                          </Button>
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            className="cursor-pointer"
                                            onClick={() =>
                                              handleDeleteAsset(asset)
                                            }
                                            disabled={isMutating}
                                          >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            {t("buttons.delete")}
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        ) : (
                          <div className="flex h-[34rem] flex-col items-center justify-center gap-3 p-8 text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border bg-muted/20">
                              <ImagePlus className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="space-y-1">
                              <div className="font-medium">
                                {t("empty_history_title")}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {t("empty_history")}
                              </div>
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="flex h-[34rem] flex-col items-center justify-center gap-3 p-8 text-center">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border bg-muted/20">
                            <ImagePlus className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="space-y-1">
                            <div className="font-medium">{t("draft_mode_title")}</div>
                            <div className="text-sm text-muted-foreground">
                              {t("history_after_create")}
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>

          {(isLoading || isMutating) ? (
            <div className="flex items-center justify-center gap-2 rounded-xl border bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {isLoading ? t("loading") : t("saving")}
            </div>
          ) : null}

          {COMPANY_ASSET_TYPE_ORDER.map((assetType) => (
            <input
              key={assetType}
              ref={(node) => {
                inputRefs.current[assetType] = node
              }}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.currentTarget.value = ""
                if (!file) {
                  return
                }
                setEditorAssetType(assetType)
                setSelectedFile(file)
                setIsEditorOpen(true)
              }}
            />
          ))}
        </DialogContent>
      </Dialog>

      <CompanyAssetEditorDialog
        open={isEditorOpen}
        onOpenChange={(nextOpen) => {
          setIsEditorOpen(nextOpen)
          if (!nextOpen) {
            setSelectedFile(null)
            setEditorAssetType(null)
          }
        }}
        assetType={editorAssetType}
        file={selectedFile}
        companyName={company?.nome || "Empresa Exemplo"}
        onSave={handleSaveEditor}
      />
    </>
  )
}
