export type CameraType = "normal" | "lpr" | string

export interface Ponto {
  id: number
  nome: string
  pontoDeReferencia?: string
  coordenadas?: string
  status: "active" | "inactive" | string
  empresaId?: number
  createdAt: string
  updatedAt: string
}

export interface Totem {
  id: number
  pontoId?: number
  numero: string
  status: "active" | "inactive" | string
  createdAt: string
  updatedAt: string
  ponto?: Ponto
}

export interface Camera {
  id: number
  nome?: string
  ip?: string
  usuario?: string
  senha?: string // Usado apenas no form
  marca?: string
  rtspScheme?: string
  rtspPort?: number
  rtspPath?: string
  pontoId?: number
  totemId?: number
  empresaId?: number | null
  status: "active" | "inactive" | string
  cameraType: CameraType
  generatedLprToken?: string | null
  createdAt: string
  updatedAt: string
  ponto?: Ponto
  totem?: Totem
}

export interface CameraListParams {
  page?: number
  limit?: number
  search?: string
  empresaId?: number
  cameraType?: CameraType
}

export interface CreateCameraPayload {
  nome?: string
  ip?: string
  usuario?: string
  senha?: string
  marca?: string
  rtspScheme?: string
  rtspPort?: number
  rtspPath?: string
  pontoId?: number
  totemId?: number
  status?: string
  empresaId?: number
  cameraType?: CameraType
  generateLprToken?: boolean
}

export type UpdateCameraPayload = Partial<CreateCameraPayload>

export interface CameraLprTokenSummary {
  id: number
  tokenPreview?: string | null
  token?: string | null
  revoked: boolean
  revokedAt?: string | null
  createdAt?: string
}

export interface GeneratedCameraLprToken {
  id: number
  token: string
  createdAt?: string
  message: string
}
