"use client"

import { Clock3, Loader2, ShieldCheck, UserCheck, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User } from "@/types/user"
import { useTranslator } from "@/lib/i18n"

interface StatCardsProps {
  users: User[]
  isLoading: boolean
}

export function StatCards({ users, isLoading }: StatCardsProps) {
  const t = useTranslator("users.stats")
  const activeUsers = users.filter((user) => String(user.status).toLowerCase() === "active").length
  const inactiveUsers = users.filter((user) => String(user.status).toLowerCase() !== "active").length
  const uniqueRoles = new Set(users.map((user) => user.role?.name).filter(Boolean)).size

  const cards = [
    {
      title: t("total"),
      value: users.length,
      description: t("total_desc"),
      icon: Users,
    },
    {
      title: t("active"),
      value: activeUsers,
      description: t("active_desc"),
      icon: UserCheck,
    },
    {
      title: t("inactive"),
      value: inactiveUsers,
      description: t("inactive_desc"),
      icon: Clock3,
    },
    {
      title: t("roles"),
      value: uniqueRoles,
      description: t("roles_desc"),
      icon: ShieldCheck,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <span className="inline-flex items-center gap-2 text-base text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("loading")}
                </span>
              ) : (
                card.value
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
