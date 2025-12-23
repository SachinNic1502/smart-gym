"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, AlertTriangle, Info, XCircle } from "lucide-react";

type ToastVariant = "default" | "success" | "destructive" | "warning" | "info";

export interface ToastItem {
  id: number;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  action?: React.ReactNode | ((props: { dismiss: () => void }) => React.ReactNode);
  duration?: number;
}

interface ToastContextValue {
  toast: (toast: Omit<ToastItem, "id">) => number;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((toast: Omit<ToastItem, "id">) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, ...toast }]);

    if (toast.duration !== Infinity) {
      setTimeout(() => {
        dismiss(id);
      }, toast.duration || 3000);
    }

    return id;
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className="pointer-events-none fixed top-20 right-6 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto min-w-[300px] max-w-[420px] rounded-xl border bg-background p-4 text-sm shadow-xl transition-all flex flex-col gap-3 ${t.variant === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : t.variant === "destructive"
                ? "border-red-200 bg-red-50 text-red-900"
                : t.variant === "warning"
                  ? "border-amber-200 bg-amber-50 text-amber-900"
                  : t.variant === "info"
                    ? "border-sky-200 bg-sky-50 text-sky-900"
                    : "border-gray-200 bg-white text-gray-900"
              }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {t.variant === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                {t.variant === "destructive" && <AlertTriangle className="h-5 w-5 text-red-600" />}
                {t.variant === "warning" && <AlertTriangle className="h-5 w-5 text-amber-600" />}
                {(!t.variant || t.variant === "default" || t.variant === "info") && (
                  <Info className="h-5 w-5 text-sky-600" />
                )}
              </div>
              <div className="flex-1">
                {t.title && <p className="font-bold mb-1">{t.title}</p>}
                {t.description && <p className="text-xs opacity-90 leading-relaxed">{t.description}</p>}
              </div>
              <button onClick={() => dismiss(t.id)} className="text-current opacity-50 hover:opacity-100 transition-opacity">
                <XCircle className="h-4 w-4" />
              </button>
            </div>
            {t.action && (
              <div className="flex items-center justify-end gap-2 mt-1">
                {typeof t.action === 'function' ? t.action({ dismiss: () => dismiss(t.id) }) : t.action}
              </div>
            )}
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
  return ctx;
}
