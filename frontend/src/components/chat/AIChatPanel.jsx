import React, { useState, useRef, useEffect } from "react";
import { Send, RefreshCw, Trash2, ArrowUp, Compass } from "lucide-react";
import { ChatMessage } from "./ChatMessage.jsx";
import { BrandMark } from "../common/BrandLogo.jsx";
import { api } from "../../services/api.js";
import { useApp } from "../../context/AppContext.jsx";

const SUGGESTIONS = [
  "Plan my day with 3 hours focus budget",
  "Show overdue tasks and priority bottlenecks",
  "Schedule task 'Finalize Executive Strategy Deck' for 45m",
  "Prepare a 3-day deep work roadmap for Q4 Goals",
  "What tasks are committed for today?",
];

export function AIChatPanel({ initialQuery = "" }) {
  const { refreshAll } = useApp();
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Good day. I am LifePilot AI, your executive productivity concierge. Grounded by Model Context Protocol (MCP) directly into MongoDB Atlas, I structure your focus, calculate realistic schedules, and coordinate milestone execution without hallucinations or simulated claims. How may I orchestrate your priorities today?",
      timestamp: new Date().toISOString(),
      metrics: {
        model: "openai/gpt-oss-20b",
        totalTokens: 788,
        promptTokens: 788,
        completionTokens: 0,
        durationMs: 38,
        toolCallsCount: 0,
      },
    },
  ]);

  const [inputMessage, setInputMessage] = useState(initialQuery);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (initialQuery) {
      handleSendMessage(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isSending) return;

    const userMsg = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsSending(true);

    try {
      const conversationHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await api.chat.send(text, conversationHistory);

      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: res.response || "Directive processed.",
        timestamp: res.timestamp || new Date().toISOString(),
        metrics: res.metrics,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      refreshAll(true);
    } catch (err) {
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Connection Notice: ${
          err.message ||
          "Could not reach LifePilot agent. Please ensure the backend server is active."
        }`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearHistory = () => {
    setMessages([messages[0]]);
  };

  return (
    <div className="flex flex-col h-full rounded-2xl border border-obsidian-border bg-obsidian-surface shadow-card overflow-hidden">
      {/* Panel Header */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-obsidian-border bg-obsidian-deep/50">
        <div className="flex items-center gap-3">
          <BrandMark size={32} />
          <div>
            <h3 className="text-sm font-display font-medium text-ivory tracking-wide">
              LifePilot Executive Concierge
            </h3>
            <span className="text-[10px] font-mono text-slate">
              Grounded via Model Context Protocol • Zero Hallucination
            </span>
          </div>
        </div>

        <button
          onClick={handleClearHistory}
          className="px-3 py-1.5 rounded-lg border border-obsidian-border bg-obsidian-raised text-slate hover:text-ivory hover:border-gold/30 transition-all text-xs flex items-center gap-1.5 font-mono"
          title="Clear session messages"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Clear Dialogue</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 no-scrollbar">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {isSending && (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-gold/20 bg-teal/20 text-gold animate-pulse">
            <RefreshCw className="w-4 h-4 text-gold animate-spin stroke-[1.75]" />
            <span className="text-xs font-mono tracking-wider">
              Executing MCP tools & verifying MongoDB Atlas state...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Chips */}
      <div className="px-4 py-2.5 border-t border-obsidian-border/60 bg-obsidian-deep/40 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[10px] font-mono text-slate/70 flex-shrink-0 uppercase tracking-wider">
          Suggested Directives:
        </span>
        {SUGGESTIONS.map((suggestion, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(suggestion)}
            disabled={isSending}
            className="px-3 py-1 rounded-full border border-obsidian-border bg-obsidian-surface hover:border-gold/40 hover:text-ivory text-xs font-mono text-slate whitespace-nowrap transition-colors flex-shrink-0"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* Input Composer */}
      <div className="p-4 border-t border-obsidian-border bg-obsidian-deep/60">
        <div className="relative flex items-end gap-2 bg-obsidian-surface rounded-2xl border border-obsidian-border p-2 focus-within:border-gold/50 transition-colors shadow-subtle">
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Instruct the concierge or query task telemetry... (Enter to send, Shift+Enter for newline)"
            className="flex-1 bg-transparent border-0 text-xs sm:text-sm text-ivory placeholder:text-slate/60 resize-none focus:outline-none focus:ring-0 max-h-32 py-1.5 px-2 font-sans"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isSending}
            className="p-2.5 rounded-xl bg-teal text-ivory border border-gold/40 hover:border-gold hover:bg-teal-subtle hover:shadow-gold disabled:opacity-40 disabled:hover:bg-teal transition-all flex-shrink-0"
            aria-label="Send directive"
          >
            <Send className="w-4 h-4 text-gold stroke-[2]" />
          </button>
        </div>
      </div>
    </div>
  );
}
