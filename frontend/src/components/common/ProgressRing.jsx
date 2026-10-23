import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn.js";

export function ProgressRing({
  percentage = 0,
  size = 54,
  strokeWidth = 4,
  color = "#B69A62",
  trackColor = "#1E2C2A",
  className,
  children,
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Animated Progress Indicator */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children || (
          <span className="text-[11px] font-mono font-semibold text-ivory">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
    </div>
  );
}
