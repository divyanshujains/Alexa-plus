import React from "react";
import { User, Copy, Check, Cpu, Zap, Activity } from "lucide-react";
import { BrandMark } from "../common/BrandLogo.jsx";
import { cn } from "../../utils/cn.js";

export function ChatMessage({ message }) {
  const [copied, setCopied] = React.useState(false);
  const isUser = message.role === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple formatting helper for markdown bold and bullet points
  const formatText = (text) => {
    return text.split("\n").map((line, i) => {
      // Bullet points
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        return (
          <li key={i} className="ml-4 list-disc text-xs sm:text-sm my-0.5 leading-relaxed">
            {line.trim().substring(2)}
          </li>
        );
      }
      if (/^\d+\.\s/.test(line.trim())) {
        return (
          <li key={i} className="ml-4 list-decimal text-xs sm:text-sm my-0.5 leading-relaxed">
            {line.trim().replace(/^\d+\.\s/, "")}
          </li>
        );
      }
      return (
        <p key={i} className="my-1 text-xs sm:text-sm leading-relaxed">
          {line}
        </p>
      );
    });
  };

  return (
    <div
      className={cn(
        "flex gap-3.5 sm:gap-4 p-5 rounded-2xl transition-all",
        isUser
          ? "bg-ivory text-obsidian border border-gold/30 shadow-subtle ml-4 sm:ml-12"
          : "bg-obsidian-surface border border-obsidian-border mr-4 sm:mr-12"
      )}
    >
      {/* Avatar Icon */}
      {isUser ? (
        <div className="w-8 h-8 rounded-xl bg-obsidian-deep text-ivory flex items-center justify-center flex-shrink-0 mt-0.5 border border-gold/20 shadow-subtle">
          <User className="w-4 h-4 text-gold stroke-[1.75]" />
        </div>
      ) : (
        <BrandMark size={32} />
      )}

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span
            className={cn(
              "text-xs font-semibold tracking-wide",
              isUser ? "text-obsidian font-mono uppercase tracking-wider" : "font-display text-sm text-gold"
            )}
          >
            {isUser ? "Executive Request" : "LifePilot Concierge"}
          </span>
          <div className="flex items-center gap-2">
            {message.timestamp && (
              <span
                className={cn(
                  "text-[10px] font-mono",
                  isUser ? "text-obsidian/60" : "text-slate"
                )}
              >
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
            <button
              onClick={handleCopy}
              className={cn(
                "p-1 rounded transition-colors",
                isUser
                  ? "text-obsidian/50 hover:text-obsidian"
                  : "text-slate hover:text-gold"
              )}
              title="Copy message"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-sage" />
              ) : (
                <Copy className="w-3.5 h-3.5 stroke-[1.75]" />
              )}
            </button>
          </div>
        </div>

        <div
          className={cn(
            "space-y-1 font-sans",
            isUser ? "text-obsidian font-medium" : "text-ivory"
          )}
        >
          {formatText(message.content)}
        </div>

        {/* Real Token Telemetry Metrics Pill (for assistant messages) */}
        {!isUser && message.metrics && (
          <div className="mt-4 pt-3 border-t border-obsidian-border/60 flex flex-wrap items-center gap-2 text-[10px] font-mono text-slate">
            <span className="inline-flex items-center gap-1 bg-obsidian-raised px-2.5 py-1 rounded-md border border-obsidian-border text-ivory">
              <Cpu className="w-3 h-3 text-gold" />
              {message.metrics.model}
            </span>
            <span className="inline-flex items-center gap-1 bg-obsidian-raised px-2.5 py-1 rounded-md border border-obsidian-border text-ivory">
              <Zap className="w-3 h-3 text-sage" />
              {message.metrics.totalTokens} tokens ({message.metrics.promptTokens} in /{" "}
              {message.metrics.completionTokens} out)
            </span>
            <span className="bg-obsidian-raised px-2.5 py-1 rounded-md border border-obsidian-border text-slate">
              {message.metrics.durationMs}ms latency
            </span>
            {message.metrics.toolCallsCount > 0 && (
              <span className="inline-flex items-center gap-1 text-gold bg-teal/40 px-2.5 py-1 rounded-md border border-gold/30">
                <Activity className="w-3 h-3 text-gold" />
                {message.metrics.toolCallsCount} MCP{" "}
                {message.metrics.toolCallsCount === 1 ? "tool" : "tools"} executed
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
