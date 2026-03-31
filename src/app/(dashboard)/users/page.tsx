"use client"

import { useCallback, useEffect, useState } from "react"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { ScreenGuard } from "@/components/shared/screen-guard"
import { userService } from "@/services/user.service"
import { User } from "@/types/user"
import { DataTable } from "./components/data-table"
import { StatCards } from "./components/stat-cards"

const USERS_FETCH_PAGE_SIZE = 100

import { useTranslator } from "@/lib/i18n"

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const t = useTranslator("users")
  const fetchErrorMessage = t("fetch_error")

  const loadUsers = useCallback(async () => {
    setIsLoading(true)

    try {
      const firstPage = await userService.findAll(1, USERS_FETCH_PAGE_SIZE)
      const totalPages = Math.max(1, Math.ceil(firstPage.total / USERS_FETCH_PAGE_SIZE))

      if (totalPages === 1) {
        setUsers(firstPage.items)
        return
      }

      const remainingPages = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, index) =>
          userService.findAll(index + 2, USERS_FETCH_PAGE_SIZE)
        )
      )

      setUsers([
        ...firstPage.items,
        ...remainingPages.flatMap((response) => response.items),
      ])
    } catch (error) {
      toast.apiError(error, fetchErrorMessage)
      setUsers([])
    } finally {
      setIsLoading(false)
    }
  }, [fetchErrorMessage])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  return (
    <ScreenGuard screenKey="admin.users">
      <div className="flex flex-col gap-4">
        <div className="@container/main mt-8 px-4 lg:mt-12 lg:px-6">
          <h2 className="mb-2 text-3xl font-bold tracking-tight">{t('title')}</h2>
          <p className="mb-6 text-muted-foreground">
            {t('description')}
          </p>

          <StatCards users={users} isLoading={isLoading} />

          <div className="mt-8">
            <DataTable users={users} isLoading={isLoading} onRefresh={loadUsers} />
          </div>
        </div>
      </div>
    </ScreenGuard>
  )
}
