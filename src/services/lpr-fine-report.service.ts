import api from "@/lib/api-client"
import {
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
}
