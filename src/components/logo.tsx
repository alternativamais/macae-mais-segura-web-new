import { cn } from "@/lib/utils"

const iconFull = "/brand/icon.svg"
const iconMini = "/brand/icon_mini.svg"

interface BaseLogoProps {
  className?: string
  priority?: boolean
}

interface LogoProps extends BaseLogoProps {
  size?: number
}

interface BrandLogoProps extends BaseLogoProps {
  width?: number
  height?: number
}

export function Logo({
  size = 24,
  className,
  priority = false,
}: LogoProps) {
  return (
    <img
      src={iconMini}
      alt="Hórus Core"
      width={size}
      height={size}
      className={cn("h-auto w-auto object-contain", className)}
    />
  )
}

export function BrandLogo({
  width = 164,
  height = 40,
  className,
  priority = false,
}: BrandLogoProps) {
  return (
    <img
      src={iconFull}
      alt="Hórus Core"
      width={width}
      height={height}
      className={cn("h-auto w-auto object-contain", className)}
    />
  )
}
