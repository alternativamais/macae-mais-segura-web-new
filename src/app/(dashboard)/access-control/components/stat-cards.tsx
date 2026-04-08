"use client"

import { useEffect, useState } from "react"
import {
  Ban,
  Clock3,
  Globe,
  MapPinned,
  Network,
} from "lucide-react"
import { SummaryStatCards } from "@/components/shared/summary-stat-cards"
import { accessControlService } from "@/services/access-control.service"
import { useHasPermission } from "@/hooks/use-has-permission"
import { useTranslator } from "@/lib/i18n"

interface SummaryState {
  ipBlocks: number | null
  regionRules: number | null
  userIpRules: number | null
  userScheduleRules: number | null
  locationRequired: number | null
}

const initialSummary: SummaryState = {
  ipBlocks: null,
  regionRules: null,
  userIpRules: null,
  userScheduleRules: null,
  locationRequired: null,
}

export function StatCards() {
  const { hasPermission } = useHasPermission()
  const [summary, setSummary] = useState<SummaryState>(initialSummary)
  const [isLoading, setIsLoading] = useState(true)
  const t = useTranslator("access_control.stat_cards")

  useEffect(() => {
    const loadSummary = async () => {
      setIsLoading(true)

      const nextSummary: SummaryState = { ...initialSummary }

      const tasks: Promise<void>[] = []

      if (hasPermission("listar_bloqueios_ip")) {
        tasks.push(
          accessControlService.findIpBlocks().then((data) => {
            nextSummary.ipBlocks = data.filter((item) => item.active).length
          })
        )
      }

      if (hasPermission("listar_regras_regiao")) {
        tasks.push(
          accessControlService.findRegionRules().then((data) => {
            nextSummary.regionRules = data.filter((item) => item.active).length
          })
        )
      }

      if (hasPermission("listar_restricoes_usuario_ip")) {
        tasks.push(
          accessControlService.findUserIpRules().then((data) => {
            nextSummary.userIpRules = data.filter((item) => item.active).length
          })
        )
      }

      if (hasPermission("listar_restricoes_usuario_horario")) {
        tasks.push(
          accessControlService.findUserScheduleRules().then((data) => {
            nextSummary.userScheduleRules = data.filter((item) => item.active).length
          })
        )
      }

      if (
        hasPermission("gerenciar_requisito_localizacao") ||
        hasPermission("ver_relatorio_localizacao")
      ) {
        tasks.push(
          accessControlService.findUsers().then((data) => {
            nextSummary.locationRequired = data.filter((item) => item.locationRequired).length
          })
        )
      }

      await Promise.allSettled(tasks)
      setSummary(nextSummary)
      setIsLoading(false)
    }

    loadSummary()
  }, [hasPermission])

  const cards = [
    {
      title: t("active_blocks"),
      value: summary.ipBlocks,
      description: t("active_blocks_desc"),
      icon: Ban,
    },
    {
      title: t("region_rules"),
      value: summary.regionRules,
      description: t("region_rules_desc"),
      icon: Globe,
    },
    {
      title: t("user_restrictions"),
      value:
        (summary.userIpRules ?? 0) + (summary.userScheduleRules ?? 0) > 0
          ? (summary.userIpRules ?? 0) + (summary.userScheduleRules ?? 0)
          : summary.userIpRules === null && summary.userScheduleRules === null
            ? null
            : 0,
      description: t("user_restrictions_desc"),
      icon: Network,
    },
    {
      title: t("location_required"),
      value: summary.locationRequired,
      description: t("location_required_desc"),
      icon: MapPinned,
    },
    {
      title: t("schedule_windows"),
      value: summary.userScheduleRules,
      description: t("schedule_windows_desc"),
      icon: Clock3,
    },
  ]

  return (
    <SummaryStatCards
      items={cards.map((card) => ({
        ...card,
        value: card.value === null ? "--" : card.value,
        loading: isLoading,
      }))}
      className="grid-cols-2 xl:grid-cols-5"
      loadingLabel={t("loading")}
    />
  )
}
