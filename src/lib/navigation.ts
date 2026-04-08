"use client"

import {
  Archive,
  Building2,
  HardDrive,
  LayoutDashboard,
  Logs,
  Map,
  MapPin,
  PaintbrushVertical,
  Power,
  RadioTower,
  Phone,
  Settings,
  ShieldCheck,
  Send,
  Thermometer,
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
      {
        titleKey: "map",
        url: "/map",
        icon: Map,
        screenKey: "admin.map",
      },
    ],
  },
  {
    labelKey: "telephony",
    items: [
      {
        titleKey: "call_center",
        url: "/telephony/call-center",
        icon: Phone,
        screenKey: "admin.call_center",
      },
      {
        titleKey: "extensions",
        url: "/telephony/extensions",
        icon: Phone,
        screenKey: "admin.call_center_extensions",
      },
    ],
  },
  {
    labelKey: "manual_administration",
    items: [
      {
        titleKey: "administration",
        url: "#",
        icon: Building2,
        items: [
          {
            titleKey: "points",
            url: "/administration/points",
            screenKey: "admin.points",
            icon: MapPin,
          },
          {
            titleKey: "companies",
            url: "/companies",
            screenKey: "admin.companies",
            icon: Building2,
          },
        ],
      },
      {
        titleKey: "equipment",
        url: "#",
        icon: HardDrive,
        items: [
          {
            titleKey: "cameras",
            url: "/equipment/cameras",
            screenKey: "admin.cameras",
          },
          {
            titleKey: "totens",
            url: "/equipment/totens",
            screenKey: "admin.totens",
            icon: RadioTower,
          },
          {
            titleKey: "smart_switches",
            url: "/equipment/smart-switches",
            screenKey: "admin.smart_switches",
            icon: Power,
          },
          {
            titleKey: "network_equipment",
            url: "/equipment/network-equipment",
            screenKey: "admin.network_equipment",
            icon: Settings,
          },
          {
            titleKey: "climate_equipment",
            url: "/equipment/climate-equipment",
            screenKey: "admin.climate_equipment",
            icon: Thermometer,
          },
        ],
      },
      {
        titleKey: "integrations",
        url: "#",
        icon: Send,
        items: [

          {
            titleKey: "plate_sending",
            url: "/administration/integrations/plate-sending",
            screenKey: "admin.integracoes",
            icon: Send,
          },
        ],
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
