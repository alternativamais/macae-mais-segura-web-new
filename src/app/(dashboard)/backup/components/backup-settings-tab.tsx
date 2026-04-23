"use client"

import { useEffect, useState } from "react"
import { Loader2, Save, Settings2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { TimeInput } from "@/app/(dashboard)/access-control/components/time-input"
import { TabStateCard } from "@/app/(dashboard)/access-control/components/tab-state-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useHasPermission } from "@/hooks/use-has-permission"
import { backupService } from "@/services/backup.service"
import { BackupSettings } from "@/types/backup"
import { formatDateTime, getFrequencyLabel } from "./utils"
import { useTranslator } from "@/lib/i18n"
import { useMemo } from "react"

const frequencyOptions = [5, 15, 30, 60, 120, 360, 720, 1440, 2880, 10080]

interface BackupSettingsTabProps {
  onRefreshComplete?: (settings: BackupSettings | null) => void
}

export function BackupSettingsTab({
  onRefreshComplete,
}: BackupSettingsTabProps) {
  const { hasPermission } = useHasPermission()
  const canManage = hasPermission("configurar_backup")
  const [settings, setSettings] = useState<BackupSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const t = useTranslator("backup.settings_tab")
  const tUtils = useTranslator("backup.utils")
  const currentLocale = t.getLocale()
  const validationNotesMax = t("val_notes")
  const validationSchedule = t("val_schedule")
  const validationPassword = t("val_password")

  const settingsSchema = useMemo(
    () => z
      .object({
        enabled: z.boolean(),
        frequencyMinutes: z.number().min(5).max(7 * 24 * 60),
        scheduledTime: z.string().optional(),
        password: z.string().optional(),
        notes: z.string().max(256, validationNotesMax).optional(),
      })
      .superRefine((values, context) => {
        if (values.enabled && !values.scheduledTime?.trim()) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["scheduledTime"],
            message: validationSchedule,
          })
        }

        if (values.enabled && values.password && values.password.length < 8) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["password"],
            message: validationPassword,
          })
        }
      }),
    [validationNotesMax, validationPassword, validationSchedule]
  )

  type SettingsFormValues = z.infer<typeof settingsSchema>

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      enabled: false,
      frequencyMinutes: 1440,
      scheduledTime: "02:00",
      password: "",
      notes: "",
    },
  })

  const enabled = form.watch("enabled")

  useEffect(() => {
    const loadSettings = async () => {
      if (!canManage) {
        setSettings(null)
        onRefreshComplete?.(null)
        setIsLoading(false)
        return
      }

      setIsLoading(true)

      try {
        const data = await backupService.getSettings()
        setSettings(data)
        onRefreshComplete?.(data)
        form.reset({
          enabled: data.enabled,
          frequencyMinutes: data.frequencyMinutes,
          scheduledTime: data.scheduledTime || "02:00",
          password: "",
          notes: data.notes || "",
        })
      } catch (error) {
        toast.apiError(error, t("error_load"))
        setSettings(null)
        onRefreshComplete?.(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [canManage]) // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (values: SettingsFormValues) => {
    setIsSubmitting(true)

    try {
      const data = await backupService.updateSettings({
        enabled: values.enabled,
        frequencyMinutes: values.frequencyMinutes,
        scheduledTime: values.scheduledTime?.trim() || null,
        password: values.password?.trim() ? values.password.trim() : undefined,
        notes: values.notes?.trim() || "",
      })

      setSettings(data)
      onRefreshComplete?.(data)
      form.reset({
        enabled: data.enabled,
        frequencyMinutes: data.frequencyMinutes,
        scheduledTime: data.scheduledTime || "02:00",
        password: "",
        notes: data.notes || "",
      })
      toast.success(t("success_update"))
    } catch (error) {
      toast.apiError(error, t("error_update"))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!canManage) {
    return (
      <TabStateCard
        icon={Settings2}
        title={t("no_permission_title")}
        description={t("no_permission_desc")}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {t("card_automation")}
            </div>
            <div className="mt-2 text-sm font-medium">
              {settings?.enabled ? t("card_automation_on") : t("card_automation_off")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {t("card_freq")}
            </div>
            <div className="mt-2 text-sm font-medium">
              {settings ? getFrequencyLabel(tUtils, settings.frequencyMinutes) : "--"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {t("card_last")}
            </div>
            <div className="mt-2 text-sm font-medium">
              {settings?.lastRunAt ? formatDateTime(settings.lastRunAt, currentLocale) : "--"}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border bg-card p-4">
        {isLoading ? (
          <div className="flex min-h-[240px] items-center justify-center text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("loading")}
            </span>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>{t("form_auto")}</FormLabel>
                      <FormDescription>
                        {t("form_auto_desc")}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="grid items-start gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="frequencyMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form_freq")}</FormLabel>
                      <Select
                        value={String(field.value)}
                        onValueChange={(value) => field.onChange(Number(value))}
                      >
                        <FormControl>
                          <SelectTrigger className="cursor-pointer">
                            <SelectValue placeholder={t("placeholder_freq")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {frequencyOptions.map((option) => (
                            <SelectItem key={option} value={String(option)}>
                              {getFrequencyLabel(tUtils, option)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="scheduledTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form_time")}</FormLabel>
                      <FormControl>
                        <TimeInput value={field.value || ""} onChange={field.onChange} />
                      </FormControl>
                      <FormDescription>{t("time_desc")}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form_pwd")}</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder={settings?.hasPassword ? t("placeholder_pwd_maintain") : t("placeholder_pwd")}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="invisible">
                        {t("pwd_desc")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form_notes")}</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder={t("placeholder_notes")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!enabled && settings?.hasPassword ? (
                <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                  {t("info_maintain")}
                </div>
              ) : null}

              <div className="flex justify-end">
                <Button type="submit" className="cursor-pointer" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {t("btn_save")}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </div>
    </div>
  )
}
