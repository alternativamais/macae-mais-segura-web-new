"use client"

import * as React from "react"
import { useNotification } from "@/lib/notifications/notification-context"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import type { ImportedTheme } from "@/types/theme-customizer"
import { useTranslator } from "@/lib/i18n"

interface ThemeImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (theme: ImportedTheme) => void
}

export function ThemeImportDialog({
  open,
  onOpenChange,
  onImport,
}: ThemeImportDialogProps) {
  const notification = useNotification()
  const [importText, setImportText] = React.useState("")
  const t = useTranslator("ui_settings.import_dialog")

  const parseImportedTheme = (cssText: string): ImportedTheme => {
    const sanitizedCss = cssText.replace(/\/\*[\s\S]*?\*\//g, "")
    const light: Record<string, string> = {}
    const dark: Record<string, string> = {}

    const rootMatch = sanitizedCss.match(/:root\s*\{([^}]+)\}/)
    const darkMatch = sanitizedCss.match(/\.dark\s*\{([^}]+)\}/)

    if (!rootMatch || !darkMatch) {
      throw new Error(t("error_blocks"))
    }

    const extractVariables = (
      source: string,
      target: Record<string, string>,
    ) => {
      const variableMatches = source.matchAll(/--([^:]+):\s*([^;]+);/g)
      for (const match of variableMatches) {
        const [, variable, value] = match
        target[variable.trim()] = value.trim()
      }
    }

    extractVariables(rootMatch[1], light)
    extractVariables(darkMatch[1], dark)

    if (!Object.keys(light).length || !Object.keys(dark).length) {
      throw new Error(t("error_vars"))
    }

    return { light, dark }
  }

  const handleClose = (nextOpen: boolean) => {
    onOpenChange(nextOpen)
    if (!nextOpen) {
      setImportText("")
    }
  }

  const handleImport = () => {
    try {
      const importedTheme = parseImportedTheme(importText)
      onImport(importedTheme)
      notification.success(t("success_msg"))
      handleClose(false)
    } catch (error) {
      notification.apiError(error, t("error_msg"))
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Textarea
            value={importText}
            onChange={(event) => setImportText(event.target.value)}
            placeholder={`:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 210 40% 98%;
}`}
            className="min-h-72 font-mono text-xs"
          />
          <p className="text-xs leading-5 text-muted-foreground">
            {t("hint")}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            {t("button_cancel")}
          </Button>
          <Button onClick={handleImport} disabled={!importText.trim()}>
            {t("button_import")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
