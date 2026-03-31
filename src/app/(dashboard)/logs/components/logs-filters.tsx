"use client"

import { RotateCcw, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTranslator } from "@/lib/i18n"
import { ClientOrigin, LogType } from "@/types/log"
import { User } from "@/types/user"
import { LogDateRangePicker } from "./log-date-range-picker"

export interface LogsFilterValues {
  level: string
  userId: string
  requestId: string
  message: string
  dateFrom: string
  dateTo: string
  clientOrigin: ClientOrigin | ""
  method: string
  url: string
  error: string
  action: string
  entity: string
}

interface LogsFiltersProps {
  type: LogType
  filters: LogsFilterValues
  users: User[]
  onChange: (field: keyof LogsFilterValues, value: string) => void
  onApply: () => void
  onClear: () => void
}

function CompactSelect({
  label,
  value,
  placeholder,
  onValueChange,
  children,
}: {
  label: string
  value: string
  placeholder: string
  onValueChange: (value: string) => void
  children: React.ReactNode
}) {
  return (
    <div className="min-w-0">
      <label className="mb-2 block text-sm font-medium">
        {label}
      </label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full min-w-0 cursor-pointer">
          <SelectValue placeholder={placeholder} className="truncate" />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </div>
  )
}

export function LogsFilters({
  type,
  filters,
  users,
  onChange,
  onApply,
  onClear,
}: LogsFiltersProps) {
  const t = useTranslator("logs.filters")

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="grid gap-4 xl:grid-cols-12 xl:items-start">
        <div className="xl:col-span-7">
          <label className="mb-2 block text-sm font-medium">{t("fields.message")}</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("placeholders.message")}
              value={filters.message}
              onChange={(event) => onChange("message", event.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="self-start xl:col-span-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-2">
            <CompactSelect
              label={t("fields.user")}
              value={filters.userId || "__all"}
              placeholder={t("options.all")}
              onValueChange={(value) => onChange("userId", value === "__all" ? "" : value)}
            >
              <SelectItem value="__all">{t("options.all")}</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={String(user.id)}>
                  {user.name || user.username || user.email}
                </SelectItem>
              ))}
            </CompactSelect>

            <CompactSelect
              label={t("fields.level")}
              value={filters.level || "__all"}
              placeholder={t("options.all")}
              onValueChange={(value) => onChange("level", value === "__all" ? "" : value)}
            >
              <SelectItem value="__all">{t("options.all")}</SelectItem>
              <SelectItem value="error">{t("options.level.error")}</SelectItem>
              <SelectItem value="warn">{t("options.level.warn")}</SelectItem>
              <SelectItem value="info">{t("options.level.info")}</SelectItem>
              <SelectItem value="debug">{t("options.level.debug")}</SelectItem>
            </CompactSelect>

            <CompactSelect
              label={t("fields.origin")}
              value={filters.clientOrigin || "__all"}
              placeholder={t("options.all_feminine")}
              onValueChange={(value) => onChange("clientOrigin", value === "__all" ? "" : value)}
            >
              <SelectItem value="__all">{t("options.all_feminine")}</SelectItem>
              <SelectItem value="web">{t("options.origin.web")}</SelectItem>
              <SelectItem value="app">{t("options.origin.app")}</SelectItem>
              <SelectItem value="unknown">{t("options.origin.unknown")}</SelectItem>
            </CompactSelect>

            {type === "api" ? (
              <CompactSelect
                label={t("fields.method")}
                value={filters.method || "__all"}
                placeholder={t("options.all")}
                onValueChange={(value) => onChange("method", value === "__all" ? "" : value)}
              >
                <SelectItem value="__all">{t("options.all")}</SelectItem>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
              </CompactSelect>
            ) : (
              <div className="hidden xl:block" />
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <label className="mb-2 block text-sm font-medium">{t("fields.request_id")}</label>
          <Input
            placeholder={t("placeholders.request_id")}
            value={filters.requestId}
            onChange={(event) => onChange("requestId", event.target.value)}
          />
        </div>

        <LogDateRangePicker
          dateFrom={filters.dateFrom}
          dateTo={filters.dateTo}
          onChange={({ dateFrom, dateTo }) => {
            onChange("dateFrom", dateFrom)
            onChange("dateTo", dateTo)
          }}
        />

        {type === "api" ? (
          <>
            <div>
              <label className="mb-2 block text-sm font-medium">{t("fields.url")}</label>
              <Input
                placeholder={t("placeholders.url")}
                value={filters.url}
                onChange={(event) => onChange("url", event.target.value)}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">{t("fields.error")}</label>
              <Input
                placeholder={t("placeholders.error")}
                value={filters.error}
                onChange={(event) => onChange("error", event.target.value)}
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="mb-2 block text-sm font-medium">{t("fields.action")}</label>
              <Input
                placeholder={t("placeholders.action")}
                value={filters.action}
                onChange={(event) => onChange("action", event.target.value)}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">{t("fields.entity")}</label>
              <Input
                placeholder={t("placeholders.entity")}
                value={filters.entity}
                onChange={(event) => onChange("entity", event.target.value)}
              />
            </div>
          </>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onClear} className="cursor-pointer">
          <RotateCcw className="mr-2 h-4 w-4" />
          {t("actions.clear")}
        </Button>
        <Button onClick={onApply} className="cursor-pointer">
          <Search className="mr-2 h-4 w-4" />
          {t("actions.apply")}
        </Button>
      </div>
    </div>
  )
}
