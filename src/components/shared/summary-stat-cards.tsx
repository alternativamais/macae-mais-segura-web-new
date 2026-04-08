import type { ReactNode } from "react"
import { Loader2, type LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface SummaryStatItem {
  key?: string
  title: ReactNode
  value: ReactNode
  description?: ReactNode | null
  icon?: LucideIcon
  loading?: boolean
  cardClassName?: string
  titleClassName?: string
  valueClassName?: string
  descriptionClassName?: string
  iconClassName?: string
}

interface SummaryStatCardsProps {
  items: SummaryStatItem[]
  className?: string
  loadingLabel?: ReactNode
  compactOnMobile?: boolean
}

interface SummaryStatTileProps {
  title: ReactNode
  value: ReactNode
  description?: ReactNode | null
  icon?: LucideIcon
  className?: string
  titleClassName?: string
  valueClassName?: string
  descriptionClassName?: string
  iconClassName?: string
}

export function SummaryStatCards({
  items,
  className,
  loadingLabel = "Carregando...",
  compactOnMobile = true,
}: SummaryStatCardsProps) {
  return (
    <div
      className={cn(
        compactOnMobile
          ? "flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:overflow-visible md:pb-0"
          : "grid gap-4",
        compactOnMobile && "md:gap-4",
        className,
      )}
    >
      {items.map((item, index) => {
        const Icon = item.icon

        return (
          <Card
            key={item.key ?? index}
            className={cn(
              "min-w-0",
              compactOnMobile && "w-[232px] shrink-0 snap-start md:w-auto md:shrink md:snap-none",
              item.cardClassName,
            )}
          >
            <CardHeader
              className={cn(
                "flex flex-row items-start justify-between gap-3 space-y-0 pb-2",
                compactOnMobile && "p-3 pb-1 md:px-6 md:pt-6 md:pb-2",
              )}
            >
              <div className="min-w-0 space-y-1">
                <CardTitle
                  className={cn(
                    "min-w-0 text-sm font-medium",
                    compactOnMobile && "leading-tight",
                    item.titleClassName,
                  )}
                >
                  {item.title}
                </CardTitle>
              </div>
              {Icon ? (
                <Icon
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0 text-muted-foreground",
                    item.iconClassName,
                  )}
                />
              ) : null}
            </CardHeader>
            <CardContent className={cn(compactOnMobile && "px-3 pb-3 md:px-6 md:pb-6")}>
              <div
                className={cn(
                  "break-words text-2xl font-bold tracking-tight",
                  compactOnMobile && "text-2xl leading-tight",
                  item.valueClassName,
                )}
              >
                {item.loading ? (
                  <span className="inline-flex items-center gap-2 text-sm font-normal text-muted-foreground md:text-base">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {loadingLabel}
                  </span>
                ) : (
                  item.value
                )}
              </div>
              {item.description ? (
                <p
                  className={cn(
                    "mt-1.5 text-xs text-muted-foreground",
                    compactOnMobile && "line-clamp-2 leading-relaxed",
                    item.descriptionClassName,
                  )}
                >
                  {item.description}
                </p>
              ) : null}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export function SummaryStatTile({
  title,
  value,
  description,
  icon: Icon,
  className,
  titleClassName,
  valueClassName,
  descriptionClassName,
  iconClassName,
}: SummaryStatTileProps) {
  return (
    <div className={cn("rounded-md border bg-background px-2.5 py-2", className)}>
      <div
        className={cn(
          "flex items-center gap-2 text-[11px] text-muted-foreground",
          titleClassName,
        )}
      >
        {Icon ? <Icon className={cn("h-3.5 w-3.5 shrink-0", iconClassName)} /> : null}
        <span className="truncate">{title}</span>
      </div>
      <p className={cn("mt-1 text-lg font-semibold leading-none", valueClassName)}>{value}</p>
      {description ? (
        <p className={cn("mt-1 text-[11px] text-muted-foreground", descriptionClassName)}>
          {description}
        </p>
      ) : null}
    </div>
  )
}
