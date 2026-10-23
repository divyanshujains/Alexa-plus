import React from "react";
import { Plus, Menu, RefreshCw, Cpu, Database } from "lucide-react";
import { useApp } from "../../context/AppContext.jsx";

export function AppHeader({ onToggleSidebar }) {
  const { openCreateTask, refreshAll, isRefreshing, healthStatus } = useApp();

  const todayStr = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(new Date());

  const isConnected = healthStatus?.mongoStatus === "connected";

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-18 px-4 sm:px-8 border-b border-obsidian-border bg-obsidian/90 backdrop-blur-md">
      {/* Left section: Hamburger (mobile) + Date & Title */}
      <div className="flex items-center gap-3.5">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate hover:text-ivory hover:bg-obsidian-surface border border-obsidian-border transition-colors"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <span className="text-[11px] font-mono tracking-widest uppercase text-slate">
            {todayStr}
          </span>
          <h2 className="text-base sm:text-lg font-display font-medium text-ivory tracking-wide hidden sm:block">
            Executive Orchestration
          </h2>
        </div>
      </div>

      {/* Right section: System health + Refresh + New Task */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* System Health Status Pill */}
        <div
          title={
            isConnected
              ? `Connected to MongoDB Atlas | Model: ${healthStatus?.model || "openai/gpt-oss-20b"}`
              : "Backend or Database Disconnected"
          }
          className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-gold/20 bg-teal/40 text-[11px] font-mono"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isConnected
                ? "bg-sage shadow-[0_0_6px_rgba(167,182,162,0.9)]"
                : "bg-brand-rose"
            }`}
          />
          <span className="text-ivory/90 font-medium">
            {isConnected ? "Atlas Verified" : "Offline"}
          </span>
        </div>

        {/* Refresh button */}
        <button
          onClick={() => refreshAll()}
          disabled={isRefreshing}
          className="p-2 rounded-xl border border-obsidian-border bg-obsidian-surface text-slate hover:text-gold hover:border-gold/30 hover:bg-obsidian-raised transition-all disabled:opacity-50"
          title="Refresh workspace telemetry"
          aria-label="Refresh workspace data"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-gold" : ""}`} />
        </button>

        {/* Luxury New Task Button */}
        <button
          onClick={openCreateTask}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-teal text-ivory border border-gold/40 hover:border-gold hover:bg-teal-subtle hover:shadow-gold transition-all duration-200"
        >
          <Plus className="w-4 h-4 stroke-[2.2] text-gold" />
          <span>New Task</span>
        </button>
      </div>
    </header>
  );
}
