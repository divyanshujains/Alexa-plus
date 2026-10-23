import React from "react";
import { Compass } from "lucide-react";
import { cn } from "../../utils/cn.js";

export function EmptyState({
  title = "No tasks found",
  description = "Organize your workflow by creating an executive task or command LifePilot to plan your focus.",
  icon: Icon = Compass,
  actionLabel,
  onAction,
  className,
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-obsidian-border bg-obsidian-surface/40",
        className
      )}
    >
      <div className="p-3.5 rounded-2xl bg-teal/30 border border-gold/20 text-gold mb-4 shadow-subtle">
        <Icon className="w-5 h-5 stroke-[1.75]" />
      </div>
      <h3 className="text-base sm:text-lg font-display font-medium text-ivory">
        {title}
      </h3>
      <p className="mt-1.5 text-xs sm:text-sm text-slate max-w-sm leading-relaxed font-sans">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-teal text-ivory border border-gold/30 hover:border-gold hover:bg-teal-subtle transition-all shadow-subtle flex items-center gap-2"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
