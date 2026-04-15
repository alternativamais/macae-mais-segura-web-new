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
      <img
        src={squareLogoLight}
        alt="Hórus Core"
        width={size}
        height={size}
        className={cn("h-auto w-auto object-contain dark:hidden", className)}
      />
      <img
        src={squareLogoDark}
        alt="Hórus Core"
        width={size}
        height={size}
        className={cn("hidden h-auto w-auto object-contain dark:block", className)}
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
      <img
        src={brandLogoLight}
        alt="Hórus Core"
        width={width}
        height={height}
        className={cn("h-auto w-auto object-contain dark:hidden", className)}
      />
      <img
        src={brandLogoDark}
        alt="Hórus Core"
        width={width}
        height={height}
        className={cn("hidden h-auto w-auto object-contain dark:block", className)}
      />
    </>
  )
}
