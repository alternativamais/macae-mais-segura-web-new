"use client"

import {
  CalendarClock,
  MapPinned,
  ShieldCheck,
  UserRoundCog,
} from "lucide-react"
import { DataTag } from "@/components/shared/data-tag"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslator } from "@/lib/i18n"
import { formatLocalizedDateTime } from "@/lib/i18n/date"
import { MyProfile } from "@/types/me"

interface AccountOverviewCardsProps {
  profile: MyProfile | null
  isLoading?: boolean
}

export function AccountOverviewCards({
  profile,
  isLoading = false,
}: AccountOverviewCardsProps) {
  const t = useTranslator("account.overview")
  const locale = t.getLocale()

  const cards = [
    {
      key: "role",
      title: t("cards.role.title"),
      value: profile?.role?.name || t("shared.empty_value"),
      description: t("cards.role.description"),
      icon: UserRoundCog,
    },
    {
      key: "status",
      title: t("cards.status.title"),
      value: profile?.status || t("shared.empty_value"),
      description: t("cards.status.description"),
      icon: ShieldCheck,
    },
    {
      key: "updated_at",
      title: t("cards.updated_at.title"),
      value: profile?.updatedAt
        ? formatLocalizedDateTime(new Date(profile.updatedAt), locale)
        : t("shared.empty_value"),
      description: t("cards.updated_at.description"),
      icon: CalendarClock,
    },
    {
      key: "location_required",
      title: t("cards.location_required.title"),
      value: profile?.locationRequired
        ? t("values.location_required.required")
        : t("values.location_required.optional"),
      description: t("cards.location_required.description"),
      icon: MapPinned,
    },
  ] as const

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon

        return (
          <Card key={card.key}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div className="space-y-1">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted/30">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoading ? (
                <>
                  <Skeleton className="h-7 w-28" />
                  <Skeleton className="h-4 w-full" />
                </>
              ) : card.key === "status" ? (
                <>
                  <DataTag tone={profile?.status === "active" ? "success" : "warning"}>
                    {profile?.status === "active"
                      ? t("values.status.active")
                      : profile?.status === "inactive"
                        ? t("values.status.inactive")
                        : card.value}
                  </DataTag>
                  <p className="text-xs text-muted-foreground">{card.description}</p>
                </>
              ) : card.key === "location_required" ? (
                <>
                  <DataTag tone={profile?.locationRequired ? "warning" : "neutral"}>
                    {card.value}
                  </DataTag>
                  <p className="text-xs text-muted-foreground">{card.description}</p>
                </>
              ) : (
                <>
                  <div className="text-2xl font-semibold tracking-tight">{card.value}</div>
                  <p className="text-xs text-muted-foreground">{card.description}</p>
                </>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
