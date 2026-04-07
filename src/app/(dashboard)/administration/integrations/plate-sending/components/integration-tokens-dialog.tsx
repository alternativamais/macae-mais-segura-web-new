"use client"

import { useCallback, useEffect, useState } from "react"
import { Copy, KeyRound, Loader2, Trash2 } from "lucide-react"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { useTranslator } from "@/lib/i18n"
import { formatLocalizedDateTime } from "@/lib/i18n/date"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { integrationService } from "@/services/integration.service"
import { Integration, IntegrationCameraBinding, IntegrationTokenSummary } from "@/types/integration"

interface IntegrationTokensDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  integration: Integration
  binding: IntegrationCameraBinding | null
  canManage: boolean
  onSuccess: () => Promise<void> | void
}

export function IntegrationTokensDialog({
  open,
  onOpenChange,
  integration,
  binding,
  canManage,
  onSuccess,
}: IntegrationTokensDialogProps) {
  const t = useTranslator("plate_sending")
  const currentLocale = t.getLocale()
  const [tokens, setTokens] = useState<IntegrationTokenSummary[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [revokingTokenId, setRevokingTokenId] = useState<number | null>(null)
  const [generatedToken, setGeneratedToken] = useState("")

  const loadTokens = useCallback(async () => {
    if (!binding) return

    setIsLoading(true)

    try {
      const response = await integrationService.listTokens(integration.code, binding.cameraId)
      setTokens(response)
    } catch (error) {
      setTokens([])
      toast.apiError(error, t("tokens.notifications.load_error"))
    } finally {
      setIsLoading(false)
    }
  }, [binding, integration.code, t])

  useEffect(() => {
    if (!open || !binding) return
    void loadTokens()
  }, [binding, loadTokens, open])

  useEffect(() => {
    if (open) return

    setGeneratedToken("")
    setTokens([])
    setIsLoading(false)
    setIsGenerating(false)
    setRevokingTokenId(null)
  }, [open])

  const copyToClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(t("tokens.notifications.copy_success"))
    } catch {
      toast.error(t("tokens.notifications.copy_error"))
    }
  }

  const handleGenerate = async () => {
    if (!binding) return

    setIsGenerating(true)

    try {
      const response = await integrationService.generateToken(
        integration.code,
        binding.cameraId,
      )
      setGeneratedToken(response.token)
      toast.success(t("tokens.notifications.generate_success"))
      await loadTokens()
      await onSuccess()
    } catch (error) {
      toast.apiError(error, t("tokens.notifications.generate_error"))
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRevoke = async (tokenId: number) => {
    if (!binding) return

    setRevokingTokenId(tokenId)

    try {
      await integrationService.revokeToken(
        integration.code,
        binding.cameraId,
        tokenId,
      )
      toast.success(t("tokens.notifications.revoke_success"))
      await loadTokens()
      await onSuccess()
    } catch (error) {
      toast.apiError(error, t("tokens.notifications.revoke_error"))
    } finally {
      setRevokingTokenId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[88vh] flex-col overflow-hidden sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{t("tokens.title")}</DialogTitle>
          <DialogDescription>
            {t("tokens.description", {
              camera:
                binding?.camera?.nome ||
                t("management.camera_name_fallback", { id: binding?.cameraId || 0 }),
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
          {generatedToken ? (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-emerald-400">{t("tokens.generated_title")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("tokens.generated_description")}
                  </p>
                  <code className="mt-3 block overflow-x-auto rounded-md border bg-background/60 px-3 py-2 font-mono text-xs">
                    {generatedToken}
                  </code>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => void copyToClipboard(generatedToken)}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  {t("tokens.copy")}
                </Button>
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {t("tokens.active_count", {
                count: tokens.filter((token) => !token.revoked).length,
              })}
            </p>

            {canManage ? (
              <Button
                type="button"
                className="cursor-pointer"
                onClick={() => void handleGenerate()}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <KeyRound className="mr-2 h-4 w-4" />
                )}
                {t("tokens.generate")}
              </Button>
            ) : null}
          </div>

          <div className="min-h-0 overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("tokens.columns.token")}</TableHead>
                  <TableHead>{t("tokens.columns.status")}</TableHead>
                  <TableHead>{t("tokens.columns.created_at")}</TableHead>
                  <TableHead className="w-[120px] text-right">
                    {t("tokens.columns.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokens.length > 0 ? (
                  tokens.map((token) => {
                    const tokenValue = token.token || token.tokenPreview || t("shared.not_informed")

                    return (
                      <TableRow key={token.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="max-w-[320px] truncate rounded bg-muted px-2 py-1 font-mono text-xs">
                              {tokenValue}
                            </code>
                            {!token.revoked && token.token ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 cursor-pointer"
                                onClick={() => void copyToClipboard(token.token!)}
                              >
                                <Copy className="h-4 w-4" />
                                <span className="sr-only">{t("tokens.copy")}</span>
                              </Button>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={token.revoked ? "destructive" : "default"}>
                            {token.revoked
                              ? t("tokens.status.revoked")
                              : t("tokens.status.active")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {token.createdAt
                            ? formatLocalizedDateTime(new Date(token.createdAt), currentLocale)
                            : t("shared.not_informed")}
                        </TableCell>
                        <TableCell className="text-right">
                          {!token.revoked && canManage ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="cursor-pointer text-destructive hover:text-destructive"
                              disabled={revokingTokenId === token.id}
                              onClick={() => void handleRevoke(token.id)}
                            >
                              {revokingTokenId === token.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="mr-2 h-4 w-4" />
                              )}
                              {t("tokens.revoke")}
                            </Button>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                      {isLoading ? t("loading") : t("tokens.empty")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            onClick={() => onOpenChange(false)}
          >
            {t("tokens.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
