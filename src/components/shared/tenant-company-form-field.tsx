"use client"

import type { Control, FieldPath, FieldValues } from "react-hook-form"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTranslator } from "@/lib/i18n"
import type { TenantCompanyOption } from "@/hooks/use-tenant-company-selection"

interface TenantCompanyFormFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>
  companies: TenantCompanyOption[]
  name?: FieldPath<TFieldValues>
  disabled?: boolean
  description?: string
}

export function TenantCompanyFormField<TFieldValues extends FieldValues>({
  control,
  companies,
  name,
  disabled,
  description,
}: TenantCompanyFormFieldProps<TFieldValues>) {
  const t = useTranslator("company_field")

  return (
    <FormField
      control={control}
      name={(name ?? "empresaId") as FieldPath<TFieldValues>}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("label")}</FormLabel>
          <Select
            value={field.value ? String(field.value) : ""}
            onValueChange={field.onChange}
            disabled={disabled}
          >
            <FormControl>
              <SelectTrigger className="w-full cursor-pointer">
                <SelectValue placeholder={t("placeholder")} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {companies.map((company) => (
                <SelectItem key={company.id} value={String(company.id)}>
                  {company.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description ? <FormDescription>{description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
