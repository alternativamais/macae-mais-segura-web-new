import { FRONTEND_SCREEN_METADATA } from "@/config/frontend-screens"
import {
  AppNavigationGroup,
  AppNavigationItem,
  AppNavigationSubItem,
  appNavigation,
} from "@/lib/navigation"

interface FrontendScreenDefinition {
  screenKey: string
  title: string
  description?: string
  path: string
  group?: string
}

function normalizeScreen(
  screenKey: string | undefined,
  path: string,
  fallbackGroup?: string,
) {
  const normalizedKey = screenKey?.trim()

  if (!normalizedKey || !path || path === "#") {
    return null
  }

  const metadata = FRONTEND_SCREEN_METADATA[normalizedKey]

  return {
    screenKey: normalizedKey,
    title: metadata?.title || normalizedKey,
    description: metadata?.description || "",
    path,
    group: metadata?.group || fallbackGroup || undefined,
  } satisfies FrontendScreenDefinition
}

function collectFromSubItems(
  items: AppNavigationSubItem[],
  fallbackGroup?: string,
) {
  return items
    .map((item) => normalizeScreen(item.screenKey, item.url, fallbackGroup))
    .filter(Boolean) as FrontendScreenDefinition[]
}

function collectFromItems(
  items: AppNavigationItem[],
  group: AppNavigationGroup,
) {
  return items.flatMap((item) => {
    if (item.items?.length) {
      const itemGroup =
        FRONTEND_SCREEN_METADATA[item.screenKey || ""]?.group || group.labelKey
      return collectFromSubItems(item.items, itemGroup)
    }

    const screen = normalizeScreen(item.screenKey, item.url, group.labelKey)
    return screen ? [screen] : []
  })
}

export function collectFrontendScreens() {
  const map = new Map<string, FrontendScreenDefinition>()

  appNavigation.forEach((group) => {
    collectFromItems(group.items, group).forEach((screen) => {
      map.set(screen.screenKey, screen)
    })
  })

  return Array.from(map.values())
}

export const FRONTEND_SCREEN_KEYS = collectFrontendScreens().map(
  (screen) => screen.screenKey,
)
