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
const SILENT_RETRY_DELAY_MS = 2500

export function CameraStreamTile({ camera }: CameraStreamTileProps) {
  const t = useTranslator("operational_map.preview.camera")

  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)

  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [retryCount, setRetryCount] = useState(0)
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

  // ---------- WebRTC WHEP (idêntico ao legado) ----------
  useEffect(() => {
    if (!camera?.id) return

    let mounted = true
    let silentRetries = 0

    setStatus("connecting")
    setErrorMessage("")

    const startWebRTC = async () => {
      try {
        const info = await streamService.getStreamInfo(camera.id)

        if (!mounted) return
        if (!info || !info.webRtcUrl) {
          throw new Error(t("errors.no_stream"))
        }

        const webRtcUrl = info.webRtcUrl
        const video = videoRef.current

        // Limpa a conexão anterior se houver
        if (pcRef.current) {
          pcRef.current.close()
        }

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
            setStatus("connected")
          }
        }

        pc.oniceconnectionstatechange = () => {
          if (
            pc.iceConnectionState === "failed" ||
            pc.iceConnectionState === "disconnected"
          ) {
            if (mounted) {
              setErrorMessage(t("errors.connection_lost"))
              setStatus("error")
            }
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
          if (response.status === 400 && silentRetries < MAX_SILENT_RETRIES) {
            silentRetries++
            if (pcRef.current) pcRef.current.close()
            setTimeout(() => {
              if (mounted) startWebRTC()
            }, SILENT_RETRY_DELAY_MS)
            return
          }
          throw new Error(t("errors.upstream_failure", { status: String(response.status) }))
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
          setErrorMessage(
            err instanceof Error ? err.message : t("errors.generic"),
          )
          setStatus("error")
        }
      }
    }

    startWebRTC()

    return () => {
      mounted = false
      if (pcRef.current) {
        pcRef.current.close()
        pcRef.current = null
      }
      if (videoRef.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        videoRef.current.srcObject = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera?.id, retryCount])

  const handleRetry = () => {
    if (pcRef.current) {
      pcRef.current.close()
      pcRef.current = null
    }
    setRetryCount((c) => c + 1)
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
        <div className="pointer-events-auto absolute right-2 bottom-2 z-20 opacity-0 transition-opacity group-hover:opacity-100">
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
