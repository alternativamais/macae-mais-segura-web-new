import api from "@/lib/api-client"
import { SharedAssetType, SharedAssetsTreeResponse } from "@/types/shared-asset"

export const sharedAssetService = {
  getTree: async (params?: { empresaId?: number }) => {
    const { data } = await api.get<SharedAssetsTreeResponse>("/shared-assets/tree", {
      params,
    })
    return data
  },

  updateCompanyAccess: async (
    assetType: SharedAssetType,
    assetId: number,
    payload: {
      companyIds: number[]
      applyToDescendants?: boolean
    },
  ) => {
    const { data } = await api.put<{ updated: boolean; affectedAssets: number }>(
      `/shared-assets/${assetType}/${assetId}/company-access`,
      payload,
    )
    return data
  },
}
