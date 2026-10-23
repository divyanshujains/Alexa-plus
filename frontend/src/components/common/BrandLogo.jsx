import React from "react";
import { Link } from "react-router-dom";
import { cn } from "../../utils/cn.js";

/**
 * Geometric Navigation Mark for LifePilot AI.
 * Quiet luxury navigation icon: intersecting geometric points, orbital ring, antique gold & warm ivory against midnight teal.
 */
export function BrandMark({ size = 32, className }) {
  return (
    <div
      style={{ width: size, height: size }}
      className={cn(
        "relative rounded-xl bg-teal flex items-center justify-center border border-gold/30 shadow-subtle flex-shrink-0 transition-transform duration-300 group-hover:scale-105",
        className
      )}
    >
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full p-1.5"
      >
        {/* Subtle celestial navigation orbital ring */}
        <circle
          cx="16"
          cy="16"
          r="9.5"
          stroke="#B69A62"
          strokeWidth="0.8"
          strokeDasharray="2 2"
          className="opacity-60"
        />

        {/* Outer diamond guide */}
        <polygon
          points="16,3 29,16 16,29 3,16"
          stroke="#B69A62"
          strokeWidth="0.5"
          className="opacity-30"
        />

        {/* Vertical Compass Needle - Warm Ivory */}
        <polygon
          points="16,4 18.5,16 16,28 13.5,16"
          fill="#F0EEE5"
        />

        {/* Horizontal Crossbeam - Muted Antique Gold */}
        <polygon
          points="4,16 16,18.5 28,16 16,13.5"
          fill="#B69A62"
        />

        {/* Center Pivot Point */}
        <circle cx="16" cy="16" r="2.2" fill="#082F32" />
        <circle cx="16" cy="16" r="1" fill="#F0EEE5" />
      </svg>
    </div>
  );
}

/**
 * LifePilot Brand Wordmark + Mark pairing.
 */
export function BrandLogo({
  to = "/",
  size = 32,
  showTagline = true,
  className,
}) {
  const content = (
    <div className={cn("flex items-center gap-3 group select-none", className)}>
      <BrandMark size={size} />
      <div className="flex flex-col">
        <div className="flex items-baseline gap-1.5 leading-none">
          <span className="font-display text-lg tracking-tight font-semibold text-ivory group-hover:text-gold transition-colors">
            LifePilot
          </span>
          <span className="font-mono text-[10px] tracking-widest uppercase font-semibold text-gold px-1 py-0.2 rounded border border-gold/30 bg-gold/10">
            AI
          </span>
        </div>
        {showTagline && (
          <span className="text-[10px] font-mono tracking-wider text-slate uppercase mt-1">
            Quiet Intelligence
          </span>
        )}
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="inline-flex items-center">
        {content}
      </Link>
    );
  }

  return content;
}
