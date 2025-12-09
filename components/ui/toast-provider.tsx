"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, AlertTriangle, Info, XCircle } from "lucide-react";

type ToastVariant = "default" | "success" | "destructive" | "warning" | "info";

interface ToastItem {
  id: number;
  title?: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastContextValue {
  toast: (toast: Omit<ToastItem, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((toast: Omit<ToastItem, "id">) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, ...toast }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed top-20 right-6 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto min-w-[260px] rounded-md border bg-background px-3 py-2 text-xs shadow-md transition-all flex items-start gap-2 ${
              t.variant === "success"
                ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                : t.variant === "destructive"
                ? "border-red-300 bg-red-50 text-red-900"
                : t.variant === "warning"
                ? "border-amber-300 bg-amber-50 text-amber-900"
                : t.variant === "info"
                ? "border-sky-300 bg-sky-50 text-sky-900"
                : "border-border text-foreground"
            }`}
          >
            <div className="mt-[2px]">
              {t.variant === "success" && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
              {t.variant === "destructive" && <XCircle className="h-3.5 w-3.5 text-red-600" />}
              {t.variant === "warning" && <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />}
              {(!t.variant || t.variant === "default" || t.variant === "info") && (
                <Info className="h-3.5 w-3.5 text-sky-600" />
              )}
            </div>
            <div>
              {t.title && <p className="font-semibold mb-0.5">{t.title}</p>}
              {t.description && <p className="text-[11px] text-muted-foreground">{t.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx.toast;
}
