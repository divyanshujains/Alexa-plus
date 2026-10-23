import React from "react";
import { DailyPlanner } from "../components/planner/DailyPlanner.jsx";
import { ShieldCheck } from "lucide-react";

export function PlannerView() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="pb-4 border-b border-obsidian-border">
        <div className="flex items-center gap-2 text-gold mb-1.5">
          <ShieldCheck className="w-4 h-4 stroke-[1.75]" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest">
            Zero-Hallucination Grounding
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-display font-medium text-ivory tracking-tight">
          Executive Daily Planner
        </h1>
        <p className="text-xs sm:text-sm text-slate mt-1 max-w-2xl font-sans">
          Deterministic schedule allocation strictly respecting your real time budget, prioritizing overdue blockers into Session 1, and never fabricating imaginary clock times.
        </p>
      </div>

      <DailyPlanner />
    </div>
  );
}
