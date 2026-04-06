import api from "@/lib/api-client"
import { CameraStreamInfo, OperationalMapPoint } from "@/types/map"

export const mapService = {
  findPoints: async () => {
    const { data } = await api.get<OperationalMapPoint[]>("/pontos/mapa")
    return Array.isArray(data) ? data : []
  },

  getCameraStreamInfo: async (cameraId: number) => {
    const { data } = await api.get<CameraStreamInfo>(`/streams/${cameraId}`)
    return data
  },
}
