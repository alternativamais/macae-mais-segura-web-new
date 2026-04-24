import Image from "next/image"
import { cn } from "@/lib/utils"

const brandLogoLight = "/brand/logo-retangulo-fundo-branco.png"
const brandLogoDark = "/brand/logo-retangulo-fundo-preto.png"
const squareLogoLight = "/brand/logo-quadrado-fundo-branco.png"
const squareLogoDark = "/brand/logo-quadrado-fundo-preto.png"

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
    <>
      <Image
        src={squareLogoLight}
        alt="Hórus Core"
        width={size}
        height={size}
        priority={priority}
        className={cn("object-contain dark:hidden", className)}
      />
      <Image
        src={squareLogoDark}
        alt="Hórus Core"
        width={size}
        height={size}
        priority={priority}
        className={cn("hidden object-contain dark:block", className)}
      />
    </>
  )
}

export function BrandLogo({
  width = 164,
  height = 40,
  className,
  priority = false,
}: BrandLogoProps) {
  return (
    <>
      <Image
        src={brandLogoLight}
        alt="Hórus Core"
        width={width}
        height={height}
        priority={priority}
        className={cn("object-contain dark:hidden", className)}
      />
      <Image
        src={brandLogoDark}
        alt="Hórus Core"
        width={width}
        height={height}
        priority={priority}
        className={cn("hidden object-contain dark:block", className)}
      />
    </>
  )
}
