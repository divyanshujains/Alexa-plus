import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Clock,
  Calendar,
  ChevronDown,
  ChevronRight,
  Trash2,
  Edit2,
  Target,
} from "lucide-react";
import { PriorityBadge } from "../common/PriorityBadge.jsx";
import { useApp } from "../../context/AppContext.jsx";
import { cn } from "../../utils/cn.js";

export function TaskItem({ task, onOpenDetails, onEdit, onDelete }) {
  const { completeTask, completeSubtask } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const isCompleted = task.status === "completed";
  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter((s) => s.status === "completed").length;

  const handleToggleComplete = async (e) => {
    e.stopPropagation();
    if (isCompleted) return;
    setIsCompleting(true);
    try {
      await completeTask(task.id);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleSubtaskComplete = async (e, subtaskTitle) => {
    e.stopPropagation();
    await completeSubtask(task.id, subtaskTitle);
  };

  const formatDate = (isoString) => {
    if (!isoString) return null;
    const d = new Date(isoString);
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(d);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      onClick={() => onOpenDetails && onOpenDetails(task)}
      className={cn(
        "p-4 rounded-xl border transition-all duration-200 cursor-pointer group bg-obsidian-surface hover:bg-obsidian-raised",
        isCompleted
          ? "border-obsidian-border/40 opacity-60"
          : "border-obsidian-border hover:border-gold/30 shadow-subtle"
      )}
    >
      <div className="flex items-start gap-3.5">
        {/* Animated Checkbox */}
        <button
          type="button"
          onClick={handleToggleComplete}
          disabled={isCompleted || isCompleting}
          aria-label={isCompleted ? "Task completed" : "Complete task"}
          className={cn(
            "mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-all flex-shrink-0",
            isCompleted
              ? "bg-sage border-sage text-obsidian"
              : "border-obsidian-border hover:border-sage hover:bg-sage/10 text-transparent"
          )}
        >
          <Check className={cn("w-3.5 h-3.5 stroke-[3]", isCompleted ? "opacity-100" : "opacity-0")} />
        </button>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h4
              className={cn(
                "text-sm font-medium text-ivory leading-tight truncate",
                isCompleted && "line-through text-slate/70"
              )}
            >
              {task.title}
            </h4>

            {task.goal && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-gold bg-teal/30 px-2 py-0.5 rounded border border-gold/20">
                <Target className="w-2.5 h-2.5 text-gold" />
                {task.goal}
              </span>
            )}
          </div>

          {/* Badges / Meta row */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate font-mono">
            <PriorityBadge priority={task.priority} />

            {task.durationMinutes && (
              <span className="flex items-center gap-1 text-slate">
                <Clock className="w-3 h-3 text-slate/80" />
                {task.durationMinutes}m
              </span>
            )}

            {task.deadline && (
              <span className="flex items-center gap-1 text-ivory/90">
                <Calendar className="w-3 h-3 text-gold" />
                Due {formatDate(task.deadline)}
              </span>
            )}

            {subtasks.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] hover:bg-obsidian-hover text-slate hover:text-ivory transition-colors"
              >
                {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                <span>
                  {completedSubtasks}/{subtasks.length} subtasks
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task);
              }}
              className="p-1.5 rounded-lg text-slate hover:text-gold hover:bg-obsidian-hover transition-colors"
              title="Edit task"
            >
              <Edit2 className="w-3.5 h-3.5 stroke-[1.75]" />
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task);
              }}
              className="p-1.5 rounded-lg text-slate hover:text-[#E08A8A] hover:bg-[#9E5A5A]/15 transition-colors"
              title="Delete task"
            >
              <Trash2 className="w-3.5 h-3.5 stroke-[1.75]" />
            </button>
          )}
        </div>
      </div>

      {/* Expandable Subtasks */}
      <AnimatePresence>
        {isExpanded && subtasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3.5 pt-3 border-t border-obsidian-border/50 pl-8 space-y-2 overflow-hidden"
          >
            {subtasks.map((st, idx) => {
              const stCompleted = st.status === "completed";
              return (
                <div
                  key={idx}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-between text-xs group/sub"
                >
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      disabled={stCompleted}
                      onClick={(e) => handleSubtaskComplete(e, st.title)}
                      className={cn(
                        "w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors",
                        stCompleted
                          ? "bg-sage border-sage text-obsidian"
                          : "border-obsidian-border hover:border-sage hover:bg-sage/10"
                      )}
                    >
                      {stCompleted && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </button>
                    <span className={cn(stCompleted ? "line-through text-slate/50" : "text-slate")}>
                      {st.title}
                    </span>
                  </div>

                  {st.durationMinutes && (
                    <span className="text-[10px] font-mono text-slate/70">
                      {st.durationMinutes}m
                    </span>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
