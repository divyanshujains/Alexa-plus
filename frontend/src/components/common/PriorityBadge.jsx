import React from "react";
import { cn } from "../../utils/cn.js";
import { ArrowUp, ArrowRight, ArrowDown } from "lucide-react";

export function PriorityBadge({ priority = "medium", className }) {
  const p = (priority || "medium").toLowerCase();

  const configs = {
    high: {
      label: "High",
      icon: ArrowUp,
      bg: "bg-[#9E5A5A]/15",
      text: "text-[#E08A8A]",
      border: "border-[#9E5A5A]/30",
    },
    medium: {
      label: "Medium",
      icon: ArrowRight,
      bg: "bg-gold/10",
      text: "text-gold",
      border: "border-gold/30",
    },
    low: {
      label: "Low",
      icon: ArrowDown,
      bg: "bg-sage/10",
      text: "text-sage",
      border: "border-sage/30",
    },
  };

  const config = configs[p] || configs.medium;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border tracking-wider uppercase font-mono transition-colors",
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      <Icon className="w-2.5 h-2.5 stroke-[2.5]" />
      {config.label}
    </span>
  );
}
