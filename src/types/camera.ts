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
  status: "active" | "inactive" | string
  createdAt: string
  updatedAt: string
  ponto?: Ponto
  totem?: Totem
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
}

export interface UpdateCameraPayload extends Partial<CreateCameraPayload> {}
