import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Compass } from "lucide-react";
import { BrandMark } from "./BrandLogo.jsx";

export function CommandInput({
  placeholder = "Instruct LifePilot to plan your day, schedule high-priority focus, or structure a milestone...",
  onCommandSubmit,
}) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    if (onCommandSubmit) {
      onCommandSubmit(query.trim());
    } else {
      navigate(`/assistant?q=${encodeURIComponent(query.trim())}`);
    }
    setQuery("");
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full group">
      <div className="relative flex items-center bg-obsidian-surface border border-gold/20 rounded-2xl px-4 py-3 shadow-card group-focus-within:border-gold/60 group-focus-within:shadow-gold transition-all duration-300">
        <div className="mr-3 flex-shrink-0">
          <BrandMark size={28} />
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent border-0 text-xs sm:text-sm text-ivory placeholder:text-slate/70 focus:outline-none focus:ring-0 font-sans tracking-wide"
        />

        <div className="flex items-center gap-2 ml-2 flex-shrink-0">
          <span className="hidden sm:inline text-[10px] font-mono text-slate/60 uppercase tracking-widest mr-1">
            Concierge Command
          </span>
          <button
            type="submit"
            disabled={!query.trim()}
            className="flex items-center justify-center p-2 rounded-xl bg-teal text-ivory border border-gold/30 hover:border-gold hover:bg-teal-subtle disabled:opacity-30 disabled:border-transparent transition-all shadow-subtle"
            aria-label="Send prompt"
          >
            <ArrowRight className="w-4 h-4 text-gold" />
          </button>
        </div>
      </div>
    </form>
  );
}
