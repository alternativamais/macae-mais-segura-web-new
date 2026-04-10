"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { PaintbrushVertical, RefreshCcw, Save } from "lucide-react"
import { useNotification } from "@/lib/notifications/notification-context"
import { DEFAULT_UI_SETTINGS } from "@/lib/default-ui-settings"
import { ScreenGuard } from "@/components/shared/screen-guard"
import { DataTag } from "@/components/shared/data-tag"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTenantCompanySelection } from "@/hooks/use-tenant-company-selection"
import { useHasPermission } from "@/hooks/use-has-permission"
import { useUiSettings } from "@/contexts/ui-settings-context"
import { uiSettingsService } from "@/services/ui-settings.service"
import type { ImportedTheme } from "@/types/theme-customizer"
import type { UiSettings, UpdateUiSettingsPayload } from "@/types/ui-settings"
import { LayoutSettingsTab } from "./components/layout-settings-tab"
import { StatCards } from "./components/stat-cards"
import { ThemeImportDialog } from "./components/theme-import-dialog"
import { ThemeSettingsTab } from "./components/theme-settings-tab"
import { useTranslator } from "@/lib/i18n"

function toUpdatePayload(settings: UiSettings): UpdateUiSettingsPayload {
  return {
    themeMode: settings.themeMode,
    themeSource: settings.themeSource,
    selectedTheme: settings.selectedTheme ?? null,
    selectedTweakcnTheme: settings.selectedTweakcnTheme ?? null,
    importedTheme: settings.importedTheme ?? null,
    brandColors: settings.brandColors ?? {},
    radius: settings.radius,
    sidebarVariant: settings.sidebarVariant,
    sidebarCollapsible: settings.sidebarCollapsible,
    sidebarSide: settings.sidebarSide,
  }
}

function createDefaultSettings(base?: UiSettings | null): UiSettings {
  return {
    ...DEFAULT_UI_SETTINGS,
    id: base?.id ?? DEFAULT_UI_SETTINGS.id,
    updatedAt: base?.updatedAt ?? DEFAULT_UI_SETTINGS.updatedAt,
    brandColors: {},
  }
}

