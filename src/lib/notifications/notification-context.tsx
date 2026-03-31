"use client"

import { createContext, useContext, useEffect, useMemo } from "react"
import { Toaster } from "@/components/ui/sonner"
import { notificationService } from "./notification-service"
import { SonnerNotificationAdapter } from "./sonner-notification-adapter"
import { NotificationPort } from "./types"

const NotificationContext = createContext<NotificationPort>(notificationService)

interface NotificationProviderProps {
  children: React.ReactNode
  adapter?: NotificationPort
}

export function NotificationProvider({
  children,
  adapter,
}: NotificationProviderProps) {
  const port = useMemo(() => adapter || new SonnerNotificationAdapter(), [adapter])

  useEffect(() => {
    notificationService.setPort(port)

    return () => {
      notificationService.resetPort()
    }
  }, [port])

  return (
    <NotificationContext.Provider value={port}>
      {children}
      <Toaster position="top-right" expand />
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  return useContext(NotificationContext)
}
