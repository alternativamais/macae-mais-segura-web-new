"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Loader2, Maximize, Minimize, RefreshCw, Video, Wifi, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslator } from "@/lib/i18n"
import { AUTH_TOKEN_KEY } from "@/lib/auth-session"
import { streamService } from "@/services/stream.service"
import type { Camera } from "@/types/camera"

interface CameraStreamTileProps {
  camera: Camera | { id: number; nome?: string | null; status?: string }
}

const MAX_SILENT_RETRIES = 3
const SILENT_RETRY_DELAY_MS = 1200
const MAX_PARALLEL_CAMERA_BOOTSTRAPS = 2
const DISCONNECT_GRACE_MS = 2000
const STALL_CHECK_INTERVAL_MS = 2000
const MAX_STALL_TICKS = 3

let activeCameraBootstraps = 0
const waitingCameraBootstraps: Array<() => void> = []

async function acquireCameraBootstrapSlot() {
  if (activeCameraBootstraps < MAX_PARALLEL_CAMERA_BOOTSTRAPS) {
    activeCameraBootstraps += 1
    return
  }

  await new Promise<void>((resolve) => {
    waitingCameraBootstraps.push(() => {
      activeCameraBootstraps += 1
      resolve()
    })
  })
}

function releaseCameraBootstrapSlot() {
  activeCameraBootstraps = Math.max(0, activeCameraBootstraps - 1)
  const next = waitingCameraBootstraps.shift()
  next?.()
}

