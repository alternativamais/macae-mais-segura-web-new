"use client"

import * as React from "react"
import { colorThemes, tweakcnThemes } from "@/config/theme-data"
import { baseColors } from "@/config/theme-customizer-constants"
import { useSidebarConfig } from "@/hooks/use-sidebar-config"
import { useThemeManager } from "@/hooks/use-theme-manager"
import { DEFAULT_UI_SETTINGS } from "@/lib/default-ui-settings"
import { uiSettingsService } from "@/services/ui-settings.service"
import { useAuthStore } from "@/store/auth-store"
import { UiSettings } from "@/types/ui-settings"

interface UiSettingsContextValue {
  settings: UiSettings | null
  isLoading: boolean
  applySettings: (settings: UiSettings) => void
  reloadSettings: (empresaId?: number) => Promise<UiSettings | null>
}

const UiSettingsContext = React.createContext<UiSettingsContextValue | null>(null)

function normalizeThemeMode(mode: UiSettings["themeMode"]) {
  return mode === "dark" ? "dark" : "light"
}

function normalizeScopedCompanyId(value: string | number | null) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string" && value.trim() && value !== "ALL") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

export function UiSettingsProvider({ children }: { children: React.ReactNode }) {
  const { config: sidebarConfig, updateConfig } = useSidebarConfig()
  const userThemeModePreference = useAuthStore(
    (state) => state.user?.themeModePreference ?? null,
  )
  const activeCompanyId = useAuthStore((state) => state.activeCompanyId)
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const token = useAuthStore((state) => state.token)
  const {
    setTheme,
    resetTheme,
    applyTheme,
    applyTweakcnTheme,
    applyImportedTheme,
    applyRadius,
    handleColorChange,
  } = useThemeManager()
  const [settings, setSettings] = React.useState<UiSettings | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const sidebarConfigRef = React.useRef(sidebarConfig)
  const userThemeModePreferenceRef = React.useRef(userThemeModePreference)
  const reloadPromiseRef = React.useRef<{
    key: string
    promise: Promise<UiSettings | null>
  } | null>(null)
  const activeScopedCompanyId = React.useMemo(
    () => normalizeScopedCompanyId(activeCompanyId),
    [activeCompanyId],
  )

  React.useEffect(() => {
    sidebarConfigRef.current = sidebarConfig
  }, [sidebarConfig])

  React.useEffect(() => {
    userThemeModePreferenceRef.current = userThemeModePreference
  }, [userThemeModePreference])

  const applySettings = React.useCallback(
    (nextSettings: UiSettings) => {
      const effectiveThemeMode =
        userThemeModePreferenceRef.current ?? nextSettings.themeMode
      const darkMode = effectiveThemeMode === "dark"
      const normalizedMode = normalizeThemeMode(effectiveThemeMode)

      setTheme(normalizedMode)
      resetTheme()

      if (nextSettings.themeSource === "shadcn") {
        const themeValue = nextSettings.selectedTheme || "default"
        const themeExists = colorThemes.some((theme) => theme.value === themeValue)
        applyTheme(themeExists ? themeValue : "default", darkMode)
      } else if (nextSettings.themeSource === "tweakcn") {
        const tweakcnPreset = tweakcnThemes.find(
          (theme) => theme.value === nextSettings.selectedTweakcnTheme,
        )?.preset

        if (tweakcnPreset) {
          applyTweakcnTheme(tweakcnPreset, darkMode)
        } else {
          applyTheme("default", darkMode)
        }
      } else if (nextSettings.importedTheme) {
        applyImportedTheme(nextSettings.importedTheme, darkMode)
      } else {
        applyTheme("default", darkMode)
      }

      applyRadius(nextSettings.radius)

      baseColors.forEach((color) => {
        const overrideValue = nextSettings.brandColors?.[color.cssVar]
        if (overrideValue) {
          handleColorChange(color.cssVar, overrideValue)
        }
      })

      const currentSidebarConfig = sidebarConfigRef.current

      if (
        currentSidebarConfig.variant !== nextSettings.sidebarVariant ||
        currentSidebarConfig.collapsible !== nextSettings.sidebarCollapsible ||
        currentSidebarConfig.side !== nextSettings.sidebarSide
      ) {
        updateConfig({
          variant: nextSettings.sidebarVariant,
          collapsible: nextSettings.sidebarCollapsible,
          side: nextSettings.sidebarSide,
        })
      }

      setSettings(nextSettings)
    },
    [
      applyImportedTheme,
      applyRadius,
      applyTheme,
      applyTweakcnTheme,
      handleColorChange,
      resetTheme,
      setTheme,
      updateConfig,
    ],
  )

  const reloadSettings = React.useCallback(async (empresaId?: number) => {
    const targetEmpresaId =
      typeof empresaId === "number" && Number.isFinite(empresaId)
        ? empresaId
        : activeScopedCompanyId ?? undefined
    const requestKey = String(targetEmpresaId ?? "current")

    if (reloadPromiseRef.current?.key === requestKey) {
      return reloadPromiseRef.current.promise
    }

    setIsLoading(true)

    const request = (async () => {
      try {
        const currentSettings = await uiSettingsService.getSettings(targetEmpresaId)
        applySettings(currentSettings)
        return currentSettings
      } catch {
        applySettings(DEFAULT_UI_SETTINGS)
        return DEFAULT_UI_SETTINGS
      } finally {
        setIsLoading(false)
        if (reloadPromiseRef.current?.key === requestKey) {
          reloadPromiseRef.current = null
        }
      }
    })()

    reloadPromiseRef.current = {
      key: requestKey,
      promise: request,
    }
    return request
  }, [activeScopedCompanyId, applySettings])

  React.useEffect(() => {
    if (!hasHydrated || !token) {
      return
    }

    void reloadSettings()
  }, [activeCompanyId, hasHydrated, token, reloadSettings])

  React.useEffect(() => {
    if (!settings) {
      return
    }

    applySettings(settings)
  }, [applySettings, settings, userThemeModePreference])

  const value = React.useMemo<UiSettingsContextValue>(
    () => ({
      settings,
      isLoading,
      applySettings,
      reloadSettings,
    }),
    [settings, isLoading, applySettings, reloadSettings],
  )

  return (
    <UiSettingsContext.Provider value={value}>
      {children}
    </UiSettingsContext.Provider>
  )
}

export function useUiSettings() {
  const context = React.useContext(UiSettingsContext)

  if (!context) {
    throw new Error("useUiSettings must be used within a UiSettingsProvider")
  }

  return context
}
