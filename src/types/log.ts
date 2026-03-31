export type LogType = "api" | "audit"
export type LogLevel = "error" | "warn" | "info" | "debug" | string
export type ClientOrigin = "app" | "web" | "unknown"

export interface BaseLog {
  id: number
  level?: LogLevel
  message?: string
  createdAt: string
  userId?: number | null
  userUsername?: string
  userName?: string
  ip?: string
  clientOrigin?: ClientOrigin
  requestId?: string
}

export interface ApiLogRecord extends BaseLog {
  method?: string
  url?: string
  statusCode?: number
  durationMs?: number
  controller?: string
  handler?: string
  userAgent?: string
  params?: unknown
  query?: unknown
  body?: unknown
  errorName?: string
  errorMessage?: string
  stack?: string
}

export interface AuditLogRecord extends BaseLog {
  action?: string
  entity?: string
  entityId?: string
  source?: string
  context?: unknown
}

export type LogRecord = ApiLogRecord | AuditLogRecord

export interface LogsListResponse<T = LogRecord> {
  items: T[]
  total: number
}

export interface LogsQueryParams {
  type: LogType
  page: number
  pageSize: number
  level?: string
  method?: string
  url?: string
  userId?: string
  requestId?: string
  message?: string
  error?: string
  action?: string
  entity?: string
  clientOrigin?: ClientOrigin
  dateFrom?: string
  dateTo?: string
}