export default function UiSettingsPage() {
  const notification = useNotification()
  const { hasPermission } = useHasPermission()
  const { settings, isLoading, applySettings } = useUiSettings()
  const {
    companies,
    showCompanySelector,
    defaultCompanyId,
    activeScopedCompanyId,
  } = useTenantCompanySelection()
  const [activeTab, setActiveTab] = useState("theme")
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [savedSettings, setSavedSettings] = useState<UiSettings | null>(null)
  const [draftSettings, setDraftSettings] = useState<UiSettings | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingTargetSettings, setIsLoadingTargetSettings] = useState(false)
  const [targetCompanyId, setTargetCompanyId] = useState<number | null>(
    activeScopedCompanyId ?? defaultCompanyId ?? null,
  )
  const savedSettingsRef = useRef<UiSettings | null>(null)
  const draftSettingsRef = useRef<UiSettings | null>(null)
  const applySettingsRef = useRef(applySettings)
  const entrySettingsRef = useRef<UiSettings | null>(null)

  const canManage = hasPermission("configurar_ui_settings")
  const t = useTranslator("ui_settings")
  const tCompany = useTranslator("company_field")

  useEffect(() => {
    if (!entrySettingsRef.current && settings) {
      entrySettingsRef.current = settings
    }
  }, [settings])

  useEffect(() => {
    if (showCompanySelector) {
      return
    }

    setTargetCompanyId(activeScopedCompanyId ?? defaultCompanyId ?? null)
  }, [activeScopedCompanyId, defaultCompanyId, showCompanySelector])

  const loadTargetSettings = useCallback(
    async (empresaId: number | null) => {
      if (showCompanySelector && !empresaId) {
        setSavedSettings(null)
        setDraftSettings(null)
        return null
      }

      setIsLoadingTargetSettings(true)

      try {
        const currentSettings = await uiSettingsService.getSettings(
          empresaId ?? undefined,
        )
        setSavedSettings(currentSettings)
        setDraftSettings(currentSettings)
        return currentSettings
      } catch {
        setSavedSettings(null)
        setDraftSettings(null)
        return null
      } finally {
        setIsLoadingTargetSettings(false)
      }
    },
    [showCompanySelector],
  )

  useEffect(() => {
    void loadTargetSettings(targetCompanyId)
  }, [loadTargetSettings, targetCompanyId])

  useEffect(() => {
    savedSettingsRef.current = savedSettings
    draftSettingsRef.current = draftSettings
  }, [draftSettings, savedSettings])

  useEffect(() => {
    applySettingsRef.current = applySettings
  }, [applySettings])

  useEffect(() => {
    if (!draftSettings) {
      return
    }

    applySettingsRef.current(draftSettings)
  }, [draftSettings])

  useEffect(() => {
    return () => {
      if (showCompanySelector && entrySettingsRef.current) {
        applySettings(entrySettingsRef.current)
        return
      }

      const saved = savedSettingsRef.current
      const draft = draftSettingsRef.current

      if (!saved || !draft) {
        return
      }

      const hasUnsavedChanges =
        JSON.stringify(toUpdatePayload(saved)) !== JSON.stringify(toUpdatePayload(draft))

      if (hasUnsavedChanges) {
        applySettings(saved)
      }
    }
  }, [applySettings, showCompanySelector])

  const isDirty = useMemo(() => {
    if (!draftSettings || !savedSettings) {
      return false
    }

    return JSON.stringify(toUpdatePayload(draftSettings)) !== JSON.stringify(toUpdatePayload(savedSettings))
  }, [draftSettings, savedSettings])

  const handleDraftChange = (updater: (prev: UiSettings) => UiSettings) => {
    setDraftSettings((current) => (current ? updater(current) : current))
  }

  const handleImportTheme = (theme: ImportedTheme) => {
    handleDraftChange((prev) => ({
      ...prev,
      themeSource: "imported",
      importedTheme: theme,
    }))
  }

  const handleResetToSaved = () => {
    if (!savedSettings) {
      return
    }

    setDraftSettings(savedSettings)
  }

  const handleApplyDefaults = () => {
    const nextDefaults = createDefaultSettings(savedSettings)
    setDraftSettings(nextDefaults)
  }

  const handleSave = async () => {
    if (!draftSettings) {
      return
    }

    setIsSaving(true)

    try {
      const response = await uiSettingsService.updateSettings(
        toUpdatePayload(draftSettings),
        targetCompanyId ?? undefined,
      )
      setSavedSettings(response)
      setDraftSettings(response)
      notification.success(t("notifications.save_success"))
    } catch (error) {
      notification.apiError(error, t("notifications.save_error"))
    } finally {
      setIsSaving(false)
    }
  }

  const handleRetryLoad = () => {
    void loadTargetSettings(targetCompanyId)
  }

  const currentSettings = draftSettings ?? savedSettings
  const isCompanySelectionMissing = showCompanySelector && !targetCompanyId
  const isPageLoading = isLoadingTargetSettings || (isLoading && !currentSettings)

  return (
    <ScreenGuard screenKey="admin.ui_settings">
      <div className="flex flex-col gap-4">
        <div className="@container/main mt-8 px-4 lg:mt-12 lg:px-6">
          <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <h2 className="mb-2 text-3xl font-bold tracking-tight">{t("title")}</h2>
              <p className="text-muted-foreground">
                {t("description")}
              </p>
            </div>

            <div className="flex flex-col gap-3 xl:items-end">
              {showCompanySelector ? (
                <div className="min-w-64 space-y-2">
                  <Label>{tCompany("label")}</Label>
                  <Select
                    value={targetCompanyId ? String(targetCompanyId) : ""}
                    onValueChange={(value) => setTargetCompanyId(Number(value))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={tCompany("placeholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={String(company.id)}>
                          {company.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
              {canManage ? (
                <DataTag tone={isDirty ? "warning" : "success"}>
                  {isDirty ? t("tags.dirty") : t("tags.synced")}
                </DataTag>
              ) : (
                <DataTag tone="neutral">{t("tags.readonly")}</DataTag>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={handleResetToSaved}
                disabled={!savedSettings || isSaving}
              >
                <RefreshCcw className="h-4 w-4" />
                {t("actions.restore")}
              </Button>
              {canManage ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleApplyDefaults}
                    disabled={isSaving || isCompanySelectionMissing}
                  >
                    <PaintbrushVertical className="h-4 w-4" />
                    {t("actions.apply_base")}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSave}
                    disabled={!draftSettings || !isDirty || isSaving}
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? t("actions.saving") : t("actions.save")}
                  </Button>
                </>
              ) : null}
              </div>
            </div>
          </div>

          <StatCards settings={currentSettings} isLoading={isPageLoading} />

          {isCompanySelectionMissing ? (
            <Card className="mt-8">
              <CardContent className="flex min-h-52 flex-col items-center justify-center gap-4 text-center">
                <div className="max-w-md space-y-2">
                  <h3 className="text-lg font-semibold">
                    {tCompany("label")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {tCompany("select_first")}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : currentSettings ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8 w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="theme">{t("tabs.theme")}</TabsTrigger>
                <TabsTrigger value="layout">{t("tabs.layout")}</TabsTrigger>
              </TabsList>

              <TabsContent value="theme" className="mt-4">
                <ThemeSettingsTab
                  settings={currentSettings}
                  canManage={canManage}
                  onChange={handleDraftChange}
                  onOpenImportDialog={() => setImportDialogOpen(true)}
                  onImportTheme={handleImportTheme}
                />
              </TabsContent>

              <TabsContent value="layout" className="mt-4">
                <LayoutSettingsTab
                  settings={currentSettings}
                  canManage={canManage}
                  onChange={handleDraftChange}
                />
              </TabsContent>
            </Tabs>
          ) : !isPageLoading ? (
            <Card className="mt-8">
              <CardContent className="flex min-h-52 flex-col items-center justify-center gap-4 text-center">
                <div className="max-w-md space-y-2">
                  <h3 className="text-lg font-semibold">
                    {t("notifications.load_error_title")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("notifications.load_error_desc")}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRetryLoad}
                >
                  <RefreshCcw className="h-4 w-4" />
                  {t("actions.retry")}
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      <ThemeImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImport={handleImportTheme}
      />
    </ScreenGuard>
  )
}
