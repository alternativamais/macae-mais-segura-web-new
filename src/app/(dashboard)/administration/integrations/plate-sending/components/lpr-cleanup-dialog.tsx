"use client"

import { useEffect, useState } from "react"
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

interface LprCleanupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: { olderThan?: string; quantity?: number }) => Promise<void> | void
  isSubmitting?: boolean
}

export function LprCleanupDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: LprCleanupDialogProps) {
  const t = useTranslator("plate_sending")
  const [olderThan, setOlderThan] = useState("")
  const [quantity, setQuantity] = useState("")

  useEffect(() => {
    if (!open) return
    setOlderThan("")
    setQuantity("")
  }, [open])

  const handleSubmit = async () => {
    await onSubmit({
      olderThan: olderThan || undefined,
      quantity: quantity.trim() ? Number(quantity) : undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("lpr.cleanup.title")}</DialogTitle>
          <DialogDescription>{t("lpr.cleanup.description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lpr-older-than">{t("lpr.cleanup.fields.older_than")}</Label>
            <Input
              id="lpr-older-than"
              type="datetime-local"
              value={olderThan}
              onChange={(event) => setOlderThan(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lpr-quantity">{t("lpr.cleanup.fields.quantity")}</Label>
            <Input
              id="lpr-quantity"
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              placeholder={t("lpr.cleanup.placeholders.quantity")}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("lpr.cleanup.actions.cancel")}
          </Button>
          <Button type="button" variant="destructive" onClick={() => void handleSubmit()} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {t("lpr.cleanup.actions.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