export function CameraStreamTile({ camera }: CameraStreamTileProps) {
  const t = useTranslator("operational_map.preview.camera")

  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const disconnectTimerRef = useRef<number | null>(null)
  const retryTimerRef = useRef<number | null>(null)
  const stallTimerRef = useRef<number | null>(null)
  const sessionUrlRef = useRef<string | null>(null)
  const silentRetriesRef = useRef(0)
  const forceRefreshNextRef = useRef(false)
  const recoveryInFlightRef = useRef(false)
  const suppressPeerEventsRef = useRef(false)
  const lastVideoTimeRef = useRef(0)
  const lastDecodedFramesRef = useRef<number | null>(null)
  const stagnantTicksRef = useRef(0)

  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [retryToken, setRetryToken] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  // ---------- Fullscreen ----------
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", onFsChange)
    return () => document.removeEventListener("fullscreenchange", onFsChange)
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }, [])

  const clearDisconnectTimer = useCallback(() => {
    if (disconnectTimerRef.current) {
      window.clearTimeout(disconnectTimerRef.current)
      disconnectTimerRef.current = null
    }
  }, [])

  const clearRetryTimer = useCallback(() => {
    if (retryTimerRef.current) {
      window.clearTimeout(retryTimerRef.current)
      retryTimerRef.current = null
    }
  }, [])

  const clearStallTimer = useCallback(() => {
    if (stallTimerRef.current) {
      window.clearInterval(stallTimerRef.current)
      stallTimerRef.current = null
    }
  }, [])

  const resetHealthCounters = useCallback(() => {
    lastVideoTimeRef.current = 0
    lastDecodedFramesRef.current = null
    stagnantTicksRef.current = 0
  }, [])

  const teardownRemoteSession = useCallback(async () => {
    const sessionUrl = sessionUrlRef.current
    sessionUrlRef.current = null
    if (!sessionUrl) {
      return
    }
    await streamService.deleteWebRtcSession(sessionUrl)
  }, [])

  const cleanupConnection = useCallback(
    async (terminateRemoteSession = true) => {
      clearDisconnectTimer()
      clearRetryTimer()
      clearStallTimer()
      resetHealthCounters()

      const pc = pcRef.current
      pcRef.current = null
      suppressPeerEventsRef.current = true

      if (pc) {
        try {
          pc.close()
        } catch {
          // noop
        }
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null
      }

      if (terminateRemoteSession) {
        await teardownRemoteSession()
      }

      suppressPeerEventsRef.current = false
    },
    [clearDisconnectTimer, clearRetryTimer, clearStallTimer, resetHealthCounters, teardownRemoteSession],
  )

  const scheduleReconnect = useCallback(
    async ({
      forceRefresh = false,
      silent = true,
      message,
    }: {
      forceRefresh?: boolean
      silent?: boolean
      message?: string
    }) => {
      if (recoveryInFlightRef.current) {
        return
      }

      recoveryInFlightRef.current = true
      forceRefreshNextRef.current = forceRefreshNextRef.current || forceRefresh
      await cleanupConnection(true)

      if (silent && silentRetriesRef.current < MAX_SILENT_RETRIES) {
        silentRetriesRef.current += 1
        setStatus("connecting")
        setErrorMessage("")
        retryTimerRef.current = window.setTimeout(() => {
          recoveryInFlightRef.current = false
          setRetryToken((value) => value + 1)
        }, SILENT_RETRY_DELAY_MS)
        return
      }

      setErrorMessage(message || t("errors.generic"))
      setStatus("error")
    },
    [cleanupConnection, t],
  )

  const startStallMonitor = useCallback(
    (pc: RTCPeerConnection) => {
      clearStallTimer()
      resetHealthCounters()

      stallTimerRef.current = window.setInterval(async () => {
        if (pcRef.current !== pc || suppressPeerEventsRef.current) {
          return
        }

        const video = videoRef.current
        if (!video) {
          return
        }

        const connected =
          pc.connectionState === "connected" ||
          pc.iceConnectionState === "connected" ||
          pc.iceConnectionState === "completed"

        if (!connected || video.readyState < 2) {
          return
        }

        let decodedFrames: number | null = null

        try {
          const stats = await pc.getStats()
          stats.forEach((report) => {
            if (report.type === "inbound-rtp" && (report as RTCInboundRtpStreamStats).kind === "video") {
              const candidate = Number(
                (report as RTCInboundRtpStreamStats).framesDecoded ??
                  (report as RTCInboundRtpStreamStats).framesReceived ??
                  0,
              )
              if (Number.isFinite(candidate)) {
                decodedFrames = candidate
              }
            }
          })
        } catch {
          return
        }

        const currentTime = video.currentTime
        const timeProgressed = currentTime > lastVideoTimeRef.current + 0.01
        const framesProgressed =
          decodedFrames !== null &&
          (lastDecodedFramesRef.current === null || decodedFrames > lastDecodedFramesRef.current)

        lastVideoTimeRef.current = currentTime
        if (decodedFrames !== null) {
          lastDecodedFramesRef.current = decodedFrames
        }

        if (timeProgressed || framesProgressed) {
          stagnantTicksRef.current = 0
          return
        }

        stagnantTicksRef.current += 1
        if (stagnantTicksRef.current >= MAX_STALL_TICKS) {
          void scheduleReconnect({
            forceRefresh: true,
            silent: true,
            message: t("errors.stream_stalled"),
          })
        }
      }, STALL_CHECK_INTERVAL_MS)
    },
    [clearStallTimer, resetHealthCounters, scheduleReconnect, t],
  )

  // ---------- WebRTC WHEP ----------
  useEffect(() => {
    if (!camera?.id) return

    let mounted = true

    setStatus("connecting")
    setErrorMessage("")

    const startWebRTC = async () => {
      let bootstrapSlotAcquired = false

      try {
        recoveryInFlightRef.current = false
        await acquireCameraBootstrapSlot()
        bootstrapSlotAcquired = true

        const forceRefresh = forceRefreshNextRef.current
        forceRefreshNextRef.current = false

        const info = await streamService.getStreamInfo(camera.id, {
          forceRefresh,
        })

        if (!mounted) return
        if (!info || !info.webRtcUrl) {
          throw new Error(t("errors.no_stream"))
        }

        const webRtcUrl = info.webRtcUrl
        const video = videoRef.current
        await cleanupConnection(true)

        // Limpa a conexão anterior se houver
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        })
        pcRef.current = pc

        // WHEP requer transceivers em RecvOnly para receber media
        pc.addTransceiver("video", { direction: "recvonly" })

        // Binding the remote stream to the video element
        pc.ontrack = (event) => {
          if (mounted && video) {
            video.srcObject = event.streams[0]
            clearDisconnectTimer()
            resetHealthCounters()
            silentRetriesRef.current = 0
            setErrorMessage("")
            setStatus("connected")
            startStallMonitor(pc)
          }
        }

        pc.onconnectionstatechange = () => {
          if (!mounted || suppressPeerEventsRef.current) return

          if (pc.connectionState === "connected") {
            clearDisconnectTimer()
            silentRetriesRef.current = 0
            return
          }

          if (pc.connectionState === "disconnected") {
            clearDisconnectTimer()
            disconnectTimerRef.current = window.setTimeout(() => {
              if (!mounted) return
              void scheduleReconnect({
                forceRefresh: true,
                silent: true,
                message: t("errors.connection_lost"),
              })
            }, DISCONNECT_GRACE_MS)
            return
          }

          if (pc.connectionState === "failed" || pc.connectionState === "closed") {
            clearDisconnectTimer()
            void scheduleReconnect({
              forceRefresh: true,
              silent: true,
              message: t("errors.connection_lost"),
            })
          }
        }

        pc.oniceconnectionstatechange = () => {
          if (!mounted || suppressPeerEventsRef.current) return

          if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
            clearDisconnectTimer()
            setStatus("connected")
            return
          }

          if (pc.iceConnectionState === "disconnected") {
            clearDisconnectTimer()
            disconnectTimerRef.current = window.setTimeout(() => {
              if (!mounted) return
              void scheduleReconnect({
                forceRefresh: true,
                silent: true,
                message: t("errors.connection_lost"),
              })
            }, DISCONNECT_GRACE_MS)
            return
          }

          if (pc.iceConnectionState === "failed") {
            clearDisconnectTimer()
            void scheduleReconnect({
              forceRefresh: true,
              silent: true,
              message: t("errors.connection_lost"),
            })
          }
        }

        // Gerando Oferta Local (SDP Offer)
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)

        // Aguardar a finalização da coleta de ICE Candidates
        await new Promise<void>((resolve) => {
          if (pc.iceGatheringState === "complete") {
            resolve()
          } else {
            const checkState = () => {
              if (pc.iceGatheringState === "complete") {
                pc.removeEventListener("icegatheringstatechange", checkState)
                clearTimeout(timeout)
                resolve()
              }
            }
            pc.addEventListener("icegatheringstatechange", checkState)
            const timeout = setTimeout(() => {
              pc.removeEventListener("icegatheringstatechange", checkState)
              resolve()
            }, 3000)
          }
        })

        if (!mounted) return

        // Envia o SDP Offer encapsulado em JSON (via proxy da API)
        const token = localStorage.getItem(AUTH_TOKEN_KEY)
        const response = await fetch(webRtcUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ sdp: pc.localDescription!.sdp }),
        })

        if (!mounted) return

        if (!response.ok) {
          throw new Error(t("errors.upstream_failure", { status: String(response.status) }))
        }

        const whepSessionUrl =
          response.headers.get("x-whep-session") || response.headers.get("location")
        if (whepSessionUrl) {
          sessionUrlRef.current = whepSessionUrl
        }

        const answerSdp = await response.text()

        if (!mounted) return

        // Aplicando a SDP Answer do MediaMTX
        await pc.setRemoteDescription({
          type: "answer" as RTCSdpType,
          sdp: answerSdp,
        })

        // Toca automatico
        video?.play().catch(() => {})
      } catch (err) {
        if (mounted) {
          const message =
            err instanceof Error ? err.message : t("errors.generic")

          if (message === t("errors.no_stream")) {
            setErrorMessage(message)
            setStatus("error")
          } else {
            void scheduleReconnect({
              forceRefresh: true,
              silent: true,
              message,
            })
          }
        }
      } finally {
        if (bootstrapSlotAcquired) {
          releaseCameraBootstrapSlot()
        }
      }
    }

    startWebRTC()

    return () => {
      mounted = false
      void cleanupConnection(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera?.id, cleanupConnection, clearDisconnectTimer, retryToken, scheduleReconnect, startStallMonitor, t])

  const handleRetry = () => {
    silentRetriesRef.current = 0
    recoveryInFlightRef.current = false
    forceRefreshNextRef.current = true
    void cleanupConnection(true).finally(() => {
      setStatus("connecting")
      setErrorMessage("")
      setRetryToken((c) => c + 1)
    })
  }

  const cameraName = camera.nome || t("untitled", { id: String(camera.id) })

  return (
    <div
      ref={containerRef}
      className="group relative aspect-video overflow-hidden rounded-lg border bg-black"
    >
      <video
        ref={videoRef}
        className="h-full w-full object-contain"
        muted
        playsInline
        autoPlay
        onClick={toggleFullscreen}
      />

      {/* Top gradient bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between gap-2 bg-gradient-to-b from-black/70 to-transparent px-3 py-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{cameraName}</p>
        </div>
        <div className="flex items-center gap-1.5">
          {status === "connected" ? (
            <span className="flex items-center gap-1 rounded-full bg-emerald-600/80 px-2 py-0.5 text-[10px] font-medium text-white">
              <Wifi className="h-3 w-3" />
              {t("mode_webrtc")}
            </span>
          ) : status === "error" ? (
            <span className="flex items-center gap-1 rounded-full bg-red-600/80 px-2 py-0.5 text-[10px] font-medium text-white">
              <WifiOff className="h-3 w-3" />
              Offline
            </span>
          ) : null}
        </div>
      </div>

      {/* Fullscreen button */}
      {status === "connected" && (
        <div className="pointer-events-auto absolute right-2 bottom-2 z-20 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleRetry()
            }}
            className="cursor-pointer rounded-md bg-black/50 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              toggleFullscreen()
            }}
            className="cursor-pointer rounded-md bg-black/50 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>
        </div>
      )}

      {/* Loading */}
      {status === "connecting" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-white/70" />
          <p className="text-xs text-white/50">{t("loading")}</p>
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 px-4 text-center">
          <Video className="h-8 w-8 text-red-400/70" />
          <p className="max-w-[220px] text-xs leading-relaxed text-red-300/90">{errorMessage}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRetry}
            className="cursor-pointer border-white/20 bg-white/5 text-xs text-white hover:bg-white/10"
          >
            <RefreshCw className="mr-1.5 h-3 w-3" />
            {t("retry")}
          </Button>
        </div>
      )}

      {/* Idle */}
      {status === "idle" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Video className="h-6 w-6 text-white/20" />
        </div>
      )}
    </div>
  )
}
