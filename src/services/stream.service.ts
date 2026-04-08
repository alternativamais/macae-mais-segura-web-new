import api from "@/lib/api-client"
import { CameraStreamInfo } from "@/types/map"

const STREAM_INFO_TTL_MS = 60_000

const streamInfoCache = new Map<number, { data: CameraStreamInfo; expiresAt: number }>()
const streamInfoInFlight = new Map<number, Promise<CameraStreamInfo>>()

export const streamService = {
  /**
   * Busca as URLs de streaming (HLS + WebRTC) para uma câmera.
   * Internamente, a API registra o path no MediaMTX e retorna as URLs proxy.
   */
  getStreamInfo: async (cameraId: number): Promise<CameraStreamInfo> => {
    const cached = streamInfoCache.get(cameraId)
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data
    }

    const pending = streamInfoInFlight.get(cameraId)
    if (pending) {
      return pending
    }

    const request = api
      .get<CameraStreamInfo>(`/streams/${cameraId}`)
      .then(({ data }) => {
        streamInfoCache.set(cameraId, {
          data,
          expiresAt: Date.now() + STREAM_INFO_TTL_MS,
        })
        return data
      })
      .finally(() => {
        streamInfoInFlight.delete(cameraId)
      })

    streamInfoInFlight.set(cameraId, request)
    return request
  },
}
