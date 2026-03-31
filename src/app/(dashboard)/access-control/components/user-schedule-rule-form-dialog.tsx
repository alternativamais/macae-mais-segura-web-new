"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2 } from "lucide-react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { accessControlService } from "@/services/access-control.service"
import { AccessUserScheduleRule, DayOfWeek } from "@/types/access-control"
import { User } from "@/types/user"
import {
  DEFAULT_TIMEZONE,
} from "./constants"
import { TimeInput } from "./time-input"
import { useTranslator } from "@/lib/i18n"
import { getDayOptions, getUserRuleModeOptions } from "./utils"

const dayOfWeekSchema = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
])

type UserScheduleRuleFormValues = {
  userId: number
  mode: "allow" | "block"
  startTime: string
  endTime: string
  daysOfWeek?: DayOfWeek[]
  timezone: string
  description?: string
  active: boolean
}

interface UserScheduleRuleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void | Promise<void>
  users: User[]
  userScheduleRule?: AccessUserScheduleRule
}

export function UserScheduleRuleFormDialog({
  open,
  onOpenChange,
  onSuccess,
  users,
  userScheduleRule,
}: UserScheduleRuleFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEdit = !!userScheduleRule
  const t = useTranslator("access_control.user_schedule_rule_form")
  const tAccess = useTranslator("access_control")
  const validationUser = t("val_user")
  const validationStartTimeFormat = t("val_start_time_format")
  const validationEndTimeFormat = t("val_end_time_format")
  const validationTimezone = t("val_timezone")
  const ruleModeOptions = useMemo(() => getUserRuleModeOptions(tAccess), [tAccess])
  const dayOptions = useMemo(() => getDayOptions(tAccess), [tAccess])

  const userScheduleRuleFormSchema = useMemo(
    () =>
      z.object({
        userId: z.coerce.number().min(1, validationUser),
        mode: z.enum(["allow", "block"]),
        startTime: z
          .string()
          .regex(/^\d{2}:\d{2}$/, validationStartTimeFormat),
        endTime: z
          .string()
          .regex(/^\d{2}:\d{2}$/, validationEndTimeFormat),
        daysOfWeek: z.array(dayOfWeekSchema).optional(),
        timezone: z.string().trim().min(1, validationTimezone),
        description: z.string().optional(),
        active: z.boolean(),
      }),
    [validationEndTimeFormat, validationStartTimeFormat, validationTimezone, validationUser],
  )

  const form = useForm<UserScheduleRuleFormValues>({
    resolver: zodResolver(userScheduleRuleFormSchema) as any,
    defaultValues: {
      userId: 0,
      mode: "allow",
      startTime: "08:00",
      endTime: "18:00",
      daysOfWeek: [],
      timezone: DEFAULT_TIMEZONE,
      description: "",
      active: true,
    },
  })

  useEffect(() => {
    if (!open) return

    form.reset({
      userId: userScheduleRule?.userId || 0,
      mode: userScheduleRule?.mode || "allow",
      startTime: userScheduleRule?.startTime || "08:00",
      endTime: userScheduleRule?.endTime || "18:00",
      daysOfWeek: userScheduleRule?.daysOfWeek || [],
      timezone: userScheduleRule?.timezone || DEFAULT_TIMEZONE,
      description: userScheduleRule?.description || "",
      active: userScheduleRule?.active ?? true,
    })
  }, [open, userScheduleRule, form])

  const selectedDays = form.watch("daysOfWeek") || []
  const availableUsers = useMemo(() => users.filter((user) => !!user.id), [users])

  const toggleDay = (day: DayOfWeek, checked: boolean) => {
    const currentDays = form.getValues("daysOfWeek") || []

    if (checked) {
      form.setValue("daysOfWeek", [...currentDays, day], { shouldValidate: true })
      return
    }

    form.setValue(
      "daysOfWeek",
      currentDays.filter((value) => value !== day),
      { shouldValidate: true }
    )
  }

  const onSubmit = async (values: UserScheduleRuleFormValues) => {
    setIsSubmitting(true)

    try {
      const payload = {
        userId: values.userId,
        mode: values.mode,
        startTime: values.startTime,
        endTime: values.endTime,
        daysOfWeek: values.daysOfWeek?.length ? values.daysOfWeek : undefined,
        timezone: values.timezone.trim(),
        description: values.description?.trim() || undefined,
        active: values.active,
      }

      if (isEdit && userScheduleRule) {
        await accessControlService.updateUserScheduleRule(userScheduleRule.id, payload)
        toast.success(t("success_edit"))
      } else {
        await accessControlService.createUserScheduleRule(payload)
        toast.success(t("success_new"))
      }

      await onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast.apiError(error, t("error_save"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("title_edit") : t("title_new")}
          </DialogTitle>
          <DialogDescription>
            {t("desc")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("label_user")}</FormLabel>
                  <Select
                    value={field.value ? String(field.value) : ""}
                    onValueChange={(value) => field.onChange(Number(value))}
                  >
                    <FormControl>
                      <SelectTrigger className="cursor-pointer">
                        <SelectValue placeholder={t("placeholder_user")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableUsers.map((user) => (
                        <SelectItem key={user.id} value={String(user.id)}>
                          {user.name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid items-start gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="mode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("label_action")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="cursor-pointer">
                          <SelectValue placeholder={t("placeholder_action")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ruleModeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="invisible">
                      {t("action_desc")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("label_start_time")}</FormLabel>
                    <FormControl>
                      <TimeInput value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormDescription>{t("start_time_desc")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("label_end_time")}</FormLabel>
                    <FormControl>
                      <TimeInput value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormDescription>{t("end_time_desc")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="daysOfWeek"
              render={() => (
                <FormItem>
                  <FormLabel>{t("label_days")}</FormLabel>
                  <div className="grid gap-3 rounded-lg border p-4 md:grid-cols-2">
                    {dayOptions.map((day) => (
                      <label
                        key={day.value}
                        className="flex cursor-pointer items-center gap-3 rounded-md border p-3 transition-colors hover:bg-muted/50"
                      >
                        <Checkbox
                          checked={selectedDays.includes(day.value)}
                          onCheckedChange={(checked) => toggleDay(day.value, !!checked)}
                        />
                        <span className="text-sm">{day.label}</span>
                      </label>
                    ))}
                  </div>
                  <FormDescription>
                    {t("days_desc")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("label_timezone")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("placeholder_timezone")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex h-full items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>{t("label_active")}</FormLabel>
                      <FormDescription>{t("active_desc")}</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("label_desc")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("placeholder_desc")}
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="cursor-pointer"
              >
                {t("button_cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t("button_save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
