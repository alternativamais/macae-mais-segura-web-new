export type SharedAssetType =
  | "point"
  | "totem"
  | "camera"
  | "network_equipment"
  | "smart_switch"
  | "climate_equipment"

export interface SharedAssetCompany {
  id: number
  nome: string
}

export interface SharedAssetSummary {
  id: number
  type: SharedAssetType
  title: string
  subtitle?: string | null
  ownerEmpresaId?: number | null
  ownerEmpresaNome?: string | null
  sharedCompanyIds: number[]
  sharedCompanies: SharedAssetCompany[]
  status?: string | null
}

export interface SharedTotemTree extends SharedAssetSummary {
  cameras: SharedAssetSummary[]
  networkEquipments: SharedAssetSummary[]
  smartSwitches: SharedAssetSummary[]
  climateEquipments: SharedAssetSummary[]
}

export interface SharedPointTree extends SharedAssetSummary {
  totems: SharedTotemTree[]
  cameras: SharedAssetSummary[]
  networkEquipments: SharedAssetSummary[]
  smartSwitches: SharedAssetSummary[]
  climateEquipments: SharedAssetSummary[]
}

export interface SharedAssetsTreeResponse {
  companies: SharedAssetCompany[]
  points: SharedPointTree[]
  orphanTotems: SharedTotemTree[]
  orphanAssets: {
    cameras: SharedAssetSummary[]
    networkEquipments: SharedAssetSummary[]
    smartSwitches: SharedAssetSummary[]
    climateEquipments: SharedAssetSummary[]
  }
}
