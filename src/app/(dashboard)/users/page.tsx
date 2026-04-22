"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { ScreenGuard } from "@/components/shared/screen-guard"
import { roleService } from "@/services/role.service"
import { userService } from "@/services/user.service"
import { Empresa } from "@/types/empresa"
import { Role } from "@/types/role"
import { User } from "@/types/user"
import { DataTable } from "./components/data-table"
import { StatCards } from "./components/stat-cards"
import { useAuthStore } from "@/store/auth-store"

const USERS_FETCH_PAGE_SIZE = 100

import { useTranslator } from "@/lib/i18n"

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const t = useTranslator("users")
  const activeCompanyId = useAuthStore((state) => state.activeCompanyId)
  const availableCompanies = useAuthStore((state) => state.availableCompanies)
  const fetchErrorMessageRef = useRef(t("fetch_error"))
  fetchErrorMessageRef.current = t("fetch_error")

  const companies = useMemo<Empresa[]>(() => {
    if (activeCompanyId === "ALL") {
      return availableCompanies.map((company) => ({
        id: company.id,
        nome: company.nome,
        status: "active",
      }))
    }

    const activeCompany = availableCompanies.find(
      (company) => String(company.id) === String(activeCompanyId),
    )

    return activeCompany
      ? [
          {
            id: activeCompany.id,
            nome: activeCompany.nome,
            status: "active",
          },
        ]
      : []
  }, [activeCompanyId, availableCompanies])

  const loadAllUsers = useCallback(async () => {
    const firstPage = await userService.findAll(1, USERS_FETCH_PAGE_SIZE)
    const totalPages = Math.max(1, Math.ceil(firstPage.total / USERS_FETCH_PAGE_SIZE))

    if (totalPages === 1) {
      return firstPage.items
    }

    const remainingPages = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, index) =>
        userService.findAll(index + 2, USERS_FETCH_PAGE_SIZE)
      )
    )

    return [
      ...firstPage.items,
      ...remainingPages.flatMap((response) => response.items),
    ]
  }, [])

  const loadUsers = useCallback(async () => {
    setIsLoading(true)

    try {
      const usersData = await loadAllUsers()
      const rolesByCompany = await Promise.all(
        companies.map((company) => roleService.findAllNoPagination(company.id)),
      )

      const rolesData = Array.from(
        new Map(
          rolesByCompany
            .flat()
            .map((role) => [role.id, role]),
        ).values(),
      )

      setUsers(usersData)
      setRoles(rolesData)
    } catch (error) {
      toast.apiError(error, fetchErrorMessageRef.current)
      setUsers([])
      setRoles([])
    } finally {
      setIsLoading(false)
    }
  }, [companies, loadAllUsers])

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
            <DataTable
              users={users}
              roles={roles}
              companies={companies}
              isLoading={isLoading}
              onRefresh={loadUsers}
            />
          </div>
        </div>
      </div>
    </ScreenGuard>
  )
}
