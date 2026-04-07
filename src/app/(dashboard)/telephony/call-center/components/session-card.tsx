"use client"

import { useMemo, useState } from "react"
import { Loader2, LogOut, Phone, ShieldCheck } from "lucide-react"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTranslator } from "@/lib/i18n"
import { callCenterService } from "@/services/call-center.service"
import { CallCenterAgentSession } from "@/types/call-center"
import { CallCenterExtension } from "@/types/call-center-extension"

interface SessionCardProps {
  session: CallCenterAgentSession | null
  extensions: CallCenterExtension[]
  canManageSession: boolean
  isLoading: boolean
  onSessionChange: (session: CallCenterAgentSession | null) => void
}

export function SessionCard({
  session,
  extensions,
  canManageSession,
  isLoading,
  onSessionChange,
}: SessionCardProps) {
  const t = useTranslator("call_center.session")
  const [selectedExtension, setSelectedExtension] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const availableExtensions = useMemo(
    () => extensions.filter((item) => item.type === "operator" && item.status === "active"),
    [extensions],
  )

  const handleLogin = async () => {
    if (!selectedExtension) return
    setIsSubmitting(true)
    try {
      const nextSession = await callCenterService.activateAgentSession(selectedExtension)
      onSessionChange(nextSession)
      toast.success(t("notifications.login_success"))
      setSelectedExtension("")
    } catch (error) {
      toast.apiError(error, t("notifications.login_error"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = async () => {
    setIsSubmitting(true)
    try {
      const nextSession = await callCenterService.logoutAgentSession()
      onSessionChange(nextSession)
      toast.success(t("notifications.logout_success"))
    } catch (error) {
      toast.apiError(error, t("notifications.logout_error"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {session?.isActive ? (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ShieldCheck className="h-4 w-4 text-primary" />
                {t("active")}
              </div>
              <div className="mt-3 space-y-1">
                <div className="text-base font-semibold">
                  {session.extension?.numeroRamal || t("not_informed")}
                </div>
                <div className="text-sm text-muted-foreground">
                  {session.extension?.descricao || session.extension?.queueName || t("not_informed")}
                </div>
              </div>
            </div>

            {canManageSession ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleLogout}
                disabled={isSubmitting}
                className="w-full cursor-pointer"
              >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                {t("buttons.logout")}
              </Button>
            ) : null}
          </div>
        ) : canManageSession ? (
          <div className="space-y-4">
            <Select value={selectedExtension} onValueChange={setSelectedExtension} disabled={isLoading || isSubmitting}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("select_placeholder")} />
              </SelectTrigger>
              <SelectContent>
                {availableExtensions.map((extension) => (
                  <SelectItem key={extension.id} value={extension.numeroRamal}>
                    {extension.numeroRamal} - {extension.descricao || extension.queueName || t("not_informed")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              type="button"
              onClick={handleLogin}
              disabled={!selectedExtension || isSubmitting}
              className="w-full cursor-pointer"
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Phone className="mr-2 h-4 w-4" />}
              {t("buttons.login")}
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
            {t("permission_hint")}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
