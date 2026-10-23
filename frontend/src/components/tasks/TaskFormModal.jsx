import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, Calendar, Clock, Target } from "lucide-react";
import { useApp } from "../../context/AppContext.jsx";

export function TaskFormModal() {
  const { isTaskFormOpen, editingTask, closeTaskForm, createTask, updateTask } = useApp();

  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState("");
  const [priority, setPriority] = useState("medium");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [subtasks, setSubtasks] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title || "");
      setGoal(editingTask.goal || "");
      setPriority(editingTask.priority || "medium");
      setDurationMinutes(editingTask.durationMinutes ? String(editingTask.durationMinutes) : "");
      setScheduledDate(
        editingTask.scheduledDate ? editingTask.scheduledDate.substring(0, 16) : ""
      );
      setDeadline(
        editingTask.deadline ? editingTask.deadline.substring(0, 16) : ""
      );
      setSubtasks(
        editingTask.subtasks ? editingTask.subtasks.map((st) => ({ ...st })) : []
      );
    } else {
      setTitle("");
      setGoal("");
      setPriority("medium");
      setDurationMinutes("");
      setScheduledDate("");
      setDeadline("");
      setSubtasks([]);
    }
    setValidationError("");
  }, [editingTask, isTaskFormOpen]);

  if (!isTaskFormOpen) return null;

  const handleAddSubtask = () => {
    setSubtasks((prev) => [...prev, { title: "", durationMinutes: 15, status: "pending" }]);
  };

  const handleSubtaskChange = (index, field, value) => {
    setSubtasks((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveSubtask = (index) => {
    setSubtasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setValidationError("Task title is required.");
      return;
    }

    setIsSubmitting(true);
    setValidationError("");

    try {
      const payload = {
        title: title.trim(),
        goal: goal.trim() || undefined,
        priority,
        durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : undefined,
        scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : undefined,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
        subtasks: subtasks
          .filter((st) => st.title.trim())
          .map((st) => ({
            title: st.title.trim(),
            durationMinutes: st.durationMinutes ? parseInt(st.durationMinutes, 10) : undefined,
            status: st.status || "pending",
          })),
      };

      if (editingTask) {
        await updateTask(editingTask.id, payload);
      } else {
        await createTask(payload);
      }

      closeTaskForm();
    } catch (err) {
      setValidationError(err.message || "Failed to save task.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.15 }}
          className="w-full max-w-lg my-8 rounded-2xl border border-gold/20 bg-obsidian-raised shadow-luxury p-6 relative max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-obsidian-border">
            <h3 className="text-xl font-display font-medium text-ivory">
              {editingTask ? "Edit Task Details" : "Create New Task"}
            </h3>
            <button
              onClick={closeTaskForm}
              className="p-1.5 rounded-lg text-slate hover:text-ivory hover:bg-obsidian-surface transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 no-scrollbar">
            {validationError && (
              <div className="p-3 rounded-xl bg-[#9E5A5A]/15 border border-[#9E5A5A]/30 text-[#E08A8A] text-xs font-mono">
                {validationError}
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-[11px] font-semibold uppercase font-mono text-slate mb-1.5">
                Task Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Refine executive investment memo"
                className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian-surface border border-obsidian-border text-sm text-ivory placeholder:text-slate/60 focus:outline-none focus:border-gold/50 transition-colors font-sans"
                autoFocus
              />
            </div>

            {/* Goal & Priority row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-semibold uppercase font-mono text-slate mb-1.5">
                  Goal / Milestone
                </label>
                <div className="relative">
                  <Target className="w-4 h-4 text-gold absolute left-3 top-1/2 -translate-y-1/2 stroke-[1.75]" />
                  <input
                    type="text"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="e.g. Q4 Deliverables"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-obsidian-surface border border-obsidian-border text-sm text-ivory placeholder:text-slate/60 focus:outline-none focus:border-gold/50 transition-colors font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase font-mono text-slate mb-1.5">
                  Priority Urgency
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian-surface border border-obsidian-border text-sm text-ivory focus:outline-none focus:border-gold/50 transition-colors font-mono cursor-pointer"
                >
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>
            </div>

            {/* Duration, Scheduled Date, Deadline */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-[11px] font-semibold uppercase font-mono text-slate mb-1.5">
                  Duration (min)
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate absolute left-3 top-1/2 -translate-y-1/2 stroke-[1.75]" />
                  <input
                    type="number"
                    min="1"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    placeholder="e.g. 45"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-obsidian-surface border border-obsidian-border text-sm text-ivory placeholder:text-slate/60 focus:outline-none focus:border-gold/50 transition-colors font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase font-mono text-slate mb-1.5">
                  Scheduled Date
                </label>
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-obsidian-surface border border-obsidian-border text-xs text-ivory focus:outline-none focus:border-gold/50 transition-colors font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase font-mono text-slate mb-1.5">
                  Target Deadline
                </label>
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-obsidian-surface border border-obsidian-border text-xs text-ivory focus:outline-none focus:border-gold/50 transition-colors font-mono"
                />
              </div>
            </div>

            {/* Subtasks Section */}
            <div className="pt-2 border-t border-obsidian-border/60">
              <div className="flex items-center justify-between mb-2.5">
                <label className="block text-[11px] font-semibold uppercase font-mono text-slate">
                  Nested Subtasks ({subtasks.length})
                </label>
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-gold hover:text-ivory transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Subtask</span>
                </button>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto pr-1 no-scrollbar">
                {subtasks.map((st, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`Subtask #${i + 1}`}
                      value={st.title}
                      onChange={(e) => handleSubtaskChange(i, "title", e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-obsidian-surface border border-obsidian-border text-xs text-ivory placeholder:text-slate/60 focus:outline-none focus:border-gold/50 font-sans"
                    />
                    <input
                      type="number"
                      placeholder="Mins"
                      value={st.durationMinutes || ""}
                      onChange={(e) => handleSubtaskChange(i, "durationMinutes", e.target.value)}
                      className="w-16 px-2 py-1.5 rounded-lg bg-obsidian-surface border border-obsidian-border text-xs text-ivory font-mono focus:outline-none focus:border-gold/50"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(i)}
                      className="p-1.5 rounded text-slate hover:text-[#E08A8A] hover:bg-[#9E5A5A]/15 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-obsidian-border flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeTaskForm}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate hover:text-ivory hover:bg-obsidian-surface transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-teal text-ivory border border-gold/40 hover:border-gold hover:bg-teal-subtle disabled:opacity-50 transition-all shadow-subtle flex items-center gap-2"
              >
                {isSubmitting ? "Persisting..." : editingTask ? "Save Changes" : "Commit Task"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
