import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

export function ConfirmDialog({
  isOpen,
  title = "Confirm Deletion",
  message = "Are you sure you want to delete this task? This action cannot be undone.",
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  isDestructive = true,
}) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="w-full max-w-md p-6 rounded-2xl border border-obsidian-border bg-obsidian-raised shadow-card relative"
        >
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate hover:text-ivory hover:bg-obsidian-hover transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-[#9E5A5A]/15 border border-[#9E5A5A]/30 text-[#E08A8A]">
              <AlertTriangle className="w-5 h-5 stroke-[1.75]" />
            </div>
            <h3 className="text-lg font-display font-medium text-ivory">
              {title}
            </h3>
          </div>

          <p className="text-xs sm:text-sm text-slate leading-relaxed mb-6 font-sans">
            {message}
          </p>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate hover:text-ivory hover:bg-obsidian-hover transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#9E5A5A] text-white hover:bg-[#854747] transition-colors shadow-subtle"
            >
              {confirmLabel}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
