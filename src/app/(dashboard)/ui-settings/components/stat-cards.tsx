"use client"

import { LayoutPanelTop, Palette, Radius, Rows3 } from "lucide-react"
import { SummaryStatCards } from "@/components/shared/summary-stat-cards"
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
    <SummaryStatCards
      items={cards.map((card) => ({
        ...card,
        loading: isLoading,
        valueClassName: "text-sm md:text-2xl",
      }))}
      className="grid-cols-2 xl:grid-cols-4"
      loadingLabel={t("loading")}
    />
  )
}
