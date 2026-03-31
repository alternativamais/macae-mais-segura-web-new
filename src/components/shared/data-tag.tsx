import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export const dataTagToneClassNames = {
  neutral:
    "border-transparent bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300",
  success:
    "border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  info: "border-transparent bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400",
  warning:
    "border-transparent bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  danger:
    "border-transparent bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
  accent:
    "border-transparent bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400",
} as const

export type DataTagTone = keyof typeof dataTagToneClassNames

export interface DataTagDefinition {
  label: React.ReactNode
  tone: DataTagTone
  monospace?: boolean
}

interface DataTagProps extends React.ComponentProps<"span"> {
  tone?: DataTagTone
  monospace?: boolean
}

export function DataTag({
  tone = "neutral",
  monospace = false,
  className,
  children,
  ...props
}: DataTagProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "h-6 rounded-md px-2.5 py-0 text-[11px] font-medium leading-none tracking-normal",
        monospace ? "tabular-nums font-semibold" : null,
        dataTagToneClassNames[tone],
        className
      )}
      {...props}
    >
      {children}
    </Badge>
  )
}

export function resolveDataTagDefinition<T extends string | number>(
  value: T | null | undefined,
  map: Partial<Record<string, DataTagDefinition>>,
  fallback: DataTagDefinition
) {
  const key = value == null ? "" : String(value).toLowerCase()
  return map[key] || fallback
}
