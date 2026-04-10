import { Ponto } from "@/types/ponto"
import { Totem } from "@/types/totem"

export type NetworkEquipmentType = "roteador" | "onu" | "radio" | "switch"
export type NetworkEquipmentStatus = "active" | "inactive"
export type NetworkEquipmentDestination = "ponto" | "totem"

export interface NetworkEquipment {
  id: number
  nome: string
  empresaId?: number | null
  pontoId?: number | null
  ponto?: Ponto | null
  totemId?: number | null
  totem?: Totem | null
  tipoEquipamento?: NetworkEquipmentType | string | null
  macAddress?: string | null
  usuarioGerencia?: string | null
  senhaGerencia?: string | null
  numeroPortas?: number | null
  ssid?: string | null
  senhaWifi?: string | null
  modoOnu?: string | null
  pppoeUser?: string | null
  pppoePass?: string | null
  modoRadio?: string | null
  frequencia?: string | null
  gerenciavel?: boolean | null
  vlans?: string | null
  ip: string
  status: NetworkEquipmentStatus | string
  online: boolean
  createdAt?: string
  updatedAt?: string
}

export interface NetworkEquipmentListResponse {
  data: NetworkEquipment[]
  total: number
  page: number
  limit: number
}

export interface NetworkEquipmentListParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  empresaId?: number
}

export interface CreateNetworkEquipmentPayload {
  nome: string
  empresaId?: number
  pontoId?: number | null
  totemId?: number | null
  tipoEquipamento?: NetworkEquipmentType | string | null
  macAddress?: string | null
  usuarioGerencia?: string | null
  senhaGerencia?: string | null
  numeroPortas?: number | null
  ssid?: string | null
  senhaWifi?: string | null
  modoOnu?: string | null
  pppoeUser?: string | null
  pppoePass?: string | null
  modoRadio?: string | null
  frequencia?: string | null
  gerenciavel?: boolean | null
  vlans?: string | null
  ip: string
  status?: NetworkEquipmentStatus
  online?: boolean
}

export interface UpdateNetworkEquipmentPayload
  extends Partial<CreateNetworkEquipmentPayload> {}
