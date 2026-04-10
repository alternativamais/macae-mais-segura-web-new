import { ImportedTheme } from "@/types/theme-customizer"

export type UiThemeMode = "light" | "dark"
export type UiThemeSource = "shadcn" | "tweakcn" | "imported"
export type UiSidebarVariant = "sidebar" | "floating" | "inset"
export type UiSidebarCollapsible = "offcanvas" | "icon" | "none"
export type UiSidebarSide = "left" | "right"

export interface UiSettings {
  id: number
  themeMode: UiThemeMode
  themeSource: UiThemeSource
  selectedTheme?: string | null
  selectedTweakcnTheme?: string | null
  importedTheme?: ImportedTheme | null
  brandColors?: Record<string, string> | null
  radius: string
  sidebarVariant: UiSidebarVariant
  sidebarCollapsible: UiSidebarCollapsible
  sidebarSide: UiSidebarSide
  updatedAt: string
}

export interface UpdateUiSettingsPayload {
  themeMode: UiThemeMode
  themeSource: UiThemeSource
  selectedTheme?: string | null
  selectedTweakcnTheme?: string | null
  importedTheme?: ImportedTheme | null
  brandColors?: Record<string, string> | null
  radius: string
  sidebarVariant: UiSidebarVariant
  sidebarCollapsible: UiSidebarCollapsible
  sidebarSide: UiSidebarSide
  empresaId?: number
}
