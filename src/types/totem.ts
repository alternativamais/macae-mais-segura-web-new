export interface TotemPoint {
  id: number
  nome?: string | null
  pontoDeReferencia?: string | null
  coordenadas?: string | null
  status?: "active" | "inactive" | string
}

export interface TotemDeviceReference {
  id: number
  nome?: string | null
  status?: "active" | "inactive" | string
}

export interface TotemCallCenterExtension {
  id: number
  numeroRamal: string
  descricao?: string | null
  queueName?: string | null
  status: "active" | "inactive" | string
  type?: string | null
  assignedTotemId?: number | null
  assignedTotemNumero?: string | null
}

export interface Totem {
  id: number
  empresaId?: number | null
  pontoId?: number | null
  ponto?: TotemPoint | null
  numero: string
  status: "active" | "inactive" | string
  smartSwitches?: TotemDeviceReference[]
  cameras?: TotemDeviceReference[]
  climateEquipments?: TotemDeviceReference[]
  climateEquipment?: TotemDeviceReference | null
  callCenterExtensionId?: number | null
  callCenterExtension?: TotemCallCenterExtension | null
  numeroRamal?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface TotemListResponse {
  data: Totem[]
  total: number
  page: number
  limit: number
}

export interface TotemListParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  empresaId?: number
}

export interface CreateTotemPayload {
  numero: string
  pontoId?: number | null
  status?: "active" | "inactive"
  callCenterExtensionId?: number | null
  empresaId?: number
}

export interface UpdateTotemPayload {
  numero?: string
  status?: "active" | "inactive"
  callCenterExtensionId?: number | null
}
