"use client"

import { PhoneCall, PhoneMissed, PhoneOutgoing, PhoneForwarded } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslator } from "@/lib/i18n"
import { CallCenterCall } from "@/types/call-center"

interface CallCenterStatCardsProps {
  calls: CallCenterCall[]
  isLoading?: boolean
}

export function StatCards({ calls, isLoading }: CallCenterStatCardsProps) {
  const t = useTranslator("call_center.stats")

  const total = calls.length
  const ringing = calls.filter((call) => call.status === "ringing").length
  const answered = calls.filter((call) => call.status === "answered").length
  const abandoned = calls.filter((call) => call.status === "abandoned").length

  const cards = [
    { title: t("total"), description: t("total_desc"), value: total, icon: PhoneCall },
    { title: t("ringing"), description: t("ringing_desc"), value: ringing, icon: PhoneOutgoing },
    { title: t("answered"), description: t("answered_desc"), value: answered, icon: PhoneForwarded },
    { title: t("abandoned"), description: t("abandoned_desc"), value: abandoned, icon: PhoneMissed },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.title} className="min-w-0">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="min-w-0 space-y-1">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <p className="text-xs text-muted-foreground">{card.description}</p>
              </div>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-tight">
                {isLoading ? t("loading") : card.value}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
