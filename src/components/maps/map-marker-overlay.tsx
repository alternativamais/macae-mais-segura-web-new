"use client"

import * as React from "react"
import { OVERLAY_MOUSE_TARGET, OverlayViewF } from "@react-google-maps/api"

type MapMarkerOverlayProps = {
  position: google.maps.LatLngLiteral
  title?: string
  zIndex?: number
  onClick?: () => void
  children: React.ReactNode
  className?: string
}

export function MapMarkerOverlay({
  position,
  title,
  zIndex,
  onClick,
  children,
  className,
}: MapMarkerOverlayProps) {
  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!onClick) {
        return
      }

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault()
        onClick()
      }
    },
    [onClick],
  )

  return (
    <OverlayViewF position={position} mapPaneName={OVERLAY_MOUSE_TARGET}>
      <div
        title={title}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        className={className}
        style={{
          transform: "translate(-50%, -100%)",
          position: "relative",
          zIndex,
          pointerEvents: "auto",
          outline: "none",
        }}
      >
        {children}
      </div>
    </OverlayViewF>
  )
}
