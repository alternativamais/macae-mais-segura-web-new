"use client"

import { useEffect, useRef, useState } from "react"
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Info,
  ShieldAlert,
  TriangleAlert,
  X,
  type LucideIcon,
} from "lucide-react"
import { DataTag } from "@/components/shared/data-tag"
import { Button } from "@/components/ui/button"
import { copyText } from "@/lib/copy-text"
import { cn } from "@/lib/utils"
import { NotificationAction } from "@/lib/notifications/types"

export type ActionNotificationVariant =
  | "success"
  | "error"
  | "warning"
  | "info"
  | "permission-error"
  | "loading"

interface ActionNotificationProps {
  variant: ActionNotificationVariant
  title: string
  description?: string
  actions?: NotificationAction[]
  requiredPermissions?: string[]
  copyValue?: string
  onDismiss?: () => void
}

const variantMap: Record<
  ActionNotificationVariant,
  {
    icon: LucideIcon
    iconClassName: string
    iconWrapperClassName: string
  }
> = {
  success: {
    icon: CheckCircle2,
    iconClassName: "text-emerald-600 dark:text-emerald-400",
    iconWrapperClassName: "bg-emerald-100 dark:bg-emerald-500/10",
  },
  error: {
    icon: AlertCircle,
    iconClassName: "text-rose-600 dark:text-rose-400",
    iconWrapperClassName: "bg-rose-100 dark:bg-rose-500/10",
  },
  warning: {
    icon: TriangleAlert,
    iconClassName: "text-amber-600 dark:text-amber-400",
    iconWrapperClassName: "bg-amber-100 dark:bg-amber-500/10",
  },
  info: {
    icon: Info,
    iconClassName: "text-sky-600 dark:text-sky-400",
    iconWrapperClassName: "bg-sky-100 dark:bg-sky-500/10",
  },
  "permission-error": {
    icon: ShieldAlert,
    iconClassName: "text-violet-600 dark:text-violet-400",
    iconWrapperClassName: "bg-violet-100 dark:bg-violet-500/10",
  },
  loading: {
    icon: Info,
    iconClassName: "text-slate-600 dark:text-slate-300",
    iconWrapperClassName: "bg-slate-100 dark:bg-slate-500/10",
  },
}

export function ActionNotification({
  variant,
  title,
  description,
  actions,
  requiredPermissions,
  copyValue,
  onDismiss,
}: ActionNotificationProps) {
  const [copied, setCopied] = useState(false)
  const resetCopyTimeoutRef = useRef<number | null>(null)
  const Icon = variantMap[variant].icon

  useEffect(() => {
    return () => {
      if (resetCopyTimeoutRef.current) {
        window.clearTimeout(resetCopyTimeoutRef.current)
      }
    }
  }, [])

  const handleCopy = async () => {
    if (!copyValue) return

    try {
      await copyText(copyValue)
      setCopied(true)

      if (resetCopyTimeoutRef.current) {
        window.clearTimeout(resetCopyTimeoutRef.current)
      }

      resetCopyTimeoutRef.current = window.setTimeout(() => {
        setCopied(false)
      }, 2200)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="w-[min(420px,calc(100vw-32px))] rounded-lg border bg-popover text-popover-foreground shadow-lg">
      <div className="flex gap-3 p-4">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
            variantMap[variant].iconWrapperClassName
          )}
        >
          <Icon className={cn("h-5 w-5", variantMap[variant].iconClassName)} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold">{title}</div>
              {description ? (
                <div className="mt-1 text-[13px] leading-5 text-muted-foreground">
                  {description}
                </div>
              ) : null}
            </div>

            {onDismiss ? (
              <button
                type="button"
                onClick={onDismiss}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Fechar notificação</span>
              </button>
            ) : null}
          </div>

          {requiredPermissions?.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {requiredPermissions.map((permission) => (
                <DataTag key={permission} tone="neutral">
                  {permission}
                </DataTag>
              ))}
            </div>
          ) : null}

          {actions?.length || copyValue ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {actions?.map((action) => (
                <Button
                  key={action.label}
                  type="button"
                  size="sm"
                  variant={action.variant || "default"}
                  className="h-8 cursor-pointer"
                  onClick={() => {
                    void action.onClick()
                  }}
                >
                  {action.label}
                </Button>
              ))}

              {copyValue ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className={cn(
                    "h-8 cursor-pointer transition-all duration-200",
                    copied &&
                      "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
                  )}
                  onClick={() => {
                    void handleCopy()
                  }}
                >
                  {copied ? (
                    <Check className="mr-2 h-3.5 w-3.5 scale-110 transition-transform duration-200" />
                  ) : (
                    <Copy className="mr-2 h-3.5 w-3.5 transition-transform duration-200" />
                  )}
                  {copied
                    ? "Permissão copiada"
                    : requiredPermissions && requiredPermissions.length > 1
                      ? "Copiar permissões"
                      : "Copiar permissão"}
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
