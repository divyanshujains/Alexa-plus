import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ title, message, type = "info", duration = 4000 }) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto p-4 rounded-xl border border-obsidian-border bg-obsidian-raised/95 backdrop-blur-md shadow-card flex items-start gap-3"
            >
              <div className="mt-0.5 flex-shrink-0">
                {toast.type === "success" && (
                  <CheckCircle2 className="w-4 h-4 text-sage" />
                )}
                {toast.type === "error" && (
                  <AlertCircle className="w-4 h-4 text-[#E08A8A]" />
                )}
                {toast.type === "info" && (
                  <Info className="w-4 h-4 text-gold" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                {toast.title && (
                  <h4 className="text-xs font-semibold text-ivory uppercase tracking-wider font-mono">
                    {toast.title}
                  </h4>
                )}
                {toast.message && (
                  <p className="text-xs text-slate mt-0.5 leading-relaxed break-words font-sans">
                    {toast.message}
                  </p>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate hover:text-ivory transition-colors"
                aria-label="Close notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
