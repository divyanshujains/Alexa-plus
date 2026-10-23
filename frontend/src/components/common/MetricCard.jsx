import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn.js";

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "gold",
  className,
}) {
  const colorMap = {
    gold: {
      iconBg: "bg-gold/10",
      iconText: "text-gold",
      borderGlow: "hover:border-gold/30",
    },
    teal: {
      iconBg: "bg-teal/40",
      iconText: "text-ivory",
      borderGlow: "hover:border-gold/30",
    },
    sage: {
      iconBg: "bg-sage/10",
      iconText: "text-sage",
      borderGlow: "hover:border-sage/40",
    },
    rose: {
      iconBg: "bg-[#9E5A5A]/15",
      iconText: "text-[#E08A8A]",
      borderGlow: "hover:border-[#9E5A5A]/40",
    },
    // Compat aliases
    violet: {
      iconBg: "bg-teal/40",
      iconText: "text-gold",
      borderGlow: "hover:border-gold/30",
    },
    blue: {
      iconBg: "bg-sage/10",
      iconText: "text-sage",
      borderGlow: "hover:border-sage/40",
    },
    emerald: {
      iconBg: "bg-sage/15",
      iconText: "text-sage",
      borderGlow: "hover:border-sage/40",
    },
    amber: {
      iconBg: "bg-gold/10",
      iconText: "text-gold",
      borderGlow: "hover:border-gold/30",
    },
  };

  const scheme = colorMap[color] || colorMap.gold;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "p-5 rounded-2xl bg-obsidian-surface border border-obsidian-border transition-all duration-200 shadow-subtle group",
        scheme.borderGlow,
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-slate uppercase tracking-widest font-mono">
          {title}
        </span>
        {Icon && (
          <div className={cn("p-2 rounded-xl border border-obsidian-border/60 transition-colors", scheme.iconBg)}>
            <Icon className={cn("w-4 h-4 stroke-[1.75]", scheme.iconText)} />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl sm:text-4xl font-display font-medium text-ivory tracking-tight">
          {value}
        </span>
        {trend && (
          <span className="text-[11px] font-mono text-slate">
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1.5 text-xs text-slate truncate font-sans">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
