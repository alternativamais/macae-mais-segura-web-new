"use client"

import { CalendarIcon, X } from "lucide-react"
import { endOfDay, format, parseISO, startOfDay } from "date-fns"
import { DateRange } from "react-day-picker"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useTranslator } from "@/lib/i18n"
import { getDateFnsLocale } from "@/lib/i18n/date"
import { cn } from "@/lib/utils"

interface LocationReportDateRangePickerProps {
  dateFrom: string
  dateTo: string
  onChange: (value: { dateFrom: string; dateTo: string }) => void
}

function parseDate(value?: string) {
  if (!value) return undefined

  try {
    return parseISO(value)
  } catch {
    return undefined
  }
}

function formatRangeLabel(
  range: DateRange | undefined,
  placeholder: string,
  locale: "pt-BR" | "en-US",
) {
  if (!range?.from) return placeholder

  if (!range.to) {
    return format(range.from, "P", { locale: getDateFnsLocale(locale) })
  }

  return `${format(range.from, "P", { locale: getDateFnsLocale(locale) })} - ${format(range.to, "P", {
    locale: getDateFnsLocale(locale),
  })}`
}

export function LocationReportDateRangePicker({
  dateFrom,
  dateTo,
  onChange,
}: LocationReportDateRangePickerProps) {
  const t = useTranslator("access_control.location_report_dialog")
  const locale = t.getLocale()

  const selectedRange: DateRange | undefined =
    dateFrom || dateTo
      ? {
          from: parseDate(dateFrom),
          to: parseDate(dateTo),
        }
      : undefined

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">{t("period_label")}</label>
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={cn(
                "min-w-0 flex-1 justify-start text-left font-normal cursor-pointer",
                !selectedRange?.from && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span className="truncate">
                {formatRangeLabel(selectedRange, t("period_placeholder"), locale)}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={selectedRange}
              onSelect={(range) => {
                onChange({
                  dateFrom: range?.from ? startOfDay(range.from).toISOString() : "",
                  dateTo: range?.to ? endOfDay(range.to).toISOString() : "",
                })
              }}
              numberOfMonths={2}
              initialFocus
              locale={getDateFnsLocale(locale)}
              className="w-full [&_[role=gridcell]_button]:cursor-pointer [&_button]:cursor-pointer"
            />
          </PopoverContent>
        </Popover>

        {selectedRange?.from ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0 cursor-pointer"
            onClick={() => onChange({ dateFrom: "", dateTo: "" })}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">{t("clear_period")}</span>
          </Button>
        ) : null}
      </div>
    </div>
  )
}
