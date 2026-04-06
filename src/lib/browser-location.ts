"use client"

export interface BrowserCoordinates {
  latitude: number
  longitude: number
}

export async function captureBrowserLocation(): Promise<BrowserCoordinates | null> {
  if (typeof window === "undefined" || !navigator.geolocation) {
    return null
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          resolve(null)
          return
        }

        resolve({ latitude, longitude })
      },
      () => resolve(null),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    )
  })
}
