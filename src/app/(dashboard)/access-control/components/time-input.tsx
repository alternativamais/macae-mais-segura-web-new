"use client"

import { Clock3 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface TimeInputProps
  extends Omit<React.ComponentProps<typeof Input>, "type" | "value" | "onChange"> {
  value?: string
  onChange?: (value: string) => void
}

function formatTimeValue(rawValue: string) {
  const digits = rawValue.replace(/\D/g, "").slice(0, 4)

  if (digits.length <= 2) {
    return digits
  }

  return `${digits.slice(0, 2)}:${digits.slice(2)}`
}

export function TimeInput({
  value = "",
  onChange,
  className,
  ...props
}: TimeInputProps) {
  return (
    <div className="relative">
      <Input
        {...props}
        type="text"
        inputMode="numeric"
        placeholder="08:00"
        maxLength={5}
        value={value}
        onChange={(event) => onChange?.(formatTimeValue(event.target.value))}
        className={cn("pr-10 font-medium tabular-nums", className)}
      />
      <Clock3 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}
