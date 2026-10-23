import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  CalendarDays,
  Terminal,
  Activity,
  Layers,
} from "lucide-react";
import { BrandLogo, BrandMark } from "../components/common/BrandLogo.jsx";

// Register ScrollTrigger safely
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function LandingView() {
  const rootRef = useRef(null);
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const workflowRef = useRef(null);

  useEffect(() => {
    // Scoped GSAP context ensures clean unmount and prevents hot-reload leaks
    const ctx = gsap.context(() => {
      // Hero entrance
      gsap.from(".hero-element", {
        opacity: 0,
        y: 28,
        duration: 0.8,
        stagger: 0.12,
        ease: "power3.out",
      });

      // Feature cards scroll reveal
      gsap.from(".feature-card", {
        scrollTrigger: {
          trigger: featuresRef.current,
          start: "top 80%",
          toggleActions: "play none none none",
        },
        opacity: 0,
        y: 35,
        duration: 0.7,
        stagger: 0.18,
        ease: "power2.out",
      });

      // Workflow steps reveal
      gsap.from(".workflow-step", {
        scrollTrigger: {
          trigger: workflowRef.current,
          start: "top 75%",
          toggleActions: "play none none none",
        },
        opacity: 0,
        x: -25,
        duration: 0.6,
        stagger: 0.2,
        ease: "power2.out",
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={rootRef}
      className="min-h-screen bg-obsidian text-ivory selection:bg-gold/20 selection:text-ivory overflow-x-hidden"
    >
      {/* Top Navbar */}
      <nav className="sticky top-0 z-30 h-18 px-6 sm:px-12 flex items-center justify-between border-b border-obsidian-border bg-obsidian/90 backdrop-blur-md">
        <BrandLogo to="/" size={34} showTagline={true} />

        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-teal text-ivory border border-gold/40 hover:border-gold hover:bg-teal-subtle hover:shadow-gold transition-all flex items-center gap-2"
          >
            <span>Launch Workspace</span>
            <ArrowRight className="w-3.5 h-3.5 text-gold" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative pt-20 pb-28 px-6 sm:px-12 text-center max-w-5xl mx-auto"
      >
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-gold/30 bg-teal/30 text-gold text-xs font-mono font-medium mb-8 hero-element shadow-subtle">
          <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
          <span>Model Context Protocol & Zero-Hallucination Architecture</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-display font-medium text-ivory tracking-tight leading-[1.08] mb-6 hero-element">
          Personal Productivity, <br />
          <span className="italic text-gold font-normal">
            Grounded in Absolute Truth.
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate max-w-2xl mx-auto leading-relaxed mb-10 hero-element font-sans">
          LifePilot AI bridges high-performance Groq LPUs with your MongoDB Atlas database via Model Context Protocol (MCP). Structure daily focus, manage subtasks, and track milestones with zero clock hallucinations and measurable token efficiency.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 hero-element">
          <Link
            to="/"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-xs sm:text-sm font-semibold bg-teal text-ivory border border-gold/40 hover:border-gold hover:bg-teal-subtle hover:shadow-luxury transition-all flex items-center justify-center gap-2"
          >
            <span>Open Executive Workspace</span>
            <ArrowRight className="w-4 h-4 text-gold" />
          </Link>
          <Link
            to="/assistant"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-xs sm:text-sm font-semibold border border-obsidian-border bg-obsidian-surface text-ivory hover:border-gold/30 hover:bg-obsidian-raised transition-all flex items-center justify-center gap-2"
          >
            <Terminal className="w-4 h-4 text-gold" />
            <span>Consult Concierge</span>
          </Link>
        </div>
      </section>

      {/* Interactive Mock Preview with Warm Ivory & Obsidian Contrast */}
      <div className="max-w-5xl mx-auto px-6 sm:px-12 mb-28">
        <div className="p-3 sm:p-5 rounded-3xl border border-obsidian-border bg-obsidian-surface shadow-card">
          <div className="rounded-2xl border border-gold/15 bg-obsidian-deep p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-obsidian-border/70 text-xs font-mono text-slate">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sage shadow-[0_0_6px_rgba(167,182,162,0.8)]" />
                Active Executive Session • 12 MCP Tools Connected
              </span>
              <span>Model: openai/gpt-oss-20b</span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {/* User message in Warm Ivory */}
              <div className="p-3.5 rounded-xl bg-ivory text-obsidian border border-gold/30 shadow-subtle">
                <strong className="text-teal font-sans uppercase text-[11px] tracking-wider block mb-1">
                  Executive Directive:
                </strong>
                Plan my day. I have 3 hours of available focus time.
              </div>

              {/* Assistant message in Deep Obsidian */}
              <div className="p-4 rounded-xl bg-obsidian-surface border border-obsidian-border text-ivory">
                <strong className="text-gold font-sans uppercase text-[11px] tracking-wider block mb-1">
                  LifePilot Concierge:
                </strong>
                Grounded schedule generated (180 mins allocated):
                <ul className="mt-2.5 space-y-1.5 list-disc list-inside text-slate font-sans text-xs">
                  <li>Session 1: Submit Expense Report (30m stored, Overdue item prioritized first)</li>
                  <li>Session 2: Finalize Hackathon Demo (45m stored, High priority)</li>
                  <li>Session 3: System Design Practice (60m estimated)</li>
                </ul>
                <div className="mt-3 pt-2.5 border-t border-obsidian-border/50 text-[10px] text-sage flex items-center gap-3">
                  <span>✓ 0 clock times invented</span>
                  <span>•</span>
                  <span>Total focus: 135m</span>
                  <span>•</span>
                  <span>45m buffer reserved</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Core Features Section (Scroll Triggered) */}
      <section
        ref={featuresRef}
        className="py-24 px-6 sm:px-12 max-w-6xl mx-auto border-t border-obsidian-border"
      >
        <div className="text-center max-w-xl mx-auto mb-16">
          <span className="text-[10px] font-mono font-bold uppercase text-gold tracking-widest">
            Engineered for Precision
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-medium text-ivory mt-2">
            Quiet Luxury Meets Intelligent Productivity
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="feature-card p-6 rounded-2xl border border-obsidian-border bg-obsidian-surface shadow-card space-y-3.5 hover:border-gold/30 transition-colors">
            <div className="p-3 rounded-xl bg-teal/40 text-gold border border-gold/25 w-fit">
              <ShieldCheck className="w-5 h-5 stroke-[1.75]" />
            </div>
            <h3 className="text-base font-display font-medium text-ivory">
              Zero-Hallucination Grounding
            </h3>
            <p className="text-xs text-slate leading-relaxed font-sans">
              Every task status, deadline, and priority originates directly from MongoDB Atlas through verified MCP tool calls. No invented IDs, dates, or simulated changes.
            </p>
          </div>

          <div className="feature-card p-6 rounded-2xl border border-obsidian-border bg-obsidian-surface shadow-card space-y-3.5 hover:border-gold/30 transition-colors">
            <div className="p-3 rounded-xl bg-teal/40 text-gold border border-gold/25 w-fit">
              <Zap className="w-5 h-5 stroke-[1.75]" />
            </div>
            <h3 className="text-base font-display font-medium text-ivory">
              67% Token Optimization
            </h3>
            <p className="text-xs text-slate leading-relaxed font-sans">
              Deduplicated system prompt from 2,447 to 788 tokens, lean JSON projections, and in-turn memoization eliminate redundant roundtrips and accelerate inference.
            </p>
          </div>

          <div className="feature-card p-6 rounded-2xl border border-obsidian-border bg-obsidian-surface shadow-card space-y-3.5 hover:border-gold/30 transition-colors">
            <div className="p-3 rounded-xl bg-teal/40 text-gold border border-gold/25 w-fit">
              <CalendarDays className="w-5 h-5 stroke-[1.75]" />
            </div>
            <h3 className="text-base font-display font-medium text-ivory">
              Deterministic Daily Planner
            </h3>
            <p className="text-xs text-slate leading-relaxed font-sans">
              Enforces sequential focus sessions instead of hallucinating fictional calendar hours. Automatically elevates overdue items and respects hard limits.
            </p>
          </div>
        </div>
      </section>

      {/* Workflow Section (Scroll Triggered) */}
      <section
        ref={workflowRef}
        className="py-24 px-6 sm:px-12 max-w-4xl mx-auto border-t border-obsidian-border"
      >
        <div className="text-center mb-14">
          <span className="text-[10px] font-mono font-bold uppercase text-gold tracking-widest">
            Architecture in Action
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-medium text-ivory mt-2">
            End-to-End Orchestration Flow
          </h2>
        </div>

        <div className="space-y-4">
          <div className="workflow-step p-5 rounded-2xl border border-obsidian-border bg-obsidian-surface flex items-start gap-4">
            <div className="w-8 h-8 rounded-xl bg-teal/40 border border-gold/30 flex items-center justify-center font-mono font-bold text-xs text-gold flex-shrink-0">
              1
            </div>
            <div>
              <h4 className="text-sm font-semibold text-ivory">
                Natural Language Directive
              </h4>
              <p className="text-xs text-slate mt-1 font-sans leading-relaxed">
                You direct LifePilot to organize your schedule, synthesize preparation steps, or track a strategic milestone in natural language.
              </p>
            </div>
          </div>

          <div className="workflow-step p-5 rounded-2xl border border-obsidian-border bg-obsidian-surface flex items-start gap-4">
            <div className="w-8 h-8 rounded-xl bg-teal/40 border border-gold/30 flex items-center justify-center font-mono font-bold text-xs text-gold flex-shrink-0">
              2
            </div>
            <div>
              <h4 className="text-sm font-semibold text-ivory">
                MCP Tool Dispatch
              </h4>
              <p className="text-xs text-slate mt-1 font-sans leading-relaxed">
                The agent invokes verified tools (<code className="font-mono text-gold">create_task</code>, <code className="font-mono text-gold">plan_my_day</code>, <code className="font-mono text-gold">get_overdue_tasks</code>) with schema validation.
              </p>
            </div>
          </div>

          <div className="workflow-step p-5 rounded-2xl border border-obsidian-border bg-obsidian-surface flex items-start gap-4">
            <div className="w-8 h-8 rounded-xl bg-teal/40 border border-gold/30 flex items-center justify-center font-mono font-bold text-xs text-gold flex-shrink-0">
              3
            </div>
            <div>
              <h4 className="text-sm font-semibold text-ivory">
                MongoDB Persistence & Token Telemetry
              </h4>
              <p className="text-xs text-slate mt-1 font-sans leading-relaxed">
                State updates are committed to MongoDB Atlas and verified, returning lean payloads with real-time token telemetry.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="py-24 px-6 sm:px-12 text-center border-t border-obsidian-border bg-teal/15">
        <h2 className="text-3xl sm:text-4xl font-display font-medium text-ivory mb-4">
          Ready to experience grounded productivity?
        </h2>
        <p className="text-xs sm:text-sm text-slate max-w-md mx-auto mb-8 font-sans">
          Launch your LifePilot workspace now and take control of your tasks, goals, and daily focus with quiet confidence.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-xs sm:text-sm font-semibold bg-teal text-ivory border border-gold/40 hover:border-gold hover:bg-teal-subtle hover:shadow-luxury transition-all"
        >
          <span>Open LifePilot Workspace</span>
          <ArrowRight className="w-4 h-4 text-gold" />
        </Link>
      </section>

      {/* Clean Footer */}
      <footer className="py-8 px-6 sm:px-12 border-t border-obsidian-border flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-slate gap-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <BrandMark size={20} />
          <span>© 2026 LifePilot AI • Quiet Luxury Productivity</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span>Groq LPU Engine</span>
          <span>•</span>
          <span>MongoDB Atlas</span>
          <span>•</span>
          <span>Model Context Protocol</span>
        </div>
      </footer>
    </div>
  );
}
