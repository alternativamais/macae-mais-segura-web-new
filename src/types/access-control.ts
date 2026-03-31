import { User } from "./user"

export type AccessIpBlockMode = "single" | "cidr" | "range"
export type AccessRegionAction = "allow" | "block"
export type AccessUserRuleMode = "allow" | "block"
export type AccessUserIpMatchType = "single" | "cidr" | "range"
export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday"

export interface AccessIpBlock {
  id: number
  label?: string
  mode: AccessIpBlockMode
  ipValue?: string
  rangeStart?: string
  rangeEnd?: string
  cidr?: string
  active: boolean
  description?: string
  createdAt?: string
  updatedAt?: string
}

export interface CreateAccessIpBlockPayload {
  label?: string
  mode: AccessIpBlockMode
  value?: string
  rangeStart?: string
  rangeEnd?: string
  description?: string
  active?: boolean
}

export type UpdateAccessIpBlockPayload = Partial<CreateAccessIpBlockPayload>

export interface AccessRegionRule {
  id: number
  action: AccessRegionAction
  regionType?: "country"
  code: string
  description?: string
  active: boolean
  createdAt?: string
  updatedAt?: string
}

export interface CreateAccessRegionRulePayload {
  action: AccessRegionAction
  code: string
  description?: string
  active?: boolean
}

export type UpdateAccessRegionRulePayload = Partial<CreateAccessRegionRulePayload>

export interface AccessUserIpRule {
  id: number
  userId: number
  user?: User
  mode: AccessUserRuleMode
  matchType: AccessUserIpMatchType
  ipValue?: string
  rangeStart?: string
  rangeEnd?: string
  cidr?: string
  description?: string
  active: boolean
  createdAt?: string
  updatedAt?: string
}

export interface CreateAccessUserIpRulePayload {
  userId: number
  mode: AccessUserRuleMode
  matchType: AccessUserIpMatchType
  value?: string
  rangeStart?: string
  rangeEnd?: string
  description?: string
  active?: boolean
}

export type UpdateAccessUserIpRulePayload = Partial<CreateAccessUserIpRulePayload>

export interface AccessUserScheduleRule {
  id: number
  userId: number
  user?: User
  mode: AccessUserRuleMode
  startTime: string
  endTime: string
  daysOfWeek?: DayOfWeek[] | null
  timezone?: string
  description?: string
  active: boolean
  createdAt?: string
  updatedAt?: string
}

export interface CreateAccessUserScheduleRulePayload {
  userId: number
  mode: AccessUserRuleMode
  startTime: string
  endTime: string
  daysOfWeek?: DayOfWeek[]
  timezone?: string
  description?: string
  active?: boolean
}

export type UpdateAccessUserScheduleRulePayload =
  Partial<CreateAccessUserScheduleRulePayload>

export interface UserLocationRecord {
  id: number
  userId: number
  latitude: number | string
  longitude: number | string
  createdAt: string
}
