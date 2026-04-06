"use client"

import { useEffect, useRef, useState } from "react"
import { Expand, Loader2, RefreshCcw, Shrink } from "lucide-react"
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
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

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

    setIsLoading(true)
    setError("")

    const startWebRtc = async () => {
      try {
        const info = await mapService.getCameraStreamInfo(camera.id)

        if (!mounted) {
          return
        }

        if (!info?.webRtcUrl) {
          throw new Error(t("errors.no_stream"))
        }

        if (peerConnectionRef.current) {
          peerConnectionRef.current.close()
        }

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
          setIsLoading(false)
        }

        peerConnection.oniceconnectionstatechange = () => {
          if (
            peerConnection.iceConnectionState === "failed" ||
            peerConnection.iceConnectionState === "disconnected"
          ) {
            setError(t("errors.connection_lost"))
            setIsLoading(false)
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
          if (response.status === 400 && silentRetries < maxSilentRetries) {
            silentRetries += 1

            if (peerConnectionRef.current) {
              peerConnectionRef.current.close()
            }

            window.setTimeout(() => {
              if (mounted) {
                void startWebRtc()
              }
            }, 2_500)

            return
          }

          throw new Error(t("errors.upstream_failure", { status: response.status }))
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

        const message =
          streamError instanceof Error && streamError.message
            ? streamError.message
            : t("errors.generic")

        setError(message)
        setIsLoading(false)
      }
    }

    void startWebRtc()

    return () => {
      mounted = false

      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
        peerConnectionRef.current = null
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
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
      className="group relative overflow-hidden rounded-lg border bg-black aspect-video"
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
            {t("loading")}
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
