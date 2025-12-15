"use client";

import type { ReactNode } from "react";
import { useNotificationToasts } from "@/hooks/use-notifications";
import { NotificationToastContainer } from "@/components/ui/notification-toast";

interface NotificationWrapperProps {
  children: ReactNode;
}

export function NotificationWrapper({ children }: NotificationWrapperProps) {
  const { activeToasts, removeToast } = useNotificationToasts();

  return (
    <>
      {children}
      <NotificationToastContainer
        toasts={activeToasts}
        onRemove={removeToast}
      />
    </>
  );
}
