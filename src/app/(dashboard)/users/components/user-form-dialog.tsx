"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarIcon, CheckCircle2, Loader2 } from "lucide-react"
import { format, parseISO } from "date-fns"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { formatLocalizedDate, getDateFnsLocale } from "@/lib/i18n/date"
import { cn } from "@/lib/utils"
import { userService } from "@/services/user.service"
import { Role } from "@/types/role"
import { User } from "@/types/user"
import { Empresa } from "@/types/empresa"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { useTranslator } from "@/lib/i18n"

interface UserFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void | Promise<void>
  user?: User
  roles: Role[]
  companies: Empresa[]
}

const defaultBirthday = new Date("1995-01-01")

type CompanyRoleValue = {
  empresaId: number
  roleId: number
  isDefault: boolean
}

function CompanyMultiSelectField({
  companies,
  selectedCompanyIds,
  onChange,
  t,
}: {
  companies: Empresa[]
  selectedCompanyIds: number[]
  onChange: (nextValue: number[]) => void
  t: ReturnType<typeof useTranslator>
}) {
  const selectedCompanies = companies.filter((company) =>
    selectedCompanyIds.includes(company.id),
  )

  const triggerLabel = (() => {
    if (selectedCompanies.length === 0) {
      return t("placeholders.empresa")
    }

    if (selectedCompanies.length <= 2) {
      return selectedCompanies.map((company) => company.nome).join(", ")
    }

    return t("selected_companies", { count: selectedCompanies.length })
  })()

  const toggleCompany = (companyId: number) => {
    if (selectedCompanyIds.includes(companyId)) {
      onChange(selectedCompanyIds.filter((id) => id !== companyId))
      return
    }

    onChange([...selectedCompanyIds, companyId])
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full cursor-pointer justify-between text-left font-normal",
            selectedCompanies.length === 0 && "text-muted-foreground",
          )}
        >
          <span className="truncate">{triggerLabel}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder={t("search_company")} />
          <CommandList>
            <CommandEmpty>{t("empty_companies")}</CommandEmpty>
            <CommandGroup>
              {companies.map((company) => {
                const isSelected = selectedCompanyIds.includes(company.id)

                return (
                  <CommandItem
                    key={company.id}
                    value={company.nome}
                    onSelect={() => toggleCompany(company.id)}
                    className="cursor-pointer"
                  >
                    <Checkbox
                      checked={isSelected}
                      onClick={(event) => event.stopPropagation()}
                      onCheckedChange={() => toggleCompany(company.id)}
                      className="mr-2"
                    />
                    <span>{company.nome}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {selectedCompanyIds.length > 0 ? (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => onChange([])}
                    className="justify-center text-center cursor-pointer"
                  >
                    {t("clear_companies")}
                  </CommandItem>
                </CommandGroup>
              </>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function UserFormDialog({
  open,
  onOpenChange,
  onSuccess,
  user,
  roles,
  companies,
}: UserFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [openSection, setOpenSection] = useState("account")
  const isEdit = !!user

  const t = useTranslator("users.form")
  const tTable = useTranslator("users.table")
  const currentLocale = t.getLocale()

  const rolesByCompanyId = useMemo(() => {
    const map = new Map<number, Role[]>()

    for (const role of roles) {
      if (typeof role.empresaId !== "number") continue

      const current = map.get(role.empresaId) || []
      current.push(role)
      map.set(role.empresaId, current)
    }

    for (const [companyId, companyRoles] of map.entries()) {
      map.set(
        companyId,
        [...companyRoles].sort((a, b) => a.name.localeCompare(b.name, currentLocale)),
      )
    }

    return map
  }, [currentLocale, roles])

  const userFormSchema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(2, t("validations.name_min")),
        username: z.string().trim().min(3, t("validations.username_min")),
        email: z.string().email(t("validations.email_invalid")),
        password: z.string().optional().or(z.literal("")),
        birthday: z.date(),
        status: z.enum(["active", "inactive"]),
        companyRoles: z
          .array(
            z.object({
              empresaId: z.number(),
              roleId: z.coerce.number().min(1, t("validations.role_required")),
              isDefault: z.boolean().default(false),
            }),
          )
          .min(1, t("validations.empresa_required"))
          .superRefine((items, ctx) => {
            const companyIds = new Set<number>()
            let defaultCount = 0

            items.forEach((item, index) => {
              if (companyIds.has(item.empresaId)) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: t("validations.company_unique"),
                  path: [index, "empresaId"],
                })
              }

              companyIds.add(item.empresaId)

              if (item.isDefault) {
                defaultCount += 1
              }
            })

            if (defaultCount !== 1) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: t("validations.default_company_required"),
                path: ["companyRoles"],
              })
            }
          }),
        locationRequired: z.boolean().default(false),
      }),
    [t],
  )

  type UserFormValues = z.infer<typeof userFormSchema>

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema) as any,
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      birthday: defaultBirthday,
      status: "active",
      companyRoles: [],
      locationRequired: false,
    },
  })

  const watchedCompanyRoles = form.watch("companyRoles") || []
  const selectedCompanyIds = watchedCompanyRoles.map((entry) => entry.empresaId)

  useEffect(() => {
    if (!open) return
    setOpenSection("account")

    const fallbackCompanyRoles =
      user?.companyRoles && user.companyRoles.length > 0
        ? user.companyRoles.map((entry, index) => ({
            empresaId: entry.empresaId,
            roleId: entry.roleId,
            isDefault:
              typeof entry.isDefault === "boolean"
                ? entry.isDefault
                : index === 0,
          }))
        : (user?.empresaIds || (user?.empresaId ? [user.empresaId] : [])).map((empresaId, index) => ({
            empresaId,
            roleId: user?.roleId || 0,
            isDefault: index === 0,
          }))

    form.reset({
      name: user?.name || "",
      username: user?.username || "",
      email: user?.email || "",
      password: "",
      birthday: user?.birthday ? parseISO(user.birthday) : defaultBirthday,
      status: user?.status === "inactive" ? "inactive" : "active",
      companyRoles: fallbackCompanyRoles,
      locationRequired: user?.locationRequired || false,
    })
  }, [form, open, user])

  const syncSelectedCompanies = (companyIds: number[]) => {
    const currentRoles = form.getValues("companyRoles") || []
    const nextRoles = companyIds.map((companyId, index) => {
      const existing = currentRoles.find((entry) => entry.empresaId === companyId)
      const availableRoles = rolesByCompanyId.get(companyId) || []

      return {
        empresaId: companyId,
        roleId:
          existing?.roleId && availableRoles.some((role) => role.id === existing.roleId)
            ? existing.roleId
            : availableRoles[0]?.id || 0,
        isDefault:
          existing?.isDefault ||
          (!currentRoles.some((entry) => entry.isDefault && companyIds.includes(entry.empresaId)) &&
            index === 0),
      }
    })

    const normalizedRoles =
      nextRoles.some((entry) => entry.isDefault)
        ? nextRoles
        : nextRoles.map((entry, index) => ({
            ...entry,
            isDefault: index === 0,
          }))

    form.setValue("companyRoles", normalizedRoles, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  const updateCompanyRole = (empresaId: number, roleId: number) => {
    const nextRoles = watchedCompanyRoles.map((entry) =>
      entry.empresaId === empresaId ? { ...entry, roleId } : entry,
    )

    form.setValue("companyRoles", nextRoles, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  const setDefaultCompany = (empresaId: number) => {
    const nextRoles = watchedCompanyRoles.map((entry) => ({
      ...entry,
      isDefault: entry.empresaId === empresaId,
    }))

    form.setValue("companyRoles", nextRoles, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  const onSubmit = async (values: UserFormValues) => {
    setIsSubmitting(true)

    try {
      const payload = {
        ...values,
        birthday: format(values.birthday, "yyyy-MM-dd"),
        companyRoles: values.companyRoles.map((entry) => ({
          empresaId: entry.empresaId,
          roleId: entry.roleId,
          isDefault: entry.isDefault,
        })),
      }

      if (isEdit && !payload.password) {
        delete (payload as { password?: string }).password
      }

      if (isEdit && user) {
        await userService.update(user.id, payload)
        toast.success(t("notifications.update_success"))
      } else {
        await userService.create(payload)
        toast.success(t("notifications.create_success"))
      }

      await onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast.apiError(error, isEdit ? t("notifications.update_error") : t("notifications.create_error"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("title_edit") : t("title_create")}</DialogTitle>
          <DialogDescription>
            {isEdit ? t("description_edit") : t("description_create")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Accordion
              type="single"
              collapsible
              value={openSection}
              onValueChange={(value) => setOpenSection(value || "")}
              className="rounded-md border bg-card"
            >
              <AccordionItem value="account" className="px-4">
                <AccordionTrigger className="cursor-pointer py-4 hover:no-underline">
                  <div className="space-y-1 text-left">
                    <div>{t("sections.account")}</div>
                    <div className="text-xs font-normal text-muted-foreground">
                      {t("sections.account_desc")}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  <div className="space-y-4 pb-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("labels.name")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("placeholders.name")} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("labels.username")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("placeholders.username")} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("labels.email")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("placeholders.email")} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("labels.password")} {isEdit ? t("labels.password_edit_hint") : ""}
                            </FormLabel>
                            <FormControl>
                              <Input type="password" placeholder={t("placeholders.password")} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid items-start gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="birthday"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>{t("labels.birthday")}</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className={cn(
                                      "w-full cursor-pointer justify-start pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground",
                                    )}
                                  >
                                    {field.value
                                      ? formatLocalizedDate(field.value, currentLocale)
                                      : t("placeholders.birthday")}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date > new Date() || date < new Date("1900-01-01")
                                  }
                                  locale={getDateFnsLocale(currentLocale)}
                                  captionLayout="dropdown"
                                  fromYear={1900}
                                  toYear={new Date().getFullYear()}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("labels.status")}</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger className="w-full cursor-pointer">
                                  <SelectValue placeholder={t("placeholders.status")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="active">{tTable("status_active")}</SelectItem>
                                <SelectItem value="inactive">{tTable("status_inactive")}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="access" className="px-4">
                <AccordionTrigger className="cursor-pointer py-4 hover:no-underline">
                  <div className="space-y-1 text-left">
                    <div>{t("sections.access")}</div>
                    <div className="text-xs font-normal text-muted-foreground">
                      {t("sections.access_desc", { count: selectedCompanyIds.length })}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  <div className="space-y-4 pb-4">
                    <div className="grid items-start gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
                      <FormField
                        control={form.control}
                        name="companyRoles"
                        render={() => (
                          <FormItem>
                            <FormLabel>{t("labels.empresa")}</FormLabel>
                            <FormControl>
                              <CompanyMultiSelectField
                                companies={companies}
                                selectedCompanyIds={selectedCompanyIds}
                                onChange={syncSelectedCompanies}
                                t={t}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="locationRequired"
                        render={({ field }) => (
                          <FormItem className="mt-7 flex h-10 flex-row items-center gap-2 space-y-0">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="cursor-pointer font-normal text-sm">
                              {t("labels.location_required")}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="space-y-1">
                        <h3 className="text-sm font-medium">{t("company_roles.title")}</h3>
                        <p className="text-sm text-muted-foreground">{t("company_roles.description")}</p>
                      </div>

                      {watchedCompanyRoles.length > 0 ? (
                        <div className="rounded-md border bg-card">
                          <ScrollArea className="max-h-[280px]">
                            <div className="divide-y">
                              {watchedCompanyRoles.map((entry) => {
                                const company = companies.find((item) => item.id === entry.empresaId)
                                const availableRoles = rolesByCompanyId.get(entry.empresaId) || []

                                return (
                                  <div
                                    key={entry.empresaId}
                                    className="grid gap-3 p-3 md:grid-cols-[minmax(0,1fr)_220px_190px] md:items-end"
                                  >
                                    <div className="min-w-0 self-center">
                                      <div className="truncate text-sm font-medium">
                                        {company?.nome || t("company_roles.company_fallback", { id: entry.empresaId })}
                                      </div>
                                    </div>

                                    <div className="flex flex-col justify-end gap-1.5">
                                      <FormLabel className="text-xs text-muted-foreground">
                                        {t("labels.role")}
                                      </FormLabel>
                                      <Select
                                        value={entry.roleId ? String(entry.roleId) : ""}
                                        onValueChange={(value) =>
                                          updateCompanyRole(entry.empresaId, Number(value))
                                        }
                                      >
                                        <SelectTrigger className="w-full cursor-pointer">
                                          <SelectValue placeholder={t("placeholders.role")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {availableRoles.length > 0 ? (
                                            availableRoles.map((role) => (
                                              <SelectItem key={role.id} value={String(role.id)}>
                                                {role.name}
                                              </SelectItem>
                                            ))
                                          ) : (
                                            <SelectItem value="0" disabled>
                                              {t("company_roles.no_roles")}
                                            </SelectItem>
                                          )}
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <div className="flex flex-col justify-end gap-1.5">
                                      <FormLabel className="text-xs text-muted-foreground">
                                        {t("company_roles.default_label")}
                                      </FormLabel>
                                      <Button
                                        type="button"
                                        variant={entry.isDefault ? "default" : "outline"}
                                        className="h-9 w-full cursor-pointer justify-center transition-colors duration-200"
                                        onClick={() => setDefaultCompany(entry.empresaId)}
                                      >
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        {entry.isDefault
                                          ? t("company_roles.default_selected")
                                          : t("company_roles.make_default")}
                                      </Button>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </ScrollArea>
                        </div>
                      ) : (
                        <div className="rounded-md border border-dashed bg-muted/30 px-4 py-6 text-sm text-muted-foreground">
                          {t("company_roles.empty")}
                        </div>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="cursor-pointer"
                disabled={isSubmitting}
              >
                {t("buttons.cancel")}
              </Button>
              <Button type="submit" className="cursor-pointer" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isSubmitting ? t("buttons.saving") : isEdit ? t("buttons.save") : t("buttons.create")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
