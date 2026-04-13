import { Empresa, CompanyAssetType } from "@/types/empresa"

export const COMPANY_ASSET_TYPE_ORDER: CompanyAssetType[] = [
  "logo_light",
  "logo_dark",
  "logo_square_light",
  "logo_square_dark",
  "point_pin",
  "totem_pin",
]

export const COMPANY_ASSET_PRESETS: Record<
  CompanyAssetType,
  {
    aspectRatio: number
    outputWidth: number
    outputHeight: number
    variant: "wide" | "square" | "pin"
    companyField: keyof Pick<
      Empresa,
      | "logoLightUrl"
      | "logoDarkUrl"
      | "logoSquareLightUrl"
      | "logoSquareDarkUrl"
      | "pointPinUrl"
      | "totemPinUrl"
    >
  }
> = {
  logo_light: {
    aspectRatio: 200 / 36,
    outputWidth: 1200,
    outputHeight: 216,
    variant: "wide",
    companyField: "logoLightUrl",
  },
  logo_dark: {
    aspectRatio: 200 / 36,
    outputWidth: 1200,
    outputHeight: 216,
    variant: "wide",
    companyField: "logoDarkUrl",
  },
  logo_square_light: {
    aspectRatio: 1,
    outputWidth: 768,
    outputHeight: 768,
    variant: "square",
    companyField: "logoSquareLightUrl",
  },
  logo_square_dark: {
    aspectRatio: 1,
    outputWidth: 768,
    outputHeight: 768,
    variant: "square",
    companyField: "logoSquareDarkUrl",
  },
  point_pin: {
    aspectRatio: 1,
    outputWidth: 768,
    outputHeight: 768,
    variant: "pin",
    companyField: "pointPinUrl",
  },
  totem_pin: {
    aspectRatio: 1,
    outputWidth: 768,
    outputHeight: 768,
    variant: "pin",
    companyField: "totemPinUrl",
  },
}

export function getCompanyAssetUrl(
  company: Empresa | undefined,
  assetType: CompanyAssetType,
) {
  if (!company) {
    return null
  }

  const field = COMPANY_ASSET_PRESETS[assetType].companyField
  const value = company[field]

  return typeof value === "string" ? value : null
}
