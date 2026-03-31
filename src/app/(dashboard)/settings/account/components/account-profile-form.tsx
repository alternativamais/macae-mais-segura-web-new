"use client"

import { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Save, Undo2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import { meService } from "@/services/me.service"
import { MyProfile } from "@/types/me"
import { User } from "@/types/auth"
import { useTranslator } from "@/lib/i18n"
import { useMemo } from "react"

export function useAccountProfileFormSchema() {
  const t = useTranslator("account_profile")
  const validationName = t("val_name")
  const validationUsername = t("val_username")
  const validationEmail = t("val_email")
  const validationCurrentPassword = t("val_cur_pwd")
  const validationNewPassword = t("val_new_pwd")
  const validationNewPasswordLength = t("val_new_pwd_len")
  const validationConfirmPassword = t("val_confirm_pwd")
  const validationPasswordMatch = t("val_pwd_match")

  return useMemo(() => z
    .object({
      name: z.string().trim().min(1, validationName),
      username: z.string().trim().min(3, validationUsername),
      email: z.email(validationEmail),
      birthday: z.string().optional(),
      currentPassword: z.string().optional(),
      newPassword: z.string().optional(),
      confirmPassword: z.string().optional(),
    })
    .superRefine((values, ctx) => {
      const wantsPasswordChange =
        !!values.currentPassword || !!values.newPassword || !!values.confirmPassword

      if (!wantsPasswordChange) {
        return
      }

      if (!values.currentPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["currentPassword"],
          message: validationCurrentPassword,
        })
      }

      if (!values.newPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["newPassword"],
          message: validationNewPassword,
        })
      } else if (values.newPassword.length < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["newPassword"],
          message: validationNewPasswordLength,
        })
      }

      if (!values.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["confirmPassword"],
          message: validationConfirmPassword,
        })
      }

      if (
        values.newPassword &&
        values.confirmPassword &&
        values.newPassword !== values.confirmPassword
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["confirmPassword"],
          message: validationPasswordMatch,
        })
      }
    }), [
      validationConfirmPassword,
      validationCurrentPassword,
      validationEmail,
      validationName,
      validationNewPassword,
      validationNewPasswordLength,
      validationPasswordMatch,
      validationUsername,
    ])
}

type AccountProfileFormValues = {
  name: string
  username: string
  email: string
  birthday?: string
  currentPassword?: string
  newPassword?: string
  confirmPassword?: string
}

interface AccountProfileFormProps {
  profile: MyProfile
  onProfileUpdated: (profile: MyProfile, authUserPatch: Partial<User>) => void
}

function getDefaultValues(profile: MyProfile): AccountProfileFormValues {
  return {
    name: profile.name || "",
    username: profile.username || "",
    email: profile.email || "",
    birthday: profile.birthday || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  }
}

export function AccountProfileForm({
  profile,
  onProfileUpdated,
}: AccountProfileFormProps) {
  const accountProfileFormSchema = useAccountProfileFormSchema()
  const t = useTranslator("account_profile")

  const form = useForm<AccountProfileFormValues>({
    resolver: zodResolver(accountProfileFormSchema),
    defaultValues: getDefaultValues(profile),
  })

  useEffect(() => {
    form.reset(getDefaultValues(profile))
  }, [form, profile])

  const onSubmit = async (values: AccountProfileFormValues) => {
    try {
      const updatedProfile = await meService.updateProfile({
        name: values.name.trim(),
        username: values.username.trim(),
        email: values.email.trim(),
        birthday: values.birthday || undefined,
        currentPassword: values.currentPassword || undefined,
        newPassword: values.newPassword || undefined,
      })

      onProfileUpdated(updatedProfile, {
        name: updatedProfile.name,
        username: updatedProfile.username,
        email: updatedProfile.email,
        avatarUrl: updatedProfile.avatarUrl,
        status: updatedProfile.status,
        role: updatedProfile.role || undefined,
        locationRequired: updatedProfile.locationRequired,
        themeModePreference: updatedProfile.themeModePreference,
      })

      form.reset(getDefaultValues(updatedProfile))
      toast.success(t("success_update"))
    } catch (error) {
      toast.apiError(error, t("error_update"))
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("card_data_title")}</CardTitle>
            <CardDescription>
              {t("card_data_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form_name")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("form_name_placeholder")} {...field} />
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
                  <FormLabel>{t("form_user")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("form_user_placeholder")} {...field} />
                  </FormControl>
                  <FormDescription>
                    {t("form_user_desc")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form_email")}</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder={t("form_email_placeholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="birthday"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form_birth")}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("card_sec_title")}</CardTitle>
            <CardDescription>
              {t("card_sec_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form_cur_pwd")}</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form_new_pwd")}</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form_confirm_pwd")}</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer"
                disabled={form.formState.isSubmitting}
                onClick={() => form.reset(getDefaultValues(profile))}
              >
                <Undo2 className="mr-2 h-4 w-4" />
                {t("btn_restore")}
              </Button>
              <Button
                type="submit"
                className="cursor-pointer"
                disabled={!form.formState.isDirty || form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {t("btn_save")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  )
}
