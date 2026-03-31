"use client"

import { useCallback, useEffect, useState } from "react"
import { AlertCircle, CircleUserRound, RefreshCcw } from "lucide-react"
import { formatLocalizedDateTime } from "@/lib/i18n/date"
import { useTranslator } from "@/lib/i18n"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { useAuthStore } from "@/store/auth-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { meService } from "@/services/me.service"
import { MyProfile } from "@/types/me"
import { User } from "@/types/auth"
import { AccountOverviewCards } from "./components/account-overview-cards"
import { AccountProfileForm } from "./components/account-profile-form"

export default function AccountSettingsPage() {
  const t = useTranslator("account")
  const locale = t.getLocale()
  const updateUser = useAuthStore((state) => state.updateUser)
  const [profile, setProfile] = useState<MyProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadProfile = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)

    try {
      const currentProfile = await meService.getProfile()
      setProfile(currentProfile)
    } catch (error) {
      setProfile(null)
      setLoadError(t("errors.load"))
      toast.apiError(error, t("notifications.load_error"))
    } finally {
      setIsLoading(false)
    }
  }, [t])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const handleProfileUpdated = (updatedProfile: MyProfile, authUserPatch: Partial<User>) => {
    setProfile(updatedProfile)
    updateUser(authUserPatch)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="@container/main mt-8 px-4 lg:mt-12 lg:px-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
            <p className="text-muted-foreground">
              {t("description")}
            </p>
          </div>

          <AccountOverviewCards profile={profile} isLoading={isLoading} />

          {isLoading ? (
            <Card>
              <CardContent className="space-y-6 p-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
                <Skeleton className="h-56 w-full" />
              </CardContent>
            </Card>
          ) : loadError || !profile ? (
            <Card>
              <CardContent className="flex min-h-[280px] flex-col items-center justify-center px-6 py-12 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border bg-muted/30">
                  <AlertCircle className="h-7 w-7 text-muted-foreground" />
                </div>
                <h2 className="text-lg font-semibold">{t("error_state.title")}</h2>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  {loadError || t("error_state.description")}
                </p>
                <Button onClick={loadProfile} className="mt-6 cursor-pointer">
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  {t("actions.retry")}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
              <AccountProfileForm
                profile={profile}
                onProfileUpdated={handleProfileUpdated}
              />

              <Card className="h-fit">
                <CardContent className="space-y-4 p-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl border bg-muted/30">
                    <CircleUserRound className="h-7 w-7 text-muted-foreground" />
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold">{profile.name}</h2>
                    <p className="text-sm text-muted-foreground">@{profile.username}</p>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="space-y-1">
                      <div className="font-medium text-muted-foreground">{t("sidebar.email")}</div>
                      <div>{profile.email}</div>
                    </div>

                    <div className="space-y-1">
                      <div className="font-medium text-muted-foreground">{t("sidebar.role")}</div>
                      <div>{profile.role?.name || t("shared.empty_value")}</div>
                    </div>

                    <div className="space-y-1">
                      <div className="font-medium text-muted-foreground">{t("sidebar.created_at")}</div>
                      <div>
                        {profile.createdAt
                          ? formatLocalizedDateTime(new Date(profile.createdAt), locale)
                          : t("shared.empty_value")}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
