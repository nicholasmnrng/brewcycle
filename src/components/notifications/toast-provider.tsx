"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info" | "warning" | "loading";

type Toast = {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
  actionLabel?: string;
};

type ToastContextValue = {
  notify: (toast: Omit<Toast, "id"> & { browser?: boolean }) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((toast: Omit<Toast, "id"> & { browser?: boolean }) => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { ...toast, id }]);

    if (toast.browser && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(toast.title, { body: toast.description });
      } else if (Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification(toast.title, { body: toast.description });
          }
        });
      }
    }

    if (toast.type !== "loading") {
      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== id));
      }, toast.actionLabel ? 8000 : 4200);
    }
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-[80] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3">
        {toasts.map((toast) => (
          <ToastCard
            key={toast.id}
            toast={toast}
            onDismiss={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }

  return context;
}

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const Icon =
    toast.type === "success"
      ? CheckCircle2
      : toast.type === "error"
        ? XCircle
        : toast.type === "warning"
          ? AlertTriangle
          : toast.type === "loading"
            ? Loader2
            : Info;

  return (
    <div
      className={cn(
        "rounded-2xl border bg-white p-4 shadow-premium",
        toast.type === "success" && "border-green-200",
        toast.type === "error" && "border-red-200",
        toast.type === "info" && "border-amber-200",
        toast.type === "warning" && "border-orange-200",
        toast.type === "loading" && "border-slate-200"
      )}
    >
      <div className="flex gap-3">
        <Icon
          className={cn(
            "mt-0.5 h-5 w-5",
            toast.type === "success" && "text-primary",
            toast.type === "error" && "text-destructive",
            toast.type === "info" && "text-warning",
            toast.type === "warning" && "text-warning",
            toast.type === "loading" && "animate-spin text-slate-500"
          )}
        />
        <div>
          <p className="text-sm font-semibold text-slate-950">{toast.title}</p>
          {toast.description ? <p className="mt-1 text-sm leading-5 text-slate-600">{toast.description}</p> : null}
          {toast.actionLabel ? (
            <Button className="mt-3 h-9" size="sm" variant="outline" onClick={onDismiss}>
              {toast.actionLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
