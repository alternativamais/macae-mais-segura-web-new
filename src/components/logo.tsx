import Image from "next/image"
import { cn } from "@/lib/utils"
import iconFull from "../../icon.svg"
import iconMini from "../../icon_mini.svg"

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
    <Image
      src={iconMini}
      alt="Alternativa Base"
      width={size}
      height={size}
      priority={priority}
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
    <Image
      src={iconFull}
      alt="Alternativa Base"
      width={width}
      height={height}
      priority={priority}
      className={cn("h-auto w-auto object-contain", className)}
    />
  )
}
