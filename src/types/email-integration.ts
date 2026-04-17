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

export interface WhatsappAccount {
  id: number
  empresaId: number
  name: string
  clientId: string
  enabled: boolean
  sessionStatus: string
  displayName?: string | null
  phoneNumber?: string | null
  lastError?: string | null
  lastReadyAt?: string | null
  qrCodeDataUrl?: string | null
  notes?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface WhatsappAccountMutationPayload {
  empresaId?: number
  name: string
  enabled?: boolean
  notes?: string
}

export interface WhatsappRecipient {
  id: number
  empresaId: number
  accountId?: number | null
  type: "manual_phone" | "contact" | "group" | string
  source: "manual" | "imported" | string
  name: string
  phoneNumber?: string | null
  chatId?: string | null
  description?: string | null
  enabled: boolean
  metadata?: Record<string, unknown> | null
  account?: Pick<WhatsappAccount, "id" | "name" | "phoneNumber" | "sessionStatus"> | null
  createdAt?: string
  updatedAt?: string
}

export interface WhatsappRecipientMutationPayload {
  empresaId?: number
  name: string
  type?: "manual_phone" | "imported"
  sourceRecipientId?: number
  phoneNumber?: string
  description?: string
  enabled?: boolean
}

export interface WhatsappRecipientTestPayload {
  accountId?: number
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

export interface EmailRuleSummaryWhatsappAccount {
  id: number
  name: string
  phoneNumber?: string | null
  sessionStatus?: string
  enabled: boolean
}

export interface EmailRuleSummaryRecipient {
  id: number
  name?: string | null
  email?: string | null
  enabled?: boolean
}

export interface WhatsappRuleSummaryRecipient {
  id: number
  name?: string | null
  phoneNumber?: string | null
  chatId?: string | null
  type?: string | null
  accountId?: number | null
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
  smtpAccountId?: number | null
  whatsappAccountId?: number | null
  subjectTemplate?: string | null
  bodyTemplate?: string | null
  cooldownSeconds: number
  emailEnabled: boolean
  whatsappEnabled: boolean
  enabled: boolean
  createdAt?: string
  updatedAt?: string
  camera?: EmailRuleSummaryCamera | null
  smtpAccount?: EmailRuleSummarySmtpAccount | null
  whatsappAccount?: EmailRuleSummaryWhatsappAccount | null
  plates: EmailRulePlate[]
  recipients: EmailRuleSummaryRecipient[]
  whatsappRecipients: WhatsappRuleSummaryRecipient[]
}

export interface EmailPlateAlertRuleMutationPayload {
  empresaId?: number
  name: string
  description?: string
  cameraId: number
  smtpAccountId?: number | null
  recipientIds?: number[]
  whatsappAccountId?: number | null
  whatsappRecipientIds?: number[]
  plates: string[]
  subjectTemplate?: string
  bodyTemplate?: string
  cooldownSeconds?: number
  emailEnabled?: boolean
  whatsappEnabled?: boolean
  enabled?: boolean
}
