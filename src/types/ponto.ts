export interface PontoCompany {
  id: number
  nome: string
}

export interface PontoDeviceReference {
  id: number
  nome?: string
  status?: string
}

export interface Ponto {
  id: number
  nome: string
  pontoDeReferencia?: string | null
  coordenadas?: string | null
  status: "active" | "inactive" | string
  empresaId?: number | null
  empresa?: PontoCompany | null
  cameras?: PontoDeviceReference[]
  totens?: PontoDeviceReference[]
  createdAt?: string
  updatedAt?: string
}

export interface PointListResponse {
  data: Ponto[]
  total: number
  page: number
  limit: number
}

export interface PointListParams {
  page?: number
  limit?: number
  search?: string
  status?: string
}

export interface CreatePointPayload {
  nome: string
  pontoDeReferencia?: string | null
  coordenadas?: string | null
  status?: "active" | "inactive"
}

export interface UpdatePointPayload extends Partial<CreatePointPayload> {}
