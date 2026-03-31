import api from "@/lib/api-client"
import {
  AccessIpBlock,
  AccessRegionRule,
  AccessUserIpRule,
  AccessUserScheduleRule,
  CreateAccessIpBlockPayload,
  CreateAccessRegionRulePayload,
  CreateAccessUserIpRulePayload,
  CreateAccessUserScheduleRulePayload,
  UpdateAccessIpBlockPayload,
  UpdateAccessRegionRulePayload,
  UpdateAccessUserIpRulePayload,
  UpdateAccessUserScheduleRulePayload,
  UserLocationRecord,
} from "@/types/access-control"
import { User } from "@/types/user"

const basePath = "/access-control"

export const accessControlService = {
  findUsers: async (): Promise<User[]> => {
    const { data } = await api.get<User[]>(`${basePath}/users`)
    return data
  },

  findIpBlocks: async (): Promise<AccessIpBlock[]> => {
    const { data } = await api.get<AccessIpBlock[]>(`${basePath}/ip-blocks`)
    return data
  },

  createIpBlock: async (
    payload: CreateAccessIpBlockPayload
  ): Promise<AccessIpBlock> => {
    const { data } = await api.post<AccessIpBlock>(`${basePath}/ip-blocks`, payload)
    return data
  },

  updateIpBlock: async (
    id: number,
    payload: UpdateAccessIpBlockPayload
  ): Promise<AccessIpBlock> => {
    const { data } = await api.put<AccessIpBlock>(`${basePath}/ip-blocks/${id}`, payload)
    return data
  },

  deleteIpBlock: async (id: number): Promise<void> => {
    await api.delete(`${basePath}/ip-blocks/${id}`)
  },

  findRegionRules: async (): Promise<AccessRegionRule[]> => {
    const { data } = await api.get<AccessRegionRule[]>(`${basePath}/region-rules`)
    return data
  },

  createRegionRule: async (
    payload: CreateAccessRegionRulePayload
  ): Promise<AccessRegionRule> => {
    const { data } = await api.post<AccessRegionRule>(`${basePath}/region-rules`, payload)
    return data
  },

  updateRegionRule: async (
    id: number,
    payload: UpdateAccessRegionRulePayload
  ): Promise<AccessRegionRule> => {
    const { data } = await api.put<AccessRegionRule>(
      `${basePath}/region-rules/${id}`,
      payload
    )
    return data
  },

  deleteRegionRule: async (id: number): Promise<void> => {
    await api.delete(`${basePath}/region-rules/${id}`)
  },

  findUserIpRules: async (userId?: number): Promise<AccessUserIpRule[]> => {
    const { data } = await api.get<AccessUserIpRule[]>(`${basePath}/user-ip-rules`, {
      params: userId ? { userId } : undefined,
    })
    return data
  },

  createUserIpRule: async (
    payload: CreateAccessUserIpRulePayload
  ): Promise<AccessUserIpRule> => {
    const { data } = await api.post<AccessUserIpRule>(`${basePath}/user-ip-rules`, payload)
    return data
  },

  updateUserIpRule: async (
    id: number,
    payload: UpdateAccessUserIpRulePayload
  ): Promise<AccessUserIpRule> => {
    const { data } = await api.put<AccessUserIpRule>(
      `${basePath}/user-ip-rules/${id}`,
      payload
    )
    return data
  },

  deleteUserIpRule: async (id: number): Promise<void> => {
    await api.delete(`${basePath}/user-ip-rules/${id}`)
  },

  findUserScheduleRules: async (
    userId?: number
  ): Promise<AccessUserScheduleRule[]> => {
    const { data } = await api.get<AccessUserScheduleRule[]>(
      `${basePath}/user-schedule-rules`,
      {
        params: userId ? { userId } : undefined,
      }
    )
    return data
  },

  createUserScheduleRule: async (
    payload: CreateAccessUserScheduleRulePayload
  ): Promise<AccessUserScheduleRule> => {
    const { data } = await api.post<AccessUserScheduleRule>(
      `${basePath}/user-schedule-rules`,
      payload
    )
    return data
  },

  updateUserScheduleRule: async (
    id: number,
    payload: UpdateAccessUserScheduleRulePayload
  ): Promise<AccessUserScheduleRule> => {
    const { data } = await api.put<AccessUserScheduleRule>(
      `${basePath}/user-schedule-rules/${id}`,
      payload
    )
    return data
  },

  deleteUserScheduleRule: async (id: number): Promise<void> => {
    await api.delete(`${basePath}/user-schedule-rules/${id}`)
  },

  getLocationReport: async (userId: number): Promise<UserLocationRecord[]> => {
    const { data } = await api.get<UserLocationRecord[]>(`${basePath}/location-report`, {
      params: { userId },
    })
    return data
  },

  toggleLocationRequirement: async (
    userId: number,
    required: boolean
  ): Promise<void> => {
    await api.put(`${basePath}/users/${userId}/location-requirement`, {
      required,
    })
  },
}
