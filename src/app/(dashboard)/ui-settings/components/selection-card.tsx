"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface SelectionCardProps {
  title: string
  description?: string
  selected: boolean
  disabled?: boolean
  icon?: React.ComponentType<{ className?: string }>
  onClick: () => void
  children?: React.ReactNode
}

export function SelectionCard({
  title,
  description,
  selected,
  disabled = false,
  icon: Icon,
  onClick,
  children,
}: SelectionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex min-h-28 w-full flex-col rounded-lg border bg-card p-4 text-left transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        selected
          ? "border-primary bg-primary/5"
          : "hover:border-primary/40 hover:bg-accent/30",
        disabled && "cursor-not-allowed opacity-60 hover:border-border hover:bg-card",
      )}
    >
      <div className="flex items-start gap-3">
        {Icon ? (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-muted/50">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{title}</span>
            {selected ? (
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Check className="h-3.5 w-3.5" />
              </span>
            ) : null}
          </div>
          {description ? (
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </button>
  )
}
