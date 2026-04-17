"use client"

import Image from "next/image"
import { Loader2, QrCode, Smartphone, TriangleAlert } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useTranslator } from "@/lib/i18n"
import { WhatsappAccount } from "@/types/email-integration"
import { getWhatsappSessionTag } from "./utils"

interface WhatsappAccountSessionDialogProps {
  account: WhatsappAccount | null
  open: boolean
  isLoading: boolean
  onOpenChange: (open: boolean) => void
}

export function WhatsappAccountSessionDialog({
  account,
  open,
  isLoading,
  onOpenChange,
}: WhatsappAccountSessionDialogProps) {
  const t = useTranslator("email_integrations.whatsapp_accounts.session_dialog")
  const tSession = useTranslator("email_integrations.whatsapp_accounts.session")

  const sessionLabels = {
    disconnected: tSession("disconnected"),
    initializing: tSession("initializing"),
    qr_required: tSession("qr_required"),
    authenticated: tSession("authenticated"),
    ready: tSession("ready"),
    auth_failure: tSession("auth_failure"),
  }

  const status = account?.sessionStatus || "disconnected"
  const hasQr = Boolean(account?.qrCodeDataUrl)
  const lastError = account?.lastError?.trim()

  let body = (
    <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-dashed bg-muted/20 p-6">
      <div className="flex max-w-sm flex-col items-center gap-3 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <div className="space-y-1">
          <p className="font-medium">{t("loading_title")}</p>
          <p className="text-sm text-muted-foreground">{t("loading_description")}</p>
        </div>
      </div>
    </div>
  )

  if (!isLoading && hasQr && account?.qrCodeDataUrl) {
    body = (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/20 px-4 py-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">{t("qr_title")}</p>
            <p className="text-sm text-muted-foreground">{t("qr_description")}</p>
          </div>
          {getWhatsappSessionTag(status, sessionLabels)}
        </div>

        <div className="flex min-h-[320px] items-center justify-center rounded-xl border bg-muted/20 p-6">
          <Image
            src={account.qrCodeDataUrl}
            alt={t("qr_alt")}
            width={280}
            height={280}
            className="rounded-lg border bg-white p-3"
            unoptimized
          />
        </div>
      </div>
    )
  } else if (!isLoading && status === "ready") {
    body = (
      <div className="flex min-h-[320px] items-center justify-center rounded-xl border bg-muted/20 p-6">
        <div className="flex max-w-sm flex-col items-center gap-3 text-center">
          <Smartphone className="h-8 w-8 text-emerald-500" />
          <div className="space-y-1">
            <p className="font-medium">{t("ready_title")}</p>
            <p className="text-sm text-muted-foreground">
              {t("ready_description", { phone: account?.phoneNumber || t("not_informed") })}
            </p>
          </div>
        </div>
      </div>
    )
  } else if (!isLoading && lastError) {
    body = (
      <div className="flex min-h-[320px] items-center justify-center rounded-xl border bg-muted/20 p-6">
        <div className="flex max-w-md flex-col items-center gap-3 text-center">
          <TriangleAlert className="h-8 w-8 text-destructive" />
          <div className="space-y-1">
            <p className="font-medium">{t("error_title")}</p>
            <p className="text-sm text-muted-foreground">{t("error_description")}</p>
          </div>
          <div className="w-full rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-left text-sm text-muted-foreground">
            {lastError}
          </div>
        </div>
      </div>
    )
  } else if (!isLoading) {
    body = (
      <div className="flex min-h-[320px] items-center justify-center rounded-xl border bg-muted/20 p-6">
        <div className="flex max-w-sm flex-col items-center gap-3 text-center">
          <QrCode className="h-8 w-8 text-muted-foreground" />
          <div className="space-y-1">
            <p className="font-medium">{t("waiting_title")}</p>
            <p className="text-sm text-muted-foreground">{t("waiting_description")}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description", { name: account?.name || t("default_name") })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {getWhatsappSessionTag(status, sessionLabels)}
            {account?.displayName ? (
              <span className="text-sm text-muted-foreground">{account.displayName}</span>
            ) : null}
          </div>

          {body}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
