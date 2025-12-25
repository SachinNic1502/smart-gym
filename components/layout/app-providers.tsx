"use client";

import type { ReactNode } from "react";
import { ToastProvider } from "@/components/ui/toast-provider";
import { AuthContext, useAuthProvider } from "@/hooks/use-auth";
import { NotificationProvider } from "@/hooks/use-notifications";
import { NotificationWrapper } from "@/components/layout/notification-wrapper";
import { SettingsProvider } from "@/lib/hooks/use-settings";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const auth = useAuthProvider();

  return (
    <AuthContext.Provider value={auth}>
      <SettingsProvider>
        <ToastProvider>
          <NotificationProvider>
            <NotificationWrapper>{children}</NotificationWrapper>
          </NotificationProvider>
        </ToastProvider>
      </SettingsProvider>
    </AuthContext.Provider>
  );
}
