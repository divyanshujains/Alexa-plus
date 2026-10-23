import React from "react";
import { cn } from "../../utils/cn.js";

export function LoadingSkeleton({ className, count = 1 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "animate-pulse rounded-xl bg-obsidian-raised border border-obsidian-border/40",
            className
          )}
        />
      ))}
    </>
  );
}

export function TaskListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-xl border border-obsidian-border bg-obsidian-surface flex items-center justify-between animate-pulse"
        >
          <div className="flex items-center gap-3 flex-1">
            <div className="w-5 h-5 rounded-md bg-obsidian-raised border border-obsidian-border" />
            <div className="space-y-2 flex-1 max-w-md">
              <div className="h-4 bg-obsidian-raised rounded w-3/4" />
              <div className="h-3 bg-obsidian-raised rounded w-1/3" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-16 h-5 rounded-full bg-obsidian-raised" />
            <div className="w-12 h-4 rounded bg-obsidian-raised" />
          </div>
        </div>
      ))}
    </div>
  );
}
