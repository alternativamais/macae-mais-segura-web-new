export type CompanyAssetType =
  | "logo_light"
  | "logo_dark"
  | "logo_square_light"
  | "logo_square_dark"
  | "point_pin"
  | "totem_pin";

export interface CompanyAsset {
  id: number;
  empresaId: number;
  assetType: CompanyAssetType;
  fileUrl: string;
  originalFileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  createdAt: string;
  isActive: boolean;
}

export interface CompanyAssetDraft {
  assetType: CompanyAssetType;
  file: File;
  previewUrl: string;
  fileName: string;
}

export interface Empresa {
  id: number;
  nome: string;
  cnpj?: string | null;
  status: 'active' | 'inactive';
  logoUrl?: string | null;
  logoIconUrl?: string | null;
  logoLightUrl?: string | null;
  logoDarkUrl?: string | null;
  logoSquareLightUrl?: string | null;
  logoSquareDarkUrl?: string | null;
  pointPinUrl?: string | null;
  totemPinUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
