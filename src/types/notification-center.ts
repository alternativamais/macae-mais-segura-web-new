export type NotificationAudience = "all" | "policial" | "cidadao"
export type NotificationTargetType = "all" | "user" | "locality" | "area"

export interface NotificationLocality {
  id: number
  name: string
  description?: string | null
  centerLat: number
  centerLng: number
  radiusKm: number
  maxLocationAgeMinutes?: number | null
  createdAt?: string
  updatedAt?: string
}

export interface NotificationUserApp {
  id: number
  name: string
  email?: string | null
  tipo?: string | null
  status?: string | null
}

export interface NotificationPreviewLocation {
  userAppId: number
  lat: number
  lng: number
  updatedAt: string
  name: string | null
  tipo: string | null
  platform: string
}

export interface NotificationPreview {
  targetType: NotificationTargetType
  audience: NotificationAudience
  totalRecipients: number
  tipoBreakdown: {
    policial: number
    cidadao: number
    outros: number
  }
  platformBreakdown: {
    android: number
    ios: number
    other: number
    unknown: number
  }
  activeLocations: NotificationPreviewLocation[]
}

export interface NotificationSendPayload {
  title: string
  body: string
  targetType: NotificationTargetType
  audience?: NotificationAudience
  data?: Record<string, unknown>
  userIds?: number[]
  localityId?: number
  centerLat?: number
  centerLng?: number
  radiusKm?: number
  maxLocationAgeMinutes?: number
}

export interface NotificationDispatchResult {
  notificationId: number
  totalRecipients: number
  sent: number
  failed: number
  withoutToken: number
}

export interface NotificationHistoryItem {
  id: number
  title: string
  body: string
  data?: Record<string, unknown> | null
  targetType: NotificationTargetType
  targetPayload?: Record<string, unknown> | null
  audience?: NotificationAudience | null
  maxLocationAgeMinutes?: number | null
  createdAt: string
  createdBy?: {
    id: number
    name: string
    email: string
  } | null
  stats: {
    totalRecipients: number
    sent: number
    failed: number
    withoutToken: number
  }
}

export interface NotificationHistoryResponse {
  items: NotificationHistoryItem[]
  meta: {
    total: number
    page: number
    limit: number
  }
}

export interface NotificationRecipientDetails {
  id: number
  userAppId: number
  deliveryStatus: string
  deliveredAt?: string | null
  readAt?: string | null
  lastError?: string | null
  createdAt?: string
  updatedAt?: string
  userApp?: {
    id: number
    name: string
    email?: string | null
    telefone?: string | null
    tipo?: string | null
  } | null
}

export interface NotificationDetails {
  notification: NotificationHistoryItem
  recipients: NotificationRecipientDetails[]
}

export interface NotificationLocalityPayload {
  name: string
  description?: string
  centerLat: number
  centerLng: number
  radiusKm: number
  maxLocationAgeMinutes?: number
}
