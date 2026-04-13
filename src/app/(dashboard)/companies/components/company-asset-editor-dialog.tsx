"use client"

import { useEffect, useRef, useState } from "react"
import { Crop, Loader2, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { useTranslator } from "@/lib/i18n"
import { COMPANY_ASSET_PRESETS } from "@/lib/company-assets"
import { CompanyAssetType } from "@/types/empresa"
import {
  CompanyDropdownPreview,
  CompanyMapPinPreview,
  CompanySelectorButtonPreview,
} from "./company-branding-preview"

function getCanvasMetrics(image: HTMLImageElement, width: number, height: number) {
  const baseScale = Math.max(width / image.naturalWidth, height / image.naturalHeight)
  return {
    baseScale,
    overflowX: image.naturalWidth * baseScale - width,
    overflowY: image.naturalHeight * baseScale - height,
  }
}

function drawImageWithTransform({
  context,
  image,
  width,
  height,
  zoom,
  panX,
  panY,
}: {
  context: CanvasRenderingContext2D
  image: HTMLImageElement
  width: number
  height: number
  zoom: number
  panX: number
  panY: number
}) {
  const { baseScale, overflowX, overflowY } = getCanvasMetrics(image, width, height)
  const scale = baseScale * zoom
  const scaledWidth = image.naturalWidth * scale
  const scaledHeight = image.naturalHeight * scale
  const extraOverflowX = Math.max(0, scaledWidth - width)
  const extraOverflowY = Math.max(0, scaledHeight - height)

  const offsetX = -(extraOverflowX / 2) + (extraOverflowX / 2) * panX
  const offsetY = -(extraOverflowY / 2) + (extraOverflowY / 2) * panY

  context.clearRect(0, 0, width, height)
  context.drawImage(image, offsetX, offsetY, scaledWidth, scaledHeight)
}

interface CompanyAssetEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assetType: CompanyAssetType | null
  file: File | null
  companyName: string
  onSave: (file: File) => Promise<void> | void
}

