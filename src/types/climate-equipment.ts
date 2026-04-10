import { Ponto } from "@/types/ponto"
import { Totem } from "@/types/totem"

export type ClimateEquipmentStatus = "active" | "inactive"
export type ClimateEquipmentDestination = "totem" | "ponto"
export type ClimateDashboardRange = "30m" | "1h" | "12h" | "1d" | "1s" | "1m"

export type ClimateSensorType =
  | "temperature"
  | "probe_temperature"
  | "humidity"
  | "outdoor_humidity"
  | "air_pressure"
  | "wind_speed"
  | "precipitation_intensity"
  | "total_precipitation_today"
  | "uv_index"
  | "sound_pressure"

export interface ClimateSensorHistoryEntry {
  id: number
  value?: number | null
  rawValue?: string | null
  unit?: string | null
  recordedAt: string
}

export interface ClimateSensor {
  id: number
  type: ClimateSensorType | string
  label: string
  entityId: string
  friendlyName?: string | null
  unit?: string | null
  lastValue?: number | null
  lastRawValue?: string | null
  lastSyncAt?: string | null
  isAvailable: boolean
}

export interface ClimateEquipment {
  id: number
  nome: string
  empresaId?: number | null
  descricao?: string | null
  status: ClimateEquipmentStatus | string
  homeAssistantDeviceKey: string
  homeAssistantLabel?: string | null
  pontoId?: number | null
  ponto?: Ponto | null
  totem?: (Totem & {
    ponto?: Ponto | null
    pontoDeReferencia?: string | null
  }) | null
  lastSyncedAt?: string | null
  sensors: ClimateSensor[]
  createdAt?: string
  updatedAt?: string
}

export interface ClimateDashboardSensor extends ClimateSensor {
  history: ClimateSensorHistoryEntry[]
  equipmentId?: number
  equipmentName?: string
}

export interface ClimateDashboardResponse {
  equipment: ClimateEquipment
  sensors: ClimateDashboardSensor[]
}

export interface ClimateTotemDashboardResponse {
  totem: {
    id: number
    numero?: string | null
    pontoDeReferencia?: string | null
  }
  equipments: ClimateEquipment[]
  sensors: ClimateDashboardSensor[]
}

export interface ClimateEquipmentListResponse {
  data: ClimateEquipment[]
  total: number
  page: number
  limit: number
}

export interface ClimateEquipmentListParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  empresaId?: number
}

export interface CreateClimateEquipmentPayload {
  nome: string
  empresaId?: number
  descricao?: string
  homeAssistantDeviceKey: string
  homeAssistantLabel?: string
  totemId?: number | null
  pontoId?: number | null
  status?: ClimateEquipmentStatus
}

export interface UpdateClimateEquipmentPayload
  extends Partial<CreateClimateEquipmentPayload> {}

export interface HomeAssistantClimateDeviceOption {
  deviceKey: string
  friendlyName?: string
  linkedEquipmentId: number | null
  available: boolean
  sensors: ClimateSensor[]
}

export interface ClimateTotemOption {
  id: number
  numero?: string | null
  pontoDeReferencia?: string | null
  equipmentCount: number
}

export interface ClimateDashboardParams {
  limit?: number
  from?: string
  to?: string
}
