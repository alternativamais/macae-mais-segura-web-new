"use client"

import {
  Archive,
  LayoutDashboard,
  Logs,
  PaintbrushVertical,
  Settings,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react"

export interface AppNavigationSubItem {
  titleKey: string
  url: string
  isActive?: boolean
  screenKey?: string
  icon?: LucideIcon
  hiddenInSidebar?: boolean
  hiddenInSearch?: boolean
}

export interface AppNavigationItem {
  titleKey: string
  url: string
  icon?: LucideIcon
  isActive?: boolean
  screenKey?: string
  hiddenInSidebar?: boolean
  hiddenInSearch?: boolean
  items?: AppNavigationSubItem[]
}

export interface AppNavigationGroup {
  labelKey: string
  items: AppNavigationItem[]
}

export interface CommandSearchItem {
  titleKey: string
  url: string
  groupKey: string
  icon?: LucideIcon
}

export const appNavigation: AppNavigationGroup[] = [
  {
    labelKey: "main",
    items: [
      {
        titleKey: "dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    labelKey: "settings",
    items: [
      {
        titleKey: "administration",
        url: "#",
        icon: Users,
        items: [
          {
            titleKey: "users",
            url: "/users",
            screenKey: "admin.users",
          },
          {
            titleKey: "permissions",
            url: "/permissions",
            screenKey: "admin.roles",
          },
          {
            titleKey: "access_control",
            url: "/access-control",
            screenKey: "admin.access_control",
          },
        ],
      },
      {
        titleKey: "system",
        url: "#",
        icon: Settings,
        items: [
          {
            titleKey: "backups",
            url: "/backup",
            screenKey: "admin.backup",
            icon: Archive,
          },
          {
            titleKey: "ui_settings",
            url: "/ui-settings",
            screenKey: "admin.ui_settings",
            icon: PaintbrushVertical,
          },
          {
            titleKey: "logs",
            url: "/logs",
            screenKey: "admin.logs",
            icon: Logs,
          },
          {
            titleKey: "my_account",
            url: "/settings/account",
            icon: ShieldCheck,
            hiddenInSidebar: true,
          },
        ],
      },
    ],
  },
]

export function filterNavigationGroupsByAccess(
  groups: AppNavigationGroup[],
  allowedScreens: string[],
) {
  return groups
    .map((group) => {
      const filteredItems = group.items
        .map((item) => {
          if (item.items?.length) {
            const filteredSubItems = item.items.filter((subItem) => {
              if (!subItem.screenKey) return true
              return allowedScreens.includes(subItem.screenKey)
            })

            if (filteredSubItems.length === 0) {
              return null
            }

            return { ...item, items: filteredSubItems }
          }

          if (item.screenKey && !allowedScreens.includes(item.screenKey)) {
            return null
          }

          return item
        })
        .filter(Boolean) as AppNavigationItem[]

      if (filteredItems.length === 0) {
        return null
      }

      return { ...group, items: filteredItems }
    })
    .filter(Boolean) as AppNavigationGroup[]
}

export function getSidebarNavigation(groups: AppNavigationGroup[]) {
  return groups
    .map((group) => {
      const items = group.items
        .map((item) => {
          if (item.hiddenInSidebar) {
            return null
          }

          if (item.items?.length) {
            const visibleSubItems = item.items.filter((subItem) => !subItem.hiddenInSidebar)

            if (visibleSubItems.length === 0) {
              return null
            }

            return {
              ...item,
              items: visibleSubItems,
            }
          }

          return item
        })
        .filter(Boolean) as AppNavigationItem[]

      if (items.length === 0) {
        return null
      }

      return {
        ...group,
        items,
      }
    })
    .filter(Boolean) as AppNavigationGroup[]
}

export function getCommandSearchItems(groups: AppNavigationGroup[]): CommandSearchItem[] {
  return groups.flatMap((group) =>
    group.items.flatMap((item) => {
      if (item.hiddenInSearch) {
        return []
      }

      if (item.items?.length) {
        return item.items
          .filter((subItem) => !subItem.hiddenInSearch)
          .map((subItem) => ({
            titleKey: subItem.titleKey,
            url: subItem.url,
            groupKey: item.titleKey,
            icon: subItem.icon ?? item.icon,
          }))
      }

      return [
        {
          titleKey: item.titleKey,
          url: item.url,
          groupKey: group.labelKey,
          icon: item.icon,
        },
      ]
    }),
  )
}
