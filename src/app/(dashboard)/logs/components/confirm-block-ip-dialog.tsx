"use client"

import { useState, useCallback } from "react"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { accessControlService } from "@/services/access-control.service"
import { useTranslator } from "@/lib/i18n"

interface ConfirmBlockIpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ip: string | null
}

export function ConfirmBlockIpDialog({
  open,
  onOpenChange,
  ip,
}: ConfirmBlockIpDialogProps) {
  const [isBlocking, setIsBlocking] = useState(false)
  const t = useTranslator("logs.block_ip_dialog")

  const handleBlock = useCallback(async () => {
    if (!ip) return

    setIsBlocking(true)
    try {
      await accessControlService.createIpBlock({
        mode: "single",
        value: ip,
        label: t("default_label"),
        description: t("default_desc", { ip }),
        active: true,
      })
      toast.success(t("success", { ip }))
      onOpenChange(false)
    } catch (error) {
      toast.apiError(error, t("error"))
    } finally {
      setIsBlocking(false)
    }
  }, [ip, onOpenChange, t])

  return (
    <ConfirmDialog
      isOpen={open}
      onOpenChange={onOpenChange}
      title={t("title")}
      description={t("desc", { ip: ip || "" })}
      confirmText={t("button_block")}
      cancelText={t("button_cancel")}
      variant="destructive"
      onConfirm={handleBlock}
      isLoading={isBlocking}
    />
  )
}
