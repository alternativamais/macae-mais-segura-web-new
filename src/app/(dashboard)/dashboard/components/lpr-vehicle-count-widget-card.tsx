"use client"

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { useTranslator } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { DashboardWidgetRuntime } from "@/types/dashboard-widget"

interface LprVehicleCountWidgetCardProps {
  widget: DashboardWidgetRuntime
  className?: string
}

export function LprVehicleCountWidgetCard({
  widget,
  className,
}: LprVehicleCountWidgetCardProps) {
  const t = useTranslator("dashboard")
  const data = widget.data

  if (!data) return null

  const cameraSummary =
    data.selectedCameras.length > 0
      ? data.selectedCameras.length === 1
        ? data.selectedCameras[0]?.nome || t("widgets.vehicle_count.all_cameras")
        : t("widgets.vehicle_count.cameras_selected", {
            count: data.selectedCameras.length,
          })
      : t("widgets.vehicle_count.all_cameras")

  const chartType = data.chartType || "bar"

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="space-y-3 border-b bg-muted/10 pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base leading-tight">{widget.title}</CardTitle>
            <CardDescription>
              {cameraSummary} • {t(`widgets.vehicle_count.periods.${data.period}`)}
            </CardDescription>
          </div>
          {data.showTotal ? (
            <div className="text-right">
              <div className="text-2xl font-semibold leading-none">{data.total}</div>
              <p className="text-xs text-muted-foreground">
                {t("widgets.vehicle_count.total")}
              </p>
            </div>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <ChartContainer
          key={`${chartType}-${data.showTotal ? "1" : "0"}`}
          config={{
            value: {
              label: t("widgets.vehicle_count.total"),
              color: "hsl(var(--primary))",
            },
          }}
          className="h-[260px] w-full"
        >
          {chartType === "line" ? (
            <LineChart data={data.series} margin={{ top: 8, right: 6, left: 0, bottom: 0 }}>
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
                allowDecimals={false}
                tick={{ fontSize: 11 }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value) => [String(value), t("widgets.vehicle_count.total")]}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--color-value)"
                strokeWidth={3}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          ) : chartType === "area" ? (
            <AreaChart data={data.series} margin={{ top: 8, right: 6, left: 0, bottom: 0 }}>
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
                allowDecimals={false}
                tick={{ fontSize: 11 }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value) => [String(value), t("widgets.vehicle_count.total")]}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--color-value)"
                fill="var(--color-value)"
                fillOpacity={0.22}
                strokeWidth={2.5}
                isAnimationActive={false}
              />
            </AreaChart>
          ) : (
            <BarChart data={data.series} margin={{ top: 8, right: 6, left: 0, bottom: 0 }}>
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
                allowDecimals={false}
                tick={{ fontSize: 11 }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value) => [String(value), t("widgets.vehicle_count.total")]}
                  />
                }
              />
              <Bar
                dataKey="value"
                fill="var(--color-value)"
                radius={[6, 6, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          )}
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
