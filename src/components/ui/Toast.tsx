"use client";

import { useState, useEffect, createContext, useContext, useCallback, ReactNode } from "react";
import { CheckCircle2, XCircle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/cn";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string, duration = 4000) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, message, duration }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: Toast[];
  removeToast: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 10);

    // Auto-dismiss
    if (toast.duration) {
      const timer = setTimeout(() => {
        setIsLeaving(true);
        setTimeout(onClose, 200);
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.duration, onClose]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(onClose, 200);
  };

  const icons = {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
  };

  const styles = {
    success: "bg-sage-50 border-sage-200 text-sage-800",
    error: "bg-grey-50 border-grey-300 text-grey-800",
    warning: "bg-grey-50 border-grey-300 text-grey-800",
    info: "bg-sage-50 border-sage-200 text-sage-800",
  };

  const iconStyles = {
    success: "text-sage-500",
    error: "text-grey-500",
    warning: "text-grey-500",
    info: "text-sage-500",
  };

  const Icon = icons[toast.type];

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg transition-all duration-200",
        styles[toast.type],
        isVisible && !isLeaving ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
      )}
    >
      <Icon className={cn("h-5 w-5 flex-shrink-0", iconStyles[toast.type])} />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={handleClose}
        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg text-grey-400 transition-colors hover:bg-grey-200 hover:text-grey-600"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
