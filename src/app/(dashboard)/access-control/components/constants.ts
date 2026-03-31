import {
  AccessIpBlockMode,
  AccessRegionAction,
  AccessUserIpMatchType,
  AccessUserRuleMode,
  DayOfWeek,
} from "@/types/access-control"

export const IP_BLOCK_MODES: AccessIpBlockMode[] = ["single", "cidr", "range"]

export const REGION_ACTIONS: AccessRegionAction[] = ["block", "allow"]

export const USER_RULE_MODES: AccessUserRuleMode[] = ["allow", "block"]

export const USER_IP_MATCH_TYPES: AccessUserIpMatchType[] = ["single", "cidr", "range"]

export const DAYS_OF_WEEK: DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]

export const DEFAULT_TIMEZONE = "America/Sao_Paulo"
