"use client";

import React from "react";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useSidebarConfig } from "@/hooks/use-sidebar-config";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth-store";
import {
  AUTH_REDIRECT_REASON,
  buildSafeNextPath,
  buildSignInPath,
  isTokenExpired,
} from "@/lib/auth-session";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { config } = useSidebarConfig();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const token = useAuthStore((state) => state.token);
  const syncSession = useAuthStore((state) => state.syncSession);
  const logout = useAuthStore((state) => state.logout);
  const currentPath = React.useMemo(() => {
    const query = searchParams.toString();
    return buildSafeNextPath(pathname, query ? `?${query}` : "");
  }, [pathname, searchParams]);
  const isOperationalMapRoute = pathname === "/map";
  const [isBootstrappingSession, setIsBootstrappingSession] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;

    const bootstrapSession = async () => {
      if (!hasHydrated) {
        return;
      }

      if (!isAuthenticated || !token) {
        setIsBootstrappingSession(false);
        return;
      }

      if (isTokenExpired(token)) {
        logout();
        router.replace(
          buildSignInPath(currentPath, AUTH_REDIRECT_REASON.sessionExpired),
        );
        return;
      }

      setIsBootstrappingSession(true);

      try {
        const snapshot = await authService.checkToken();
        if (!cancelled) {
          syncSession(snapshot);
        }
      } catch (error) {
        if (
          !cancelled &&
          axios.isAxiosError(error) &&
          error.response?.status === 401
        ) {
          logout();
          router.replace(
            buildSignInPath(currentPath, AUTH_REDIRECT_REASON.sessionExpired),
          );
        }
      } finally {
        if (!cancelled) {
          setIsBootstrappingSession(false);
        }
      }
    };

    void bootstrapSession();

    return () => {
      cancelled = true;
    };
  }, [
    currentPath,
    hasHydrated,
    isAuthenticated,
    logout,
    router,
    syncSession,
    token,
  ]);

  if (!hasHydrated || isBootstrappingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="inline-flex items-center gap-3 rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Validando permissões e sessão...
        </div>
      </div>
    );
  }

  const content = (
    <SidebarInset className={isOperationalMapRoute ? "overflow-hidden" : undefined}>
      <SiteHeader floating={isOperationalMapRoute} />
      <div
        className={cn(
          "flex flex-1 flex-col",
          isOperationalMapRoute && "min-h-0 overflow-hidden",
        )}
      >
        <div
          className={cn(
            "@container/main flex flex-1 flex-col gap-2",
            isOperationalMapRoute && "min-h-0 gap-0 overflow-hidden",
          )}
        >
          <div
            className={cn(
              "flex flex-col gap-4 py-4 md:gap-6 md:py-6",
              isOperationalMapRoute && "relative min-h-0 flex-1 gap-0 py-0",
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </SidebarInset>
  );

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "16rem",
        "--sidebar-width-icon": "3rem",
        "--header-height": "calc(var(--spacing) * 14)",
      } as React.CSSProperties}
      className={config.collapsible === "none" ? "sidebar-none-mode" : ""}
    >
      {config.side === "left" ? (
        <>
          <AppSidebar
            variant={config.variant}
            collapsible={config.collapsible}
            side={config.side}
          />
          {content}
        </>
      ) : (
        <>
          {content}
          <AppSidebar
            variant={config.variant}
            collapsible={config.collapsible}
            side={config.side}
          />
        </>
      )}
    </SidebarProvider>
  );
}
