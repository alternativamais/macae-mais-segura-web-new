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
  getStreamInfo: async (
    cameraId: number,
    options?: { forceRefresh?: boolean },
  ): Promise<CameraStreamInfo> => {
    const forceRefresh = options?.forceRefresh === true
    const cached = streamInfoCache.get(cameraId)
    if (!forceRefresh && cached && cached.expiresAt > Date.now()) {
      return cached.data
    }

    const pending = streamInfoInFlight.get(cameraId)
    if (!forceRefresh && pending) {
      return pending
    }

    if (forceRefresh) {
      streamInfoCache.delete(cameraId)
      streamInfoInFlight.delete(cameraId)
    }

    const request = api
      .get<CameraStreamInfo>(`/streams/${cameraId}`, {
        params: forceRefresh ? { forceRefresh: true } : undefined,
      })
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

  deleteWebRtcSession: async (sessionUrl: string) => {
    if (!sessionUrl.trim()) {
      return
    }

    await api.delete("/streams/webrtc-session", {
      data: { sessionUrl },
    }).catch(() => undefined)
  },
}