export function CompanyAssetEditorDialog({
  open,
  onOpenChange,
  assetType,
  file,
  companyName,
  onSave,
}: CompanyAssetEditorDialogProps) {
  const t = useTranslator("companies.asset_editor")
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [sourceUrl, setSourceUrl] = useState<string | null>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [zoom, setZoom] = useState([100])
  const [panX, setPanX] = useState([0])
  const [panY, setPanY] = useState([0])
  const [previewTheme, setPreviewTheme] = useState<"light" | "dark">("dark")
  const [isSaving, setIsSaving] = useState(false)

  const preset = assetType ? COMPANY_ASSET_PRESETS[assetType] : null
  const previewWidth = preset?.variant === "wide" ? 640 : 420
  const previewHeight = preset ? Math.round(previewWidth / preset.aspectRatio) : 240

  useEffect(() => {
    if (!file || !open) {
      setSourceUrl(null)
      setImage(null)
      return
    }

    const nextUrl = URL.createObjectURL(file)
    const nextImage = new Image()

    nextImage.onload = () => {
      setImage(nextImage)
    }

    nextImage.src = nextUrl
    setSourceUrl(nextUrl)
    setZoom([100])
    setPanX([0])
    setPanY([0])

    return () => {
      URL.revokeObjectURL(nextUrl)
    }
  }, [file, open])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !image || !preset) {
      return
    }

    canvas.width = previewWidth
    canvas.height = previewHeight

    const context = canvas.getContext("2d")
    if (!context) {
      return
    }

    drawImageWithTransform({
      context,
      image,
      width: previewWidth,
      height: previewHeight,
      zoom: zoom[0] / 100,
      panX: panX[0] / 100,
      panY: panY[0] / 100,
    })
  }, [image, panX, panY, preset, previewHeight, previewWidth, zoom])

  const handleSave = async () => {
    if (!assetType || !file || !image || !preset) {
      return
    }

    const exportCanvas = document.createElement("canvas")
    exportCanvas.width = preset.outputWidth
    exportCanvas.height = preset.outputHeight

    const context = exportCanvas.getContext("2d")
    if (!context) {
      return
    }

    drawImageWithTransform({
      context,
      image,
      width: preset.outputWidth,
      height: preset.outputHeight,
      zoom: zoom[0] / 100,
      panX: panX[0] / 100,
      panY: panY[0] / 100,
    })

    setIsSaving(true)

    try {
      const blob = await new Promise<Blob | null>((resolve) => {
        exportCanvas.toBlob(resolve, "image/png")
      })

      if (!blob) {
        throw new Error("blob_generation_failed")
      }

      const nextFile = new File(
        [blob],
        `${file.name.replace(/\.[^.]+$/, "")}-${assetType}.png`,
        {
          type: "image/png",
        },
      )

      await onSave(nextFile)
      onOpenChange(false)
    } finally {
      setIsSaving(false)
    }
  }

  const previewSrc = sourceUrl

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_360px]">
          <div className="space-y-4">
            <div className="rounded-xl border bg-muted/20 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                <Crop className="h-4 w-4" />
                {t("crop_area")}
              </div>
              <div className="overflow-hidden rounded-xl border bg-background">
                <canvas
                  ref={canvasRef}
                  className="h-auto w-full object-contain"
                  style={{ aspectRatio: `${previewWidth} / ${previewHeight}` }}
                />
              </div>
            </div>

            <div className="grid gap-4 rounded-xl border bg-muted/10 p-4 sm:grid-cols-3">
              <div className="space-y-2">
                <div className="text-sm font-medium">{t("controls.zoom")}</div>
                <Slider
                  value={zoom}
                  onValueChange={setZoom}
                  min={100}
                  max={300}
                  step={1}
                />
                <div className="text-xs text-muted-foreground">{zoom[0]}%</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">{t("controls.horizontal")}</div>
                <Slider
                  value={panX}
                  onValueChange={setPanX}
                  min={-100}
                  max={100}
                  step={1}
                />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">{t("controls.vertical")}</div>
                <Slider
                  value={panY}
                  onValueChange={setPanY}
                  min={-100}
                  max={100}
                  step={1}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border bg-muted/10 p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-medium">{t("preview.title")}</div>
                  <div className="text-xs text-muted-foreground">
                    {t("preview.description")}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={previewTheme === "light" ? "default" : "outline"}
                    onClick={() => setPreviewTheme("light")}
                    className="cursor-pointer"
                  >
                    <Sun className="mr-2 h-4 w-4" />
                    {t("preview.light")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={previewTheme === "dark" ? "default" : "outline"}
                    onClick={() => setPreviewTheme("dark")}
                    className="cursor-pointer"
                  >
                    <Moon className="mr-2 h-4 w-4" />
                    {t("preview.dark")}
                  </Button>
                </div>
              </div>
            </div>

            {preset?.variant === "wide" ? (
              <CompanySelectorButtonPreview
                companyName={companyName}
                logoUrl={previewSrc}
                darkMode={previewTheme === "dark"}
              />
            ) : null}

            {preset?.variant === "square" ? (
              <CompanyDropdownPreview
                companyName={companyName}
                logoUrl={previewSrc}
                darkMode={previewTheme === "dark"}
              />
            ) : null}

            {preset?.variant === "pin" ? (
              <CompanyMapPinPreview
                companyName={companyName}
                logoUrl={previewSrc}
                darkMode={previewTheme === "dark"}
                totem={assetType === "totem_pin"}
              />
            ) : null}

            <div className="rounded-xl border bg-muted/10 p-4 text-sm text-muted-foreground">
              {t("output_size", {
                width: preset?.outputWidth ?? 0,
                height: preset?.outputHeight ?? 0,
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="cursor-pointer"
            disabled={isSaving}
          >
            {t("buttons.cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="cursor-pointer"
            disabled={!file || !assetType || isSaving}
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSaving ? t("buttons.saving") : t("buttons.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
