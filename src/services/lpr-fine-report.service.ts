import api from "@/lib/api-client"
import {
  LprFineDispatchLogListParams,
  LprFineDispatchLogListResponse,
  LprFineReport,
  LprFineReportListParams,
  LprFineReportListResponse,
} from "@/types/lpr-fine-report"

const basePath = "/lpr-fines"

export const lprFineReportService = {
  findAll: async (params?: LprFineReportListParams) => {
    const { data } = await api.get<LprFineReportListResponse>(basePath, { params })
    return data
  },

  findOne: async (id: number) => {
    const { data } = await api.get<LprFineReport>(`${basePath}/${id}`)
    return data
  },

  findDeliveries: async (id: number, params?: LprFineDispatchLogListParams) => {
    const { data } = await api.get<LprFineDispatchLogListResponse>(`${basePath}/${id}/deliveries`, { params })
    return data
  },
}
