import api from "@/lib/api-client"
import { CameraStreamInfo } from "@/types/map"

export const streamService = {
  /**
   * Busca as URLs de streaming (HLS + WebRTC) para uma câmera.
   * Internamente, a API registra o path no MediaMTX e retorna as URLs proxy.
   */
  getStreamInfo: async (cameraId: number): Promise<CameraStreamInfo> => {
    const { data } = await api.get<CameraStreamInfo>(`/streams/${cameraId}`)
    return data
  },
}
