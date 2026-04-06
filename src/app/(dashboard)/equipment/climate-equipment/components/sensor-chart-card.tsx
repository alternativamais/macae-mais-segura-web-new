"use client"

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { useTranslator } from "@/lib/i18n"
import { ClimateDashboardSensor } from "@/types/climate-equipment"
import { ClimateSensorAvailabilityBadge } from "./status-badges"
import {
  formatClimateDateTime,
  getClimateSensorColor,
} from "./utils"

interface SensorChartCardProps {
  sensor: ClimateDashboardSensor
}

export function SensorChartCard({ sensor }: SensorChartCardProps) {
  const t = useTranslator("climate_equipment.dashboard")
  const locale = t.getLocale()

  const data = sensor.history.map((entry) => ({
    label: new Date(entry.recordedAt).toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    }),
    fullLabel: formatClimateDateTime(entry.recordedAt, locale),
    value: typeof entry.value === "number" ? entry.value : null,
  }))

  const hasChartData = data.some((entry) => typeof entry.value === "number")
  const latestValue =
    sensor.lastValue !== null && sensor.lastValue !== undefined
      ? sensor.lastValue
      : (sensor.lastRawValue ?? t("not_informed"))
  const chartColor = getClimateSensorColor(sensor.type)

  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-3 border-b bg-muted/10 pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-sm leading-tight">{sensor.label}</CardTitle>
            <CardDescription className="line-clamp-1 text-xs">
              {sensor.equipmentName || sensor.friendlyName || sensor.entityId}
            </CardDescription>
          </div>
          <ClimateSensorAvailabilityBadge available={sensor.isAvailable} />
        </div>

        <div className="grid grid-cols-[1fr_auto] items-end gap-3">
          <div className="space-y-1">
            <div className="text-2xl font-semibold leading-none">
              {String(latestValue)}
              {sensor.unit ? ` ${sensor.unit}` : ""}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {t("last_reading", {
                value: formatClimateDateTime(sensor.lastSyncAt, locale),
              })}
            </p>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {sensor.history.length}
            </div>
            <div className="text-xs font-medium text-muted-foreground">hist</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {hasChartData ? (
          <ChartContainer
            config={{
              value: {
                label: sensor.label,
                color: chartColor,
              },
            }}
            className="h-[180px] w-full"
          >
            <LineChart data={data} margin={{ top: 8, right: 6, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted/40" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                minTickGap={28}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={34}
                domain={["auto", "auto"]}
                tick={{ fontSize: 11 }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) =>
                      payload?.[0]?.payload?.fullLabel || ""
                    }
                    formatter={(value) => [
                      sensor.unit ? `${value} ${sensor.unit}` : value,
                      sensor.label,
                    ]}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--color-value)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ChartContainer>
        ) : (
          <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-6 text-sm text-muted-foreground">
            {t("empty_history")}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
