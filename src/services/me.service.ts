import api from "@/lib/api-client"
import { MyProfile, UpdateMyProfilePayload } from "@/types/me"

export const meService = {
  getProfile: async (): Promise<MyProfile> => {
    const { data } = await api.get<MyProfile>("/me")
    return data
  },

  updateProfile: async (payload: UpdateMyProfilePayload): Promise<MyProfile> => {
    const { data } = await api.put<MyProfile>("/me", payload)
    return data
  },
}
