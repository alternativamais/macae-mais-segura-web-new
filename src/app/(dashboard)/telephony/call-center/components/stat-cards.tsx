"use client"

import { PhoneCall, PhoneMissed, PhoneOutgoing, PhoneForwarded } from "lucide-react"
import { SummaryStatCards } from "@/components/shared/summary-stat-cards"
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
    <SummaryStatCards
      items={cards.map((card) => ({
        ...card,
        loading: isLoading,
        valueClassName: "text-lg font-semibold md:text-3xl",
      }))}
      className="grid-cols-2 xl:grid-cols-4"
      loadingLabel={t("loading")}
    />
  )
}
