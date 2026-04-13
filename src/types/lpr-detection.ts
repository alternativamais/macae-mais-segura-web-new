export interface LprDetectionCamera {
  id: number
  nome?: string | null
}

export interface LprDetection {
  id: number
  cameraId: number
  camera?: LprDetectionCamera | null
  plateText: string
  confidence?: number | null
  direction?: string | null
  detectedAt: string
  createdAt?: string
}

export interface LprDetectionListResponse {
  data: LprDetection[]
  meta: {
    itemCount: number
    totalItems?: number
    itemsPerPage?: number
    totalPages?: number
    currentPage?: number
  }
}

export interface LprDetectionFilters {
  page?: number
  limit?: number
  plateText?: string
  plateSearchMode?: "smart" | "exact" | "contains" | "pattern"
  cameraId?: number
  direction?: string
  minConfidence?: number
  maxConfidence?: number
  startDate?: string
  endDate?: string
}

export interface UpdateLprDetectionPayload {
  plateText?: string
  confidence?: number
}

export interface DeleteLprDetectionsBatchPayload {
  olderThan?: string
  quantity?: number
}
