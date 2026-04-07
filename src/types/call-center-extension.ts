export type CallCenterExtensionStatus = "active" | "inactive"
export type CallCenterExtensionType = "operator" | "totem"

export interface CallCenterExtensionPoint {
  id: number
  nome?: string | null
  pontoDeReferencia?: string | null
}

export interface CallCenterExtensionTotem {
  id: number
  numero?: string | null
  ponto?: CallCenterExtensionPoint | null
}

export interface CallCenterExtension {
  id: number
  numeroRamal: string
  descricao?: string | null
  queueName?: string | null
  status: CallCenterExtensionStatus | string
  type: CallCenterExtensionType | string
  totem?: CallCenterExtensionTotem | null
  createdAt?: string
  updatedAt?: string
}

export interface CallCenterExtensionsResponse {
  data: CallCenterExtension[]
  total: number
  page: number
  limit: number
}

export interface CallCenterExtensionPayload {
  numeroRamal: string
  descricao?: string
  queueName?: string
  status?: CallCenterExtensionStatus
  type?: CallCenterExtensionType
}
