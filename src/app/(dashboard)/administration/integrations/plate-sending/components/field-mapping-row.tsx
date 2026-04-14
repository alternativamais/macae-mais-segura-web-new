"use client"

import { useTranslator } from "@/lib/i18n"
import { PlateCameraCatalogItem } from "@/types/integration"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface FieldMappingRowProps {
  label: string
  field: string
  value: string
  onChange: (field: string, value: string) => void
  catalog: PlateCameraCatalogItem[]
}

export function FieldMappingRow({
  label,
  field,
  value,
  onChange,
  catalog,
}: FieldMappingRowProps) {
  const t = useTranslator("plate_sending")

  // Encontra o item do catálogo para mostrar o exemplo correspondente
  const selectedItem = catalog.find((c) => c.path === value)
  const availablePaths = catalog.filter((c) => c.path !== "$") // Exclui a raiz se necessário

  return (
    <div className="flex flex-col gap-2 rounded-md border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex-1 space-y-1">
        <p className="font-medium text-sm">{label}</p>
        <p className="text-xs text-muted-foreground font-mono">{field}</p>
      </div>

      <div className="flex flex-col gap-2 sm:w-[50%] sm:flex-row sm:items-center">
        <div className="flex-1">
          <Select value={value || "none"} onValueChange={(val) => onChange(field, val === "none" ? "" : val)}>
            <SelectTrigger className="w-full text-xs h-9">
              <SelectValue placeholder={t("management.form.select")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{"--"}</SelectItem>
              {availablePaths.map((item) => (
                <SelectItem key={item.path} value={item.path} className="text-xs font-mono">
                  {item.path}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:w-[120px] shrink-0 rounded bg-muted/30 px-2 py-1.5 text-xs text-muted-foreground truncate border border-dashed">
          {selectedItem?.example || "-"}
        </div>
      </div>
    </div>
  )
}
