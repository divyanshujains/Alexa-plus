import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Check,
  Calendar,
  Clock,
  Target,
  Trash2,
  Edit2,
  CheckCircle2,
} from "lucide-react";
import { PriorityBadge } from "../common/PriorityBadge.jsx";
import { useApp } from "../../context/AppContext.jsx";
import { cn } from "../../utils/cn.js";

export function TaskDetailsDrawer() {
  const {
    selectedTask,
    setSelectedTask,
    completeTask,
    completeSubtask,
    openEditTask,
    deleteTask,
  } = useApp();

  if (!selectedTask) return null;

  const isCompleted = selectedTask.status === "completed";
  const subtasks = selectedTask.subtasks || [];
  const completedSubtasks = subtasks.filter((s) => s.status === "completed").length;
  const progressPercent =
    subtasks.length === 0
      ? isCompleted
        ? 100
        : 0
      : Math.round((completedSubtasks / subtasks.length) * 100);

  const formatDate = (isoString) => {
    if (!isoString) return "None";
    const d = new Date(isoString);
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedTask(null)}
          className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        />

        {/* Drawer Panel */}
        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="w-screen max-w-md bg-obsidian-raised border-l border-obsidian-border shadow-luxury flex flex-col p-6 overflow-y-auto no-scrollbar"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-obsidian-border">
              <span className="text-[11px] font-mono font-semibold text-slate uppercase tracking-widest">
                Task Specification
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    openEditTask(selectedTask);
                    setSelectedTask(null);
                  }}
                  className="p-2 rounded-lg text-slate hover:text-gold hover:bg-obsidian-surface transition-colors"
                  title="Edit task"
                >
                  <Edit2 className="w-4 h-4 stroke-[1.75]" />
                </button>
                <button
                  onClick={() => {
                    deleteTask(selectedTask.id);
                  }}
                  className="p-2 rounded-lg text-slate hover:text-[#E08A8A] hover:bg-[#9E5A5A]/15 transition-colors"
                  title="Delete task"
                >
                  <Trash2 className="w-4 h-4 stroke-[1.75]" />
                </button>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="p-2 rounded-lg text-slate hover:text-ivory hover:bg-obsidian-surface transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 py-6 space-y-6">
              {/* Title & Status */}
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <PriorityBadge priority={selectedTask.priority} />
                  <span
                    className={cn(
                      "text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border tracking-wider",
                      isCompleted
                        ? "bg-sage/15 text-sage border-sage/30"
                        : "bg-gold/15 text-gold border-gold/30"
                    )}
                  >
                    {selectedTask.status}
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-display font-medium text-ivory leading-snug">
                  {selectedTask.title}
                </h3>
              </div>

              {/* Goal Card */}
              {selectedTask.goal && (
                <div className="p-3.5 rounded-xl border border-gold/20 bg-teal/20 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-teal text-gold border border-gold/30">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate uppercase tracking-wider block">
                      Associated Goal
                    </span>
                    <span className="text-sm font-semibold text-ivory">
                      {selectedTask.goal}
                    </span>
                  </div>
                </div>
              )}

              {/* Progress Bar */}
              <div className="p-4 rounded-xl border border-obsidian-border bg-obsidian-surface">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-slate uppercase">
                    Execution Progress
                  </span>
                  <span className="text-xs font-mono font-bold text-gold">
                    {progressPercent}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-obsidian-deep rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gold rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Metadata Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3.5 rounded-xl border border-obsidian-border bg-obsidian-surface">
                  <span className="text-slate block mb-1 uppercase text-[10px]">
                    Estimated Work
                  </span>
                  <div className="flex items-center gap-1.5 text-ivory font-semibold">
                    <Clock className="w-3.5 h-3.5 text-gold" />
                    <span>{selectedTask.durationMinutes || 30} mins</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-obsidian-border bg-obsidian-surface">
                  <span className="text-slate block mb-1 uppercase text-[10px]">
                    Scheduled Date
                  </span>
                  <div className="flex items-center gap-1.5 text-ivory font-semibold truncate">
                    <Calendar className="w-3.5 h-3.5 text-sage" />
                    <span>{formatDate(selectedTask.scheduledDate)}</span>
                  </div>
                </div>

                <div className="col-span-2 p-3.5 rounded-xl border border-obsidian-border bg-obsidian-surface">
                  <span className="text-slate block mb-1 uppercase text-[10px]">
                    Target Deadline
                  </span>
                  <div className="flex items-center gap-1.5 text-ivory font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-gold" />
                    <span>{formatDate(selectedTask.deadline)}</span>
                  </div>
                </div>
              </div>

              {/* Nested Subtasks */}
              {subtasks.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-mono text-slate uppercase tracking-wider">
                    Nested Subtasks ({completedSubtasks}/{subtasks.length})
                  </h4>
                  <div className="space-y-2">
                    {subtasks.map((st, i) => {
                      const stDone = st.status === "completed";
                      return (
                        <div
                          key={i}
                          className="p-3 rounded-xl border border-obsidian-border bg-obsidian-surface flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              disabled={stDone}
                              onClick={() => completeSubtask(selectedTask.id, st.title)}
                              className={cn(
                                "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                                stDone
                                  ? "bg-sage border-sage text-obsidian"
                                  : "border-obsidian-border hover:border-sage hover:bg-sage/10"
                              )}
                            >
                              {stDone && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </button>
                            <span
                              className={cn(
                                stDone ? "line-through text-slate/50" : "text-ivory"
                              )}
                            >
                              {st.title}
                            </span>
                          </div>
                          {st.durationMinutes && (
                            <span className="font-mono text-slate text-[11px]">
                              {st.durationMinutes}m
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Action */}
            <div className="pt-4 border-t border-obsidian-border flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => completeTask(selectedTask.id)}
                disabled={isCompleted}
                className={cn(
                  "w-full py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-subtle",
                  isCompleted
                    ? "bg-obsidian-surface border border-obsidian-border text-slate cursor-default"
                    : "bg-teal text-ivory border border-gold/40 hover:border-gold hover:bg-teal-subtle hover:shadow-gold"
                )}
              >
                <CheckCircle2 className="w-4 h-4 text-gold" />
                <span>{isCompleted ? "Task Completed" : "Mark Task Completed"}</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
