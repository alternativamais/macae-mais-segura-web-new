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
import { AccessUserIpRule } from "@/types/access-control"
import { User } from "@/types/user"
import { useTranslator } from "@/lib/i18n"
import { getUserIpMatchTypeOptions, getUserRuleModeOptions } from "./utils"

type UserIpRuleFormValues = {
  userId: number
  mode: "allow" | "block"
  matchType: "single" | "cidr" | "range"
  value?: string
  rangeStart?: string
  rangeEnd?: string
  description?: string
  active: boolean
}

interface UserIpRuleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void | Promise<void>
  users: User[]
  userIpRule?: AccessUserIpRule
}

export function UserIpRuleFormDialog({
  open,
  onOpenChange,
  onSuccess,
  users,
  userIpRule,
}: UserIpRuleFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEdit = !!userIpRule
  const t = useTranslator("access_control.user_ip_rule_form")
  const tAccess = useTranslator("access_control")
  const validationUser = t("val_user")
  const validationStartIp = t("val_start_ip")
  const validationEndIp = t("val_end_ip")
  const validationCidr = t("val_cidr")
  const validationIp = t("val_ip")
  const ruleModeOptions = useMemo(() => getUserRuleModeOptions(tAccess), [tAccess])
  const matchTypeOptions = useMemo(() => getUserIpMatchTypeOptions(tAccess), [tAccess])

  const userIpRuleFormSchema = useMemo(
    () =>
      z
        .object({
          userId: z.coerce.number().min(1, validationUser),
          mode: z.enum(["allow", "block"]),
          matchType: z.enum(["single", "cidr", "range"]),
          value: z.string().optional(),
          rangeStart: z.string().optional(),
          rangeEnd: z.string().optional(),
          description: z.string().optional(),
          active: z.boolean(),
        })
        .superRefine((values, context) => {
          if (values.matchType === "range") {
            if (!values.rangeStart?.trim()) {
              context.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["rangeStart"],
                message: validationStartIp,
              })
            }

            if (!values.rangeEnd?.trim()) {
              context.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["rangeEnd"],
                message: validationEndIp,
              })
            }

            return
          }

          if (!values.value?.trim()) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["value"],
              message:
                values.matchType === "cidr"
                  ? validationCidr
                  : validationIp,
            })
          }
        }),
    [validationCidr, validationEndIp, validationIp, validationStartIp, validationUser],
  )

  const form = useForm<UserIpRuleFormValues>({
    resolver: zodResolver(userIpRuleFormSchema) as any,
    defaultValues: {
      userId: 0,
      mode: "block",
      matchType: "single",
      value: "",
      rangeStart: "",
      rangeEnd: "",
      description: "",
      active: true,
    },
  })

  const selectedMatchType = form.watch("matchType")

  useEffect(() => {
    if (!open) return

    form.reset({
      userId: userIpRule?.userId || 0,
      mode: userIpRule?.mode || "block",
      matchType: userIpRule?.matchType || "single",
      value:
        userIpRule?.matchType === "range"
          ? ""
          : userIpRule?.ipValue || userIpRule?.cidr || "",
      rangeStart: userIpRule?.rangeStart || "",
      rangeEnd: userIpRule?.rangeEnd || "",
      description: userIpRule?.description || "",
      active: userIpRule?.active ?? true,
    })
  }, [open, userIpRule, form])

  const availableUsers = useMemo(() => users.filter((user) => !!user.id), [users])

  const onSubmit = async (values: UserIpRuleFormValues) => {
    setIsSubmitting(true)

    try {
      const payload = {
        userId: values.userId,
        mode: values.mode,
        matchType: values.matchType,
        value: values.matchType === "range" ? undefined : values.value?.trim(),
        rangeStart:
          values.matchType === "range" ? values.rangeStart?.trim() : undefined,
        rangeEnd:
          values.matchType === "range" ? values.rangeEnd?.trim() : undefined,
        description: values.description?.trim() || undefined,
        active: values.active,
      }

      if (isEdit && userIpRule) {
        await accessControlService.updateUserIpRule(userIpRule.id, payload)
        toast.success(t("success_edit"))
      } else {
        await accessControlService.createUserIpRule(payload)
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

            <div className="grid gap-4 md:grid-cols-2">
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="matchType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("label_type")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="cursor-pointer">
                          <SelectValue placeholder={t("placeholder_type")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {matchTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {selectedMatchType === "range" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="rangeStart"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("label_start_ip")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("placeholder_start_ip")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rangeEnd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("label_end_ip")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("placeholder_end_ip")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : (
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{selectedMatchType === "cidr" ? t("label_cidr") : t("label_ip")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={
                          selectedMatchType === "cidr" ? t("placeholder_cidr") : t("placeholder_ip")
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
                  <FormDescription>
                    {t("desc_hint")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>{t("label_active")}</FormLabel>
                    <FormDescription>
                      {t("active_hint")}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
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
