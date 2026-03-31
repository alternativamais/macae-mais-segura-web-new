"use client"

import {
  Download,
  Moon,
  Palette,
  PaintBucket,
  Sun,
  WandSparkles,
} from "lucide-react"
import { ColorPicker } from "@/components/color-picker"
import { DataTag } from "@/components/shared/data-tag"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { baseColors, radiusOptions } from "@/config/theme-customizer-constants"
import { colorThemes, tweakcnThemes } from "@/config/theme-data"
import { useTranslator } from "@/lib/i18n"
import type { ImportedTheme } from "@/types/theme-customizer"
import type { UiSettings, UiThemeMode, UiThemeSource } from "@/types/ui-settings"
import { SelectionCard } from "./selection-card"

interface ThemeSettingsTabProps {
  settings: UiSettings
  canManage: boolean
  onChange: (updater: (prev: UiSettings) => UiSettings) => void
  onOpenImportDialog: () => void
  onImportTheme: (theme: ImportedTheme) => void
}

export function ThemeSettingsTab({
  settings,
  canManage,
  onChange,
  onOpenImportDialog,
  onImportTheme,
}: ThemeSettingsTabProps) {
  const t = useTranslator("ui_settings.theme")

  const colorLabelMap: Record<string, string> = {
    "--primary": t("overrides.colors.primary"),
    "--primary-foreground": t("overrides.colors.primary_foreground"),
    "--secondary": t("overrides.colors.secondary"),
    "--secondary-foreground": t("overrides.colors.secondary_foreground"),
    "--accent": t("overrides.colors.accent"),
    "--accent-foreground": t("overrides.colors.accent_foreground"),
    "--muted": t("overrides.colors.muted"),
    "--muted-foreground": t("overrides.colors.muted_foreground"),
  }

  const themeSourceOptions: Array<{
    value: UiThemeSource
    title: string
    description: string
    icon: React.ComponentType<{ className?: string }>
  }> = [
    {
      value: "shadcn",
      title: t("sources.shadcn.title"),
      description: t("sources.shadcn.description"),
      icon: Palette,
    },
    {
      value: "tweakcn",
      title: t("sources.tweakcn.title"),
      description: t("sources.tweakcn.description"),
      icon: WandSparkles,
    },
    {
      value: "imported",
      title: t("sources.imported.title"),
      description: t("sources.imported.description"),
      icon: Download,
    },
  ]

  const importedLightCount = Object.keys(settings.importedTheme?.light ?? {}).length
  const importedDarkCount = Object.keys(settings.importedTheme?.dark ?? {}).length

  const handleModeChange = (mode: UiThemeMode) => {
    onChange((prev) => ({
      ...prev,
      themeMode: mode,
    }))
  }

  const handleThemeSourceChange = (themeSource: UiThemeSource) => {
    onChange((prev) => ({
      ...prev,
      themeSource,
      selectedTheme:
        themeSource === "shadcn"
          ? prev.selectedTheme || "default"
          : prev.selectedTheme,
      selectedTweakcnTheme:
        themeSource === "tweakcn"
          ? prev.selectedTweakcnTheme || tweakcnThemes[0]?.value || ""
          : prev.selectedTweakcnTheme,
    }))
  }

  const handleBrandColorChange = (cssVar: string, value: string) => {
    onChange((prev) => ({
      ...prev,
      brandColors: {
        ...(prev.brandColors ?? {}),
        [cssVar]: value,
      },
    }))
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t("sources_title")}</CardTitle>
            <CardDescription>
              {t("sources_description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              {themeSourceOptions.map((option) => (
                <SelectionCard
                  key={option.value}
                  title={option.title}
                  description={option.description}
                  icon={option.icon}
                  selected={settings.themeSource === option.value}
                  disabled={!canManage}
                  onClick={() => {
                    if (option.value === "imported" && !settings.importedTheme) {
                      onOpenImportDialog()
                      return
                    }

                    handleThemeSourceChange(option.value)
                  }}
                />
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t("modes.label")}</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={settings.themeMode === "light" ? "default" : "outline"}
                    disabled={!canManage}
                    onClick={() => handleModeChange("light")}
                    className="justify-start"
                  >
                    <Sun className="h-4 w-4" />
                    {t("modes.light")}
                  </Button>
                  <Button
                    type="button"
                    variant={settings.themeMode === "dark" ? "default" : "outline"}
                    disabled={!canManage}
                    onClick={() => handleModeChange("dark")}
                    className="justify-start"
                  >
                    <Moon className="h-4 w-4" />
                    {t("modes.dark")}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">{t("radius.label")}</Label>
                <Select
                  value={settings.radius}
                  onValueChange={(radius) =>
                    onChange((prev) => ({ ...prev, radius }))
                  }
                  disabled={!canManage}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("radius.placeholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {radiusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.name} rem
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t("presets.shadcn_label")}</Label>
                <Select
                  value={settings.selectedTheme || "default"}
                  onValueChange={(selectedTheme) =>
                    onChange((prev) => ({
                      ...prev,
                      themeSource: "shadcn",
                      selectedTheme,
                    }))
                  }
                  disabled={!canManage || settings.themeSource !== "shadcn"}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("presets.shadcn_placeholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {colorThemes.map((theme) => (
                      <SelectItem key={theme.value} value={theme.value}>
                        {theme.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">{t("presets.tweakcn_label")}</Label>
                <Select
                  value={settings.selectedTweakcnTheme || tweakcnThemes[0]?.value || ""}
                  onValueChange={(selectedTweakcnTheme) =>
                    onChange((prev) => ({
                      ...prev,
                      themeSource: "tweakcn",
                      selectedTweakcnTheme,
                    }))
                  }
                  disabled={!canManage || settings.themeSource !== "tweakcn"}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("presets.tweakcn_placeholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {tweakcnThemes.map((theme) => (
                      <SelectItem key={theme.value} value={theme.value}>
                        {theme.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("imported_section.title")}</CardTitle>
            <CardDescription>
              {t("imported_section.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <DataTag tone={settings.themeSource === "imported" ? "accent" : "neutral"}>
                {settings.themeSource === "imported"
                  ? t("imported_section.active")
                  : t("imported_section.inactive")}
              </DataTag>
              <DataTag tone="info">
                {t("imported_section.vars_count", {
                  count: importedLightCount,
                  mode: t("modes.light"),
                })}
              </DataTag>
              <DataTag tone="info">
                {t("imported_section.vars_count", {
                  count: importedDarkCount,
                  mode: t("modes.dark"),
                })}
              </DataTag>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={onOpenImportDialog}
              disabled={!canManage}
              className="w-full justify-start"
            >
              <Download className="h-4 w-4" />
              {t("imported_section.import_button")}
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (settings.importedTheme) {
                  onImportTheme(settings.importedTheme)
                }
              }}
              disabled={!canManage || !settings.importedTheme}
              className="w-full justify-start"
            >
              <PaintBucket className="h-4 w-4" />
              {t("imported_section.activate_button")}
            </Button>

            <p className="text-xs leading-5 text-muted-foreground">
              {t("imported_section.hint_1")}
            </p>
            <p className="text-xs leading-5 text-muted-foreground">
              {t("imported_section.hint_2")}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("overrides.title")}</CardTitle>
          <CardDescription>
            {t("overrides.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {baseColors.map((color) => (
              <ColorPicker
                key={color.cssVar}
                label={colorLabelMap[color.cssVar] ?? color.name}
                cssVar={color.cssVar}
                value={settings.brandColors?.[color.cssVar] ?? ""}
                onChange={handleBrandColorChange}
                disabled={!canManage}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
