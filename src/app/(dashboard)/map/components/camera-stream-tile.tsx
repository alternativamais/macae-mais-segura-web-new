"use client"

import { useTranslator } from "@/lib/i18n"
import type { Camera } from "@/types/camera"

interface CameraStreamTileProps {
  camera: Camera
}

export function CameraStreamTile({ camera }: CameraStreamTileProps) {
  const t = useTranslator("operational_map.preview.camera")

  return (
    <div className="group relative aspect-video overflow-hidden rounded-lg border bg-black flex items-center justify-center">
      
      <div className="text-gray-500 text-sm">
        {t("stream_removed", { defaultValue: "Video Stream Removed" })}
      </div>

      <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 bg-gradient-to-b from-black/70 to-transparent px-3 py-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">
            {camera.nome || t("untitled", { id: camera.id })}
          </p>
        </div>
      </div>

    </div>
  )
}

