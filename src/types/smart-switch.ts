import { Ponto } from "@/types/ponto"
import { Totem } from "@/types/totem"

export type SmartSwitchPowerState = "on" | "off" | "offline" | "unknown"
export type SmartSwitchDestination = "totem" | "ponto"

export interface SmartSwitch {
  id: number
  nome?: string | null
  homeAssistantEntityId: string
  empresaId?: number | null
  totemId?: number | null
  totem?: Totem | null
  pontoId?: number | null
  ponto?: Ponto | null
  status: "active" | "inactive" | string
  createdAt?: string
  updatedAt?: string
}

export interface SmartSwitchListResponse {
  data: SmartSwitch[]
  total: number
  page: number
  limit: number
}

export interface SmartSwitchListParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  empresaId?: number
}

export interface CreateSmartSwitchPayload {
  nome?: string
  homeAssistantEntityId: string
  totemId?: number | null
  pontoId?: number | null
  status?: "active" | "inactive"
  empresaId?: number
}

export interface UpdateSmartSwitchPayload extends Partial<CreateSmartSwitchPayload> {}

export interface HomeAssistantSwitchEntity {
  entityId: string
  friendlyName?: string
  state?: string
}

export interface SmartSwitchPowerResponse {
  id: number
  entityId: string
  state: SmartSwitchPowerState
  rawState?: string
  on: boolean | null
  available: boolean
  confirmed: boolean
  requestedAction?: "turn_on" | "turn_off"
}
