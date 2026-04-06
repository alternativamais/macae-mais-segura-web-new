"use client"

import { useEffect, useRef, useState } from "react"
import { Expand, Loader2, RefreshCcw, Shrink } from "lucide-react"
import type Hls from "hls.js"
import { Button } from "@/components/ui/button"
import { AUTH_TOKEN_KEY } from "@/lib/auth-session"
import { useTranslator } from "@/lib/i18n"
import { mapService } from "@/services/map.service"
import { Camera } from "@/types/camera"

interface CameraStreamTileProps {
  camera: Camera
}

export function CameraStreamTile({ camera }: CameraStreamTileProps) {
  const t = useTranslator("operational_map.preview.camera")
  const containerRef = useRef<HTMLDivElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const hlsRef = useRef<Hls | null>(null)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [streamMode, setStreamMode] = useState<"webrtc" | "hls">("webrtc")

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [])

  useEffect(() => {
    if (!camera?.id) {
      return
    }

    let mounted = true
    let silentRetries = 0
    const maxSilentRetries = 3
    let fallbackStarted = false

    const cleanupPeerConnection = () => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
        peerConnectionRef.current = null
      }
    }

    const cleanupHls = () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }

    const clearVideoElement = () => {
      if (!videoRef.current) {
        return
      }

      videoRef.current.pause()
      videoRef.current.removeAttribute("src")
      videoRef.current.srcObject = null
      videoRef.current.load()
    }

    const startHls = async (hlsUrl?: string | null) => {
      if (!mounted) {
        return
      }

      if (!hlsUrl) {
        setError(t("errors.no_stream"))
        setIsLoading(false)
        return
      }

      fallbackStarted = true
      cleanupPeerConnection()
      cleanupHls()
      clearVideoElement()
      setStreamMode("hls")
      setError("")
      setIsLoading(true)

      const video = videoRef.current
      if (!video) {
        return
      }

      try {
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = hlsUrl
          await video.play().catch(() => undefined)
          if (mounted) {
            setIsLoading(false)
          }
          return
        }

        const { default: Hls } = await import("hls.js")

        if (!mounted) {
          return
        }

        if (!Hls.isSupported()) {
          setError(t("errors.hls_unsupported"))
          setIsLoading(false)
          return
        }

        const hls = new Hls({
          lowLatencyMode: true,
          backBufferLength: 30,
        })

        hlsRef.current = hls
        hls.loadSource(hlsUrl)
        hls.attachMedia(video)

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          void video.play().catch(() => undefined)
          if (mounted) {
            setIsLoading(false)
          }
        })

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (!mounted || !data.fatal) {
            return
          }

          setError(t("errors.hls_failed"))
          setIsLoading(false)
        })
      } catch (streamError) {
        if (!mounted) {
          return
        }

        const message =
          streamError instanceof Error && streamError.message
            ? streamError.message
            : t("errors.hls_failed")

        setError(message)
        setIsLoading(false)
      }
    }

    const startWebRtc = async () => {
      try {
        const info = await mapService.getCameraStreamInfo(camera.id)

        if (!mounted) {
          return
        }

        if (!info?.webRtcUrl) {
          await startHls(info?.hlsUrl)
          return
        }

        cleanupPeerConnection()
        cleanupHls()
        clearVideoElement()
        setStreamMode("webrtc")
        setError("")
        setIsLoading(true)

        const peerConnection = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        })

        peerConnectionRef.current = peerConnection

        peerConnection.addTransceiver("video", { direction: "recvonly" })

        peerConnection.ontrack = (event) => {
          if (!mounted || !videoRef.current) {
            return
          }

          videoRef.current.srcObject = event.streams[0]
          setStreamMode("webrtc")
          setError("")
          setIsLoading(false)
        }

        peerConnection.oniceconnectionstatechange = () => {
          if (
            peerConnection.iceConnectionState === "failed" ||
            peerConnection.iceConnectionState === "disconnected"
          ) {
            if (fallbackStarted) {
              return
            }

            void startHls(info.hlsUrl)
          }
        }

        const offer = await peerConnection.createOffer()
        await peerConnection.setLocalDescription(offer)

        await new Promise<void>((resolve) => {
          if (peerConnection.iceGatheringState === "complete") {
            resolve()
            return
          }

          const checkState = () => {
            if (peerConnection.iceGatheringState === "complete") {
              peerConnection.removeEventListener("icegatheringstatechange", checkState)
              window.clearTimeout(timeoutId)
              resolve()
            }
          }

          peerConnection.addEventListener("icegatheringstatechange", checkState)
          const timeoutId = window.setTimeout(() => {
            peerConnection.removeEventListener("icegatheringstatechange", checkState)
            resolve()
          }, 3_000)
        })

        const token =
          typeof window !== "undefined" ? localStorage.getItem(AUTH_TOKEN_KEY) : null

        const response = await fetch(info.webRtcUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            sdp: peerConnection.localDescription?.sdp,
          }),
        })

        if (!response.ok) {
          if ((response.status === 400 || response.status === 404) && silentRetries < maxSilentRetries) {
            silentRetries += 1
            cleanupPeerConnection()

            window.setTimeout(() => {
              if (mounted) {
                void startWebRtc()
              }
            }, 2_500)

            return
          }

          await startHls(info.hlsUrl)
          return
        }

        const answerSdp = await response.text()

        await peerConnection.setRemoteDescription({
          type: "answer",
          sdp: answerSdp,
        })

        void videoRef.current?.play().catch(() => undefined)
      } catch (streamError) {
        if (!mounted) {
          return
        }

        const info = await mapService.getCameraStreamInfo(camera.id).catch(() => null)
        if (info?.hlsUrl && !fallbackStarted) {
          await startHls(info.hlsUrl)
          return
        }

        const message =
          streamError instanceof Error && streamError.message
            ? streamError.message
            : t("errors.generic")

        setError(message)
        setIsLoading(false)
      }
    }

    setIsLoading(true)
    setError("")
    setStreamMode("webrtc")
    void startWebRtc()

    return () => {
      mounted = false
      cleanupPeerConnection()
      cleanupHls()
      clearVideoElement()
    }
  }, [camera?.id, retryCount, t])

  const handleRetry = () => {
    setRetryCount((current) => current + 1)
  }

  const handleToggleFullscreen = async () => {
    if (!containerRef.current) {
      return
    }

    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen().catch(() => undefined)
      return
    }

    await document.exitFullscreen().catch(() => undefined)
  }

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
        onClick={() => void handleToggleFullscreen()}
        onDoubleClick={() => void handleToggleFullscreen()}
      />

      <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 bg-gradient-to-b from-black/70 to-transparent px-3 py-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">
            {camera.nome || t("untitled", { id: camera.id })}
          </p>
          <p className="text-xs text-white/70">
            {streamMode === "hls" ? t("mode_hls") : t("mode_webrtc")}
          </p>
        </div>

        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="h-8 w-8 cursor-pointer opacity-0 transition-opacity group-hover:opacity-100"
          onClick={() => void handleToggleFullscreen()}
        >
          {isFullscreen ? <Shrink className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
        </Button>
      </div>

      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
          <span className="inline-flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            {streamMode === "hls" ? t("loading_hls") : t("loading")}
          </span>
        </div>
      ) : null}

      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 px-4 text-center text-white">
          <p className="text-sm text-red-300">{error}</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="cursor-pointer border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
            onClick={handleRetry}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            {t("retry")}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
