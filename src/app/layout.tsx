import type { Metadata } from "next";
import "./globals.css";

import { NotificationProvider } from "@/lib/notifications/notification-context";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarConfigProvider } from "@/contexts/sidebar-context";
import { UiSettingsProvider } from "@/contexts/ui-settings-context";
import { inter } from "@/lib/fonts";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

export const metadata: Metadata = {
  title: "Hórus Core",
  description: "Hórus Core UI",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${inter.variable} antialiased`}
      data-scroll-behavior="smooth"
    >
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ThemeProvider defaultTheme="system" storageKey="nextjs-ui-theme">
            <NotificationProvider>
              <SidebarConfigProvider>
                <UiSettingsProvider>
                  {children}
                </UiSettingsProvider>
              </SidebarConfigProvider>
            </NotificationProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
