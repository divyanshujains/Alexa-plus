import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Clock,
  AlertTriangle,
  Sliders,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useApp } from "../../context/AppContext.jsx";
import { PriorityBadge } from "../common/PriorityBadge.jsx";
import { cn } from "../../utils/cn.js";

export function DailyPlanner() {
  const { todayPlan, fetchPlan } = useApp();
  const [budgetMinutes, setBudgetMinutes] = useState(240); // 4 hours
  const [startTime, setStartTime] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    handleGeneratePlan(budgetMinutes, startTime);
  }, []);

  const handleGeneratePlan = async (minutes, time) => {
    setIsGenerating(true);
    try {
      await fetchPlan(minutes, time || null);
    } finally {
      setIsGenerating(false);
    }
  };

  const plan = todayPlan;
  const sessions = plan?.sessions || [];
  const remaining = plan?.remainingTasks || [];

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="p-6 rounded-2xl border border-obsidian-border bg-obsidian-surface shadow-card">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-display font-medium text-ivory flex items-center gap-2">
              <Sliders className="w-4 h-4 text-gold stroke-[1.75]" />
              Time Allocation & Focus Constraints
            </h3>
            <p className="text-xs text-slate mt-1 font-sans">
              Deterministic, grounded planner prioritizing overdue blockers with zero imaginary clock-times.
            </p>
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-2">
            {[120, 240, 360, 480].map((mins) => (
              <button
                key={mins}
                onClick={() => {
                  setBudgetMinutes(mins);
                  handleGeneratePlan(mins, startTime);
                }}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium border transition-all",
                  budgetMinutes === mins
                    ? "bg-teal text-ivory border-gold/40 shadow-subtle font-semibold"
                    : "bg-obsidian-raised border-obsidian-border text-slate hover:text-ivory hover:border-gold/20"
                )}
              >
                {mins / 60}h
              </button>
            ))}
          </div>
        </div>

        {/* Custom Controls */}
        <div className="mt-5 pt-5 border-t border-obsidian-border/60 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-[11px] font-mono text-slate uppercase tracking-wider mb-2">
              Focus Time Budget:{" "}
              <strong className="text-gold font-semibold">
                {budgetMinutes} mins ({Math.floor(budgetMinutes / 60)}h{" "}
                {budgetMinutes % 60}m)
              </strong>
            </label>
            <input
              type="range"
              min="60"
              max="600"
              step="30"
              value={budgetMinutes}
              onChange={(e) => setBudgetMinutes(Number(e.target.value))}
              onMouseUp={() => handleGeneratePlan(budgetMinutes, startTime)}
              onTouchEnd={() => handleGeneratePlan(budgetMinutes, startTime)}
              className="w-full accent-gold bg-obsidian-deep cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-slate uppercase tracking-wider mb-2">
              Anchor Start Time (e.g. 09:00 AM — or leave empty for numbered sessions)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Leave blank for numbered sequence"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="flex-1 px-3.5 py-1.5 rounded-xl bg-obsidian-surface border border-obsidian-border text-xs text-ivory placeholder:text-slate/60 focus:outline-none focus:border-gold/50 font-mono"
              />
              <button
                onClick={() => handleGeneratePlan(budgetMinutes, startTime)}
                disabled={isGenerating}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-teal text-ivory border border-gold/30 hover:border-gold hover:bg-teal-subtle disabled:opacity-50 transition-all shadow-subtle"
              >
                {isGenerating ? "Computing..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Plan Summary Stats */}
      {plan && !plan.emptyState && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-obsidian-border bg-obsidian-surface text-center">
            <span className="text-[10px] font-mono text-slate uppercase tracking-wider block">
              Budget Allocated
            </span>
            <span className="text-xl font-display font-medium text-gold mt-1 block">
              {plan.totalAllocatedMinutes} / {plan.availableMinutes}m
            </span>
            <span className="text-[11px] font-mono text-slate/80 mt-0.5 block">
              {plan.remainingMinutes}m buffer reserved
            </span>
          </div>

          <div className="p-4 rounded-xl border border-obsidian-border bg-obsidian-surface text-center">
            <span className="text-[10px] font-mono text-slate uppercase tracking-wider block">
              Planned Work Sessions
            </span>
            <span className="text-xl font-display font-medium text-ivory mt-1 block">
              {sessions.length} Sessions
            </span>
            <span className="text-[11px] font-mono text-slate/80 mt-0.5 block">
              Numbered execution sequence
            </span>
          </div>

          <div className="p-4 rounded-xl border border-obsidian-border bg-obsidian-surface text-center">
            <span className="text-[10px] font-mono text-slate uppercase tracking-wider block">
              Deferred to Next Slot
            </span>
            <span className="text-xl font-display font-medium text-slate mt-1 block">
              {remaining.length} Tasks
            </span>
            <span className="text-[11px] font-mono text-slate/80 mt-0.5 block">
              Safeguards available time
            </span>
          </div>
        </div>
      )}

      {/* Plan Sessions Timeline */}
      {sessions.length > 0 ? (
        <div className="space-y-3">
          <h4 className="text-xs font-mono font-medium text-slate uppercase tracking-widest px-1">
            Chronological Orchestration Sequence
          </h4>

          {sessions.map((session, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={cn(
                "p-4 rounded-xl border bg-obsidian-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-subtle transition-all",
                session.isOverdue
                  ? "border-[#9E5A5A]/40 bg-[#9E5A5A]/5"
                  : "border-obsidian-border hover:border-gold/30"
              )}
            >
              <div className="flex items-start sm:items-center gap-3.5">
                <div
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center font-mono font-semibold text-xs flex-shrink-0 border",
                    session.isOverdue
                      ? "bg-[#9E5A5A]/20 text-[#E08A8A] border-[#9E5A5A]/30"
                      : "bg-teal/40 text-gold border-gold/25"
                  )}
                >
                  #{session.sessionNumber}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-medium text-slate">
                      {session.label}
                    </span>
                    {session.isOverdue && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-[#9E5A5A]/20 text-[#E08A8A] border border-[#9E5A5A]/30">
                        Overdue Priority
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-medium text-ivory">
                    {session.taskTitle}
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center font-mono text-xs">
                <PriorityBadge priority={session.priority} />
                <span
                  className={cn(
                    "px-2.5 py-1 rounded-lg border text-xs",
                    session.isEstimatedDuration
                      ? "bg-gold/10 border-gold/25 text-gold"
                      : "bg-obsidian-raised border-obsidian-border text-slate"
                  )}
                >
                  <Clock className="w-3 h-3 inline mr-1 stroke-[1.75]" />
                  {session.durationLabel}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center rounded-2xl border border-dashed border-obsidian-border bg-obsidian-surface/30">
          <CalendarDays className="w-7 h-7 text-gold mx-auto mb-2 stroke-[1.75]" />
          <h4 className="text-base font-display font-medium text-ivory">
            No Scheduled Tasks in Active Plan
          </h4>
          <p className="text-xs text-slate mt-1 max-w-sm mx-auto font-sans">
            You currently have no tasks assigned to today's focus window. Create tasks or instruct LifePilot AI to draft an executive focus schedule.
          </p>
        </div>
      )}

      {/* Remaining Tasks Section */}
      {remaining.length > 0 && (
        <div className="pt-4 border-t border-obsidian-border/50">
          <h4 className="text-[10px] font-mono uppercase tracking-widest text-slate mb-3">
            Remaining Tasks (Deferred to Protect Focus Window)
          </h4>
          <div className="space-y-2">
            {remaining.map((task, i) => (
              <div
                key={i}
                className="p-3 rounded-lg border border-obsidian-border/50 bg-obsidian-surface/30 flex items-center justify-between text-xs text-slate"
              >
                <span>{task.taskTitle}</span>
                <span className="font-mono text-slate/70 text-[11px]">
                  {task.durationMinutes}m ({task.reason})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
