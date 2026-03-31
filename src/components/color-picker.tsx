"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ColorPickerProps {
  label: string
  cssVar: string
  value: string
  onChange: (cssVar: string, value: string) => void
  disabled?: boolean
}

export function ColorPicker({
  label,
  cssVar,
  value,
  onChange,
  disabled = false,
}: ColorPickerProps) {
  const [localValue, setLocalValue] = React.useState(value)

  const normalizeToCssColor = React.useCallback((rawValue: string) => {
    const trimmed = rawValue.trim()

    if (!trimmed) {
      return "transparent"
    }

    if (
      trimmed.startsWith("#") ||
      trimmed.startsWith("rgb") ||
      trimmed.startsWith("hsl") ||
      trimmed.startsWith("oklch") ||
      trimmed.startsWith("oklab") ||
      trimmed.startsWith("color(")
    ) {
      return trimmed
    }

    if (/^[0-9.\s%/,-]+$/.test(trimmed)) {
      return `hsl(${trimmed})`
    }

    return trimmed
  }, [])

  React.useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value
    setLocalValue(newColor)
    onChange(cssVar, newColor)
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)
    onChange(cssVar, newValue)
  }

  const displayColor = React.useMemo(() => {
    if (typeof window === "undefined") {
      return "transparent"
    }

    if (localValue?.trim()) {
      return normalizeToCssColor(localValue)
    }

    const computed = getComputedStyle(document.documentElement)
      .getPropertyValue(cssVar)
      .trim()

    return normalizeToCssColor(computed)
  }, [cssVar, localValue, normalizeToCssColor])

  return (
    <div className="space-y-2">
      <Label htmlFor={`color-${cssVar}`} className="text-xs font-medium">
        {label}
      </Label>
      <div className="flex items-start gap-2">
        <div
          aria-hidden="true"
          className="mt-0.5 h-8 w-8 shrink-0 rounded-md border"
          style={{ background: displayColor }}
        />
        <Input
          id={`color-${cssVar}`}
          type="text"
          placeholder={`${cssVar} value`}
          value={localValue}
          onChange={handleTextChange}
          onBlur={(e) => handleColorChange(e as React.ChangeEvent<HTMLInputElement>)}
          disabled={disabled}
          className="h-8 flex-1 font-mono text-xs"
        />
      </div>
    </div>
  )
}
