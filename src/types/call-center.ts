export interface CallCenterCallAgent {
  id: number
  name: string
  email?: string
  avatarUrl?: string
}

export interface CallCenterCallTotem {
  id: number
  numero: string
  pontoDeReferencia?: string
  coordenadas?: string
}

export interface CallCenterLinkedOccurrence {
  id: number
  status?: string
  description?: string
}

export interface CallCenterHistoryEntry {
  id: number
  eventType: string
  status?: string
  description?: string
  queueName?: string
  agentExtension?: string
  agent?: CallCenterCallAgent | null
  createdAt: string
}

export interface CallCenterCall {
  id: number
  uniqueId?: string
  status: string
  direction: string
  queueName?: string
  fromRamal?: string
  toRamal?: string
  fromChannel?: string
  toChannel?: string
  ringingAt?: string
  answeredAt?: string
  endedAt?: string
  duracaoSegundos?: number
  gravacao?: string
  duracao?: string
  inicio?: string
  fim?: string
  totem?: CallCenterCallTotem | null
  agent?: CallCenterCallAgent | null
  chamados?: CallCenterLinkedOccurrence[]
  history?: CallCenterHistoryEntry[]
}

export interface CallCenterAgentSession {
  id: number
  loginAt: string
  logoutAt: string | null
  isActive: boolean
  extension: {
    id: number
    numeroRamal: string
    descricao?: string
    queueName?: string
  } | null
  agent: {
    id: number
    name: string
    email: string
    avatarUrl?: string
  } | null
}

export interface CallCenterLogEntry {
  timestamp: string
  source: string
  message: string
  level?: "info" | "warn" | "error"
  extra?: unknown
}
