export type DashboardWidgetType = "lpr_vehicle_count"
export type DashboardWidgetSize = "half" | "full"
export type DashboardWidgetPeriod = "today" | "7d" | "30d"
export type DashboardWidgetGranularity = "hour" | "day"
export type DashboardWidgetChartType = "bar" | "line" | "area"

export interface DashboardWidgetCompany {
  id: number
  nome: string
}

export interface DashboardWidgetCameraSummary {
  id: number
  nome: string
}

export interface DashboardWidgetConfig {
  cameraIds?: number[]
  period?: DashboardWidgetPeriod
  granularity?: DashboardWidgetGranularity
  chartType?: DashboardWidgetChartType
  showTotal?: boolean
}

export interface DashboardWidget {
  id: number
  empresaId: number
  empresa?: DashboardWidgetCompany
  title: string
  type: DashboardWidgetType
  size: DashboardWidgetSize
  enabled: boolean
  position: number
  config?: DashboardWidgetConfig | null
  createdAt: string
  updatedAt: string
}

export interface DashboardWidgetSeriesPoint {
  label: string
  value: number
  bucketStart: string
}

export interface DashboardWidgetRuntimeData {
  total: number
  period: DashboardWidgetPeriod
  granularity: DashboardWidgetGranularity
  chartType: DashboardWidgetChartType
  showTotal: boolean
  selectedCameras: DashboardWidgetCameraSummary[]
  series: DashboardWidgetSeriesPoint[]
}

export interface DashboardWidgetRuntime extends DashboardWidget {
  data?: DashboardWidgetRuntimeData | null
}

export interface DashboardWidgetListParams {
  empresaId?: number
}

export interface DashboardWidgetRuntimeParams extends DashboardWidgetListParams {
  cameraIds?: number[]
  period?: DashboardWidgetPeriod
  granularity?: DashboardWidgetGranularity
}

export interface CreateDashboardWidgetPayload {
  empresaId?: number
  title: string
  type: DashboardWidgetType
  size?: DashboardWidgetSize
  enabled?: boolean
  position?: number
  config?: DashboardWidgetConfig
}

export interface UpdateDashboardWidgetPayload
  extends Partial<CreateDashboardWidgetPayload> {}
