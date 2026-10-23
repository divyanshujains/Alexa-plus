import React, { useState } from "react";
import {
  Settings,
  Database,
  Cpu,
  Shield,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Activity,
  Layers,
} from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import { api } from "../services/api.js";
import { useToast } from "../context/ToastContext.jsx";
import { BrandMark } from "../components/common/BrandLogo.jsx";

export function SettingsView() {
  const { healthStatus, refreshAll } = useApp();
  const { addToast } = useToast();
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState(null);

  const handlePing = async () => {
    setIsPinging(true);
    try {
      const res = await api.health.check();
      setPingResult(res);
      addToast({
        title: "Telemetry Verified",
        message: `API and MongoDB Atlas are responsive (${res.timestamp}).`,
        type: "success",
      });
      refreshAll(true);
    } catch (err) {
      setPingResult({ error: err.message });
      addToast({
        title: "Telemetry Failed",
        message: err.message,
        type: "error",
      });
    } finally {
      setIsPinging(false);
    }
  };

  const isConnected = healthStatus?.mongoStatus === "connected";

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="pb-4 border-b border-obsidian-border">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-gold" />
          <span className="text-[10px] font-mono text-gold uppercase tracking-widest font-semibold">
            Infrastructure
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-display font-medium text-ivory tracking-tight">
          System & Grounding
        </h1>
        <p className="text-xs sm:text-sm text-slate mt-1 font-sans">
          Review MongoDB Atlas connection integrity, Groq LPU engine telemetry, and token efficiency metrics.
        </p>
      </div>

      {/* User Profile Card */}
      <div className="p-6 rounded-2xl border border-obsidian-border bg-obsidian-surface shadow-card flex items-center gap-4">
        <BrandMark size={52} />
        <div>
          <h3 className="text-lg font-display font-medium text-ivory">
            LifePilot Executive Workspace
          </h3>
          <p className="text-xs text-slate font-mono mt-0.5">
            Role: Lead Systems Architect • Hackathon Environment
          </p>
          <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase bg-teal text-gold border border-gold/30">
            Model Context Protocol Active
          </span>
        </div>
      </div>

      {/* Live System Diagnostics */}
      <div className="p-6 rounded-2xl border border-obsidian-border bg-obsidian-surface shadow-card space-y-5">
        <div className="flex items-center justify-between pb-3.5 border-b border-obsidian-border">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-4 h-4 text-gold stroke-[1.75]" />
            <h3 className="text-sm font-semibold text-ivory tracking-wide">
              Live Architecture Diagnostics
            </h3>
          </div>
          <button
            onClick={handlePing}
            disabled={isPinging}
            className="px-3.5 py-1.5 rounded-xl border border-obsidian-border bg-obsidian-raised text-xs font-mono font-medium text-slate hover:text-ivory hover:border-gold/30 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? "animate-spin text-gold" : ""}`} />
            <span>Ping Telemetry</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-4 rounded-xl border border-obsidian-border bg-obsidian-raised/60">
            <span className="text-[10px] text-slate uppercase tracking-wider block mb-1">
              Database Persistence
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-sage shadow-[0_0_6px_rgba(167,182,162,0.8)]" : "bg-[#E08A8A]"
                }`}
              />
              <span className="text-sm font-semibold text-ivory">
                MongoDB Atlas ({healthStatus?.mongoStatus || "checking..."})
              </span>
            </div>
            <p className="text-[11px] text-slate mt-1 font-sans">
              Google DNS fallback • Mongoose Schemas Active
            </p>
          </div>

          <div className="p-4 rounded-xl border border-obsidian-border bg-obsidian-raised/60">
            <span className="text-[10px] text-slate uppercase tracking-wider block mb-1">
              Inference Hardware
            </span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sage shadow-[0_0_6px_rgba(167,182,162,0.8)]" />
              <span className="text-sm font-semibold text-ivory">
                Groq LPU Cloud
              </span>
            </div>
            <p className="text-[11px] text-slate mt-1 font-sans">
              Engine: {healthStatus?.model || "openai/gpt-oss-20b"}
            </p>
          </div>

          <div className="p-4 rounded-xl border border-obsidian-border bg-obsidian-raised/60">
            <span className="text-[10px] text-slate uppercase tracking-wider block mb-1">
              Protocol Transport
            </span>
            <span className="text-sm font-semibold text-ivory">
              Model Context Protocol (MCP)
            </span>
            <p className="text-[11px] text-slate mt-1 font-sans">
              Streamable HTTP • 12 Registered Tools
            </p>
          </div>

          <div className="p-4 rounded-xl border border-obsidian-border bg-obsidian-raised/60">
            <span className="text-[10px] text-slate uppercase tracking-wider block mb-1">
              Prompt Optimization
            </span>
            <span className="text-sm font-semibold text-sage">
              Active (-67.8% prompt reduction)
            </span>
            <p className="text-[11px] text-slate mt-1 font-sans">
              formatTaskCompact • In-turn Memoization
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
