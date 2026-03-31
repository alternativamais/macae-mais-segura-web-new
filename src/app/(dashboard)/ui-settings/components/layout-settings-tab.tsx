"use client"

import { Columns2, Dock, PanelLeft, PanelRight, Sidebar } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  sidebarCollapsibleOptions,
  sidebarSideOptions,
  sidebarVariants,
} from "@/config/theme-customizer-constants"
import type { UiSettings } from "@/types/ui-settings"
import { SelectionCard } from "./selection-card"
import { useTranslator } from "@/lib/i18n"

interface LayoutSettingsTabProps {
  settings: UiSettings
  canManage: boolean
  onChange: (updater: (prev: UiSettings) => UiSettings) => void
}

const variantIcons = {
  sidebar: Sidebar,
  floating: Dock,
  inset: Columns2,
}

const sideIcons = {
  left: PanelLeft,
  right: PanelRight,
}

export function LayoutSettingsTab({
  settings,
  canManage,
  onChange,
}: LayoutSettingsTabProps) {
  const t = useTranslator("ui_settings.layout")

  const sidebarVariantLabels: Record<string, { title: string; description: string }> = {
    sidebar: {
      title: t("options.sidebar_variant.sidebar.title"),
      description: t("options.sidebar_variant.sidebar.description"),
    },
    floating: {
      title: t("options.sidebar_variant.floating.title"),
      description: t("options.sidebar_variant.floating.description"),
    },
    inset: {
      title: t("options.sidebar_variant.inset.title"),
      description: t("options.sidebar_variant.inset.description"),
    },
  }

  const sidebarBehaviorLabels: Record<string, { title: string; description: string }> = {
    offcanvas: {
      title: t("options.sidebar_collapsible.offcanvas.title"),
      description: t("options.sidebar_collapsible.offcanvas.description"),
    },
    icon: {
      title: t("options.sidebar_collapsible.icon.title"),
      description: t("options.sidebar_collapsible.icon.description"),
    },
    none: {
      title: t("options.sidebar_collapsible.none.title"),
      description: t("options.sidebar_collapsible.none.description"),
    },
  }

  const sidebarSideLabels: Record<string, string> = {
    left: t("options.sidebar_side.left"),
    right: t("options.sidebar_side.right"),
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("sidebar_structure_title")}</CardTitle>
          <CardDescription>
            {t("sidebar_structure_desc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {sidebarVariants.map((variant) => (
              <SelectionCard
                key={variant.value}
                title={sidebarVariantLabels[variant.value]?.title ?? variant.name}
                description={sidebarVariantLabels[variant.value]?.description ?? variant.description}
                icon={variantIcons[variant.value]}
                selected={settings.sidebarVariant === variant.value}
                disabled={!canManage}
                onClick={() =>
                  onChange((prev) => ({
                    ...prev,
                    sidebarVariant: variant.value,
                  }))
                }
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t("sidebar_behavior_title")}</CardTitle>
            <CardDescription>
              {t("sidebar_behavior_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              {sidebarCollapsibleOptions.map((option) => (
                <SelectionCard
                  key={option.value}
                  title={sidebarBehaviorLabels[option.value]?.title ?? option.name}
                  description={sidebarBehaviorLabels[option.value]?.description ?? option.description}
                  selected={settings.sidebarCollapsible === option.value}
                  disabled={!canManage}
                  onClick={() =>
                    onChange((prev) => ({
                      ...prev,
                      sidebarCollapsible: option.value,
                    }))
                  }
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("sidebar_side_title")}</CardTitle>
            <CardDescription>
              {t("sidebar_side_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {sidebarSideOptions.map((side) => (
                <SelectionCard
                  key={side.value}
                  title={sidebarSideLabels[side.value] ?? side.name}
                  icon={sideIcons[side.value]}
                  selected={settings.sidebarSide === side.value}
                  disabled={!canManage}
                  onClick={() =>
                    onChange((prev) => ({
                      ...prev,
                      sidebarSide: side.value,
                    }))
                  }
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
