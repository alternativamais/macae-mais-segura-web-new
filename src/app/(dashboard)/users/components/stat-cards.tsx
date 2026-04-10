"use client"

import { Clock3, ShieldCheck, UserCheck, Users } from "lucide-react"
import { SummaryStatCards } from "@/components/shared/summary-stat-cards"
import { useTranslator } from "@/lib/i18n"
import { User } from "@/types/user"

interface StatCardsProps {
  users: User[]
  isLoading: boolean
}

export function StatCards({ users, isLoading }: StatCardsProps) {
  const t = useTranslator("users.stats")
  const activeUsers = users.filter((user) => String(user.status).toLowerCase() === "active").length
  const inactiveUsers = users.filter((user) => String(user.status).toLowerCase() !== "active").length
  const uniqueRoles = new Set(
    users
      .map((user) => user.roleId)
      .filter((roleId): roleId is number => typeof roleId === "number"),
  ).size

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

  return <SummaryStatCards items={cards.map((card) => ({ ...card, loading: isLoading }))} className="grid-cols-2 xl:grid-cols-4" loadingLabel={t("loading")} />
}
