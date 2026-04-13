import { Camera } from "@/types/camera"
import { SmartSwitch, SmartSwitchPowerState } from "@/types/smart-switch"
import { Totem } from "@/types/totem"

export interface MapPointCameraSummary {
  id: number
  nome?: string | null
  status?: "active" | "inactive" | string
}

export interface MapPointDeviceGroup {
  cameras?: MapPointCameraSummary[]
  smartSwitches?: number
  climateEquipments?: number
}

export interface MapPointTotemSummary {
  id: number
  numero?: string | null
  status?: "active" | "inactive" | string
  devices?: MapPointDeviceGroup
}

export interface OperationalMapPoint {
  id: number
  nome: string
  coordenadas: string
  pontoDeReferencia?: string | null
  status?: "active" | "inactive" | string
  empresa?: {
    id: number
    nome?: string | null
  } | null
  devices?: MapPointDeviceGroup
  totem?: MapPointTotemSummary | null
}

export interface MapCoordinates {
  lat: number
  lng: number
}

export interface OperationalMapMarker {
  id: number
  position: MapCoordinates
  point: OperationalMapPoint
}

export interface OfficerLocation {
  userId: number
  position: MapCoordinates
  name: string
  updatedAt: string
  disponivel?: boolean | null
  avatarUrl?: string | null
  tipo?: string
}

export interface CameraStreamInfo {
  hlsUrl: string
  webRtcUrl: string
}

export interface MapPreviewContext {
  marker: OperationalMapMarker
  totemDetails: Totem | null
  cameras: Camera[]
  smartSwitch: SmartSwitch | null
  smartSwitchState: SmartSwitchPowerState
}
