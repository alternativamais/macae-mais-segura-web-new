import api from "@/lib/api-client"
import { UiSettings, UpdateUiSettingsPayload } from "@/types/ui-settings"

export const uiSettingsService = {
  getSettings: async (): Promise<UiSettings> => {
    const { data } = await api.get<UiSettings>("/ui-settings")
    return data
  },

  updateSettings: async (
    payload: UpdateUiSettingsPayload,
  ): Promise<UiSettings> => {
    const { data } = await api.put<UiSettings>("/ui-settings", payload)
    return data
  },
}
