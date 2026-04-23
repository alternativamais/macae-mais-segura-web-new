"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useTranslator } from "@/lib/i18n"
import { useState } from "react"
import { notificationService as toast } from "@/lib/notifications/notification-service"

interface JsonEditorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  initialValue: string
  onSave: (value: string) => void
}

export function JsonEditorModal({
  open,
  onOpenChange,
  title,
  description,
  initialValue,
  onSave,
}: JsonEditorModalProps) {
  if (!open) {
    return null
  }

  return (
    <OpenJsonEditorModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      initialValue={initialValue}
      onSave={onSave}
    />
  )
}

function OpenJsonEditorModal({
  open,
  onOpenChange,
  title,
  description,
  initialValue,
  onSave,
}: JsonEditorModalProps) {
  const t = useTranslator("plate_sending")
  const [value, setValue] = useState(() => initialValue)

  const handleSave = () => {
    try {
      // Validate JSON structure
      if (value.trim()) {
        JSON.parse(value)
      }
      onSave(value)
      onOpenChange(false)
    } catch {
      toast.error(t("studio.cameras.notifications.mapping_invalid"))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="py-4">
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="min-h-[400px] font-mono text-xs"
            spellCheck={false}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("management.form.cancel")}
          </Button>
          <Button onClick={handleSave}>{t("management.form.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
