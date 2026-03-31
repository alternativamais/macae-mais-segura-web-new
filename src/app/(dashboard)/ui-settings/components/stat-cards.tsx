"use client"

import { LayoutPanelTop, Loader2, Palette, Radius, Rows3 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslator } from "@/lib/i18n"
import type { UiSettings } from "@/types/ui-settings"

interface StatCardsProps {
  settings: UiSettings | null
  isLoading: boolean
}

function formatThemeSource(settings: UiSettings | null) {
  if (!settings) return "--"

  if (settings.themeSource === "shadcn") {
    return settings.selectedTheme || "default"
  }

  if (settings.themeSource === "tweakcn") {
    return settings.selectedTweakcnTheme || "--"
  }

  return "imported"
}

export function StatCards({ settings, isLoading }: StatCardsProps) {
  const t = useTranslator("ui_settings.stats")

  const themeSourceValue = settings
    ? settings.themeSource === "imported"
      ? t("values.theme_source.imported")
      : formatThemeSource(settings)
    : "--"

  const themeModeValue = settings
    ? settings.themeMode === "dark"
      ? t("values.theme_mode.dark")
      : t("values.theme_mode.light")
    : "--"

  const shellValue = settings
    ? `${t(`values.sidebar_variant.${settings.sidebarVariant}`)} / ${t(`values.sidebar_collapsible.${settings.sidebarCollapsible}`)}`
    : "--"

  const cards = [
    {
      title: t("cards.theme_source.title"),
      value: themeSourceValue,
      description: t("cards.theme_source.description"),
      icon: Palette,
    },
    {
      title: t("cards.theme_mode.title"),
      value: themeModeValue,
      description: t("cards.theme_mode.description"),
      icon: LayoutPanelTop,
    },
    {
      title: t("cards.radius.title"),
      value: settings?.radius || "--",
      description: t("cards.radius.description"),
      icon: Radius,
    },
    {
      title: t("cards.shell.title"),
      value: shellValue,
      description: t("cards.shell.description"),
      icon: Rows3,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <span className="inline-flex items-center gap-2 text-base text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("loading")}
                </span>
              ) : (
                card.value
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
