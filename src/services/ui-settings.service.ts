import api from "@/lib/api-client"
import { UiSettings, UpdateUiSettingsPayload } from "@/types/ui-settings"

export const uiSettingsService = {
  getSettings: async (empresaId?: number): Promise<UiSettings> => {
    const { data } = await api.get<UiSettings>("/ui-settings", {
      params: empresaId ? { empresaId } : undefined,
    })
    return data
  },

  updateSettings: async (
    payload: UpdateUiSettingsPayload,
    empresaId?: number,
  ): Promise<UiSettings> => {
    const { data } = await api.put<UiSettings>("/ui-settings", {
      ...payload,
      ...(empresaId ? { empresaId } : {}),
    })
    return data
  },
}
