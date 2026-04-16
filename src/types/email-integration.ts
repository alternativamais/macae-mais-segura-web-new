export interface EmailSmtpAccount {
  id: number
  empresaId: number
  name: string
  host: string
  port: number
  secure: boolean
  username: string
  fromEmail: string
  fromName?: string | null
  replyToEmail?: string | null
  environmentTag: "prod" | "dev" | string
  enabled: boolean
  notes?: string | null
  hasPassword: boolean
  createdAt?: string
  updatedAt?: string
}

export interface EmailSmtpAccountMutationPayload {
  empresaId?: number
  name: string
  host: string
  port: number
  secure: boolean
  username: string
  password?: string
  fromEmail: string
  fromName?: string
  replyToEmail?: string
  environmentTag?: "prod" | "dev"
  enabled?: boolean
  notes?: string
}

export interface EmailRecipient {
  id: number
  empresaId: number
  name: string
  email: string
  description?: string | null
  enabled: boolean
  createdAt?: string
  updatedAt?: string
}

export interface EmailRecipientMutationPayload {
  empresaId?: number
  name: string
  email: string
  description?: string
  enabled?: boolean
}

export interface EmailRuleSummaryCamera {
  id: number
  nome?: string | null
  ip?: string | null
  empresaId?: number | null
}

export interface EmailRuleSummarySmtpAccount {
  id: number
  name: string
  fromEmail: string
  environmentTag: string
  enabled: boolean
}

export interface EmailRuleSummaryRecipient {
  id: number
  name?: string | null
  email?: string | null
  enabled?: boolean
}

export interface EmailRulePlate {
  id: number
  plateText: string
  normalizedPlate: string
}

export interface EmailPlateAlertRule {
  id: number
  empresaId: number
  name: string
  description?: string | null
  cameraId: number
  smtpAccountId: number
  subjectTemplate?: string | null
  bodyTemplate?: string | null
  cooldownSeconds: number
  enabled: boolean
  createdAt?: string
  updatedAt?: string
  camera?: EmailRuleSummaryCamera | null
  smtpAccount?: EmailRuleSummarySmtpAccount | null
  plates: EmailRulePlate[]
  recipients: EmailRuleSummaryRecipient[]
}

export interface EmailPlateAlertRuleMutationPayload {
  empresaId?: number
  name: string
  description?: string
  cameraId: number
  smtpAccountId: number
  recipientIds: number[]
  plates: string[]
  subjectTemplate?: string
  bodyTemplate?: string
  cooldownSeconds?: number
  enabled?: boolean
}
