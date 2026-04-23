"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslator } from "@/lib/i18n"
import { LprDetection } from "@/types/lpr-detection"

interface LprDetectionFormDialogProps {
  detection: LprDetection | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: { plateText: string; confidence?: number }) => Promise<void> | void
  isSubmitting?: boolean
}

export function LprDetectionFormDialog({
  detection,
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: LprDetectionFormDialogProps) {
  if (!open) {
    return null
  }

  return (
    <OpenLprDetectionFormDialog
      detection={detection}
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
    />
  )
}

function OpenLprDetectionFormDialog({
  detection,
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: LprDetectionFormDialogProps) {
  const t = useTranslator("plate_sending")
  const [plateText, setPlateText] = useState(() => detection?.plateText || "")
  const [confidence, setConfidence] = useState(() =>
    typeof detection?.confidence === "number" ? String(detection.confidence) : "",
  )

  const handleSubmit = async () => {
    await onSubmit({
      plateText: plateText.trim(),
      confidence: confidence.trim() ? Number(confidence) : undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("lpr.form.title")}</DialogTitle>
          <DialogDescription>{t("lpr.form.description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lpr-plate">{t("lpr.form.fields.plate")}</Label>
            <Input
              id="lpr-plate"
              value={plateText}
              onChange={(event) => setPlateText(event.target.value.toUpperCase())}
              placeholder={t("lpr.form.placeholders.plate")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lpr-confidence">{t("lpr.form.fields.confidence")}</Label>
            <Input
              id="lpr-confidence"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={confidence}
              onChange={(event) => setConfidence(event.target.value)}
              placeholder={t("lpr.form.placeholders.confidence")}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("lpr.form.actions.cancel")}
          </Button>
          <Button type="button" onClick={() => void handleSubmit()} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {t("lpr.form.actions.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
