import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CheckSquare,
  CalendarDays,
  Target,
  Sparkles,
  Settings,
  X,
  Compass,
  Cpu,
} from "lucide-react";
import { useApp } from "../../context/AppContext.jsx";
import { BrandLogo } from "./BrandLogo.jsx";
import { cn } from "../../utils/cn.js";

const NAV_ITEMS = [
  { label: "Overview", path: "/", icon: LayoutDashboard },
  { label: "Tasks", path: "/tasks", icon: CheckSquare, showCount: true },
  { label: "Daily Planner", path: "/planner", icon: CalendarDays },
  { label: "Goals", path: "/goals", icon: Target },
  { label: "AI Concierge", path: "/assistant", icon: Sparkles, highlight: true },
  { label: "Settings", path: "/settings", icon: Settings },
];

export function AppSidebar({ isOpen, onClose }) {
  const location = useLocation();
  const { tasks, overdueTasks, healthStatus } = useApp();

  const pendingCount = tasks.filter((t) => t.status === "pending").length;
  const overdueCount = overdueTasks.length;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 w-64 border-r border-obsidian-border bg-obsidian flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-18 px-5 border-b border-obsidian-border">
          <BrandLogo to="/" size={34} showTagline={true} />

          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate hover:text-ivory hover:bg-obsidian-hover transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto no-scrollbar">
          <div className="px-3 pb-2 text-[10px] font-mono tracking-widest text-slate/70 uppercase">
            Workspace
          </div>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => onClose && onClose()}
                className={cn(
                  "relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all group",
                  isActive
                    ? "bg-ivory text-obsidian font-semibold shadow-subtle"
                    : "text-slate hover:text-ivory hover:bg-obsidian-hover/60"
                )}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-gold" />
                )}

                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "w-4 h-4 transition-colors stroke-[1.75]",
                      isActive
                        ? "text-teal font-bold"
                        : "text-slate group-hover:text-gold",
                      item.highlight && !isActive && "text-gold"
                    )}
                  />
                  <span className="tracking-tight">{item.label}</span>
                </div>

                {item.showCount && pendingCount > 0 && (
                  <span
                    className={cn(
                      "px-2 py-0.5 text-[10px] font-mono font-semibold rounded-full transition-colors",
                      isActive
                        ? "bg-obsidian text-ivory"
                        : overdueCount > 0
                        ? "bg-brand-rose/20 text-brand-rose border border-brand-rose/30"
                        : "bg-gold/15 text-gold border border-gold/25"
                    )}
                  >
                    {pendingCount}
                  </span>
                )}
              </NavLink>
            );
          })}

          <div className="pt-6 mt-6 border-t border-obsidian-border/60">
            <div className="px-3 pb-2 text-[10px] font-mono tracking-widest text-slate/70 uppercase">
              Showcase
            </div>
            <NavLink
              to="/landing"
              onClick={() => onClose && onClose()}
              className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-mono text-slate hover:text-gold hover:bg-obsidian-hover/40 transition-colors"
            >
              <Compass className="w-4 h-4 text-gold/70" />
              <span>Editorial Showcase</span>
            </NavLink>
          </div>
        </nav>

        {/* Footer info: Model Engine Card */}
        <div className="p-4 border-t border-obsidian-border bg-obsidian-deep/60">
          <div className="p-3.5 rounded-xl border border-gold/15 bg-teal/30 hover:border-gold/30 transition-colors">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono text-gold uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-3 h-3 text-gold" />
                Grounded Engine
              </span>
              <span className="w-2 h-2 rounded-full bg-sage shadow-[0_0_6px_rgba(167,182,162,0.8)]" />
            </div>
            <p className="text-xs font-mono font-semibold text-ivory truncate">
              {healthStatus?.model || "openai/gpt-oss-20b"}
            </p>
            <div className="flex items-center justify-between text-[10px] text-slate mt-1 font-mono">
              <span>Groq LPU</span>
              <span className="text-sage">• Zero Hallucination</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
