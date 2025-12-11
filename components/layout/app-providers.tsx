"use client";

import type { ReactNode } from "react";
import { ToastProvider } from "@/components/ui/toast-provider";
import { AuthContext, useAuthProvider } from "@/hooks/use-auth";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const auth = useAuthProvider();

  return (
    <AuthContext.Provider value={auth}>
      <ToastProvider>{children}</ToastProvider>
    </AuthContext.Provider>
  );
}
