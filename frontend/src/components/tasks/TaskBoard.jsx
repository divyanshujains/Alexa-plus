import React from "react";
import { TaskItem } from "./TaskItem.jsx";
import { useApp } from "../../context/AppContext.jsx";
import { CheckCircle2, Clock, Plus } from "lucide-react";

export function TaskBoard({ onOpenDetails, onEdit }) {
  const { tasks, openCreateTask } = useApp();

  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  const columns = [
    {
      id: "pending",
      title: "Active & In Progress",
      count: pendingTasks.length,
      icon: Clock,
      tasks: pendingTasks,
      color: "text-gold",
      accentBorder: "border-gold/30",
    },
    {
      id: "completed",
      title: "Completed",
      count: completedTasks.length,
      icon: CheckCircle2,
      tasks: completedTasks,
      color: "text-sage",
      accentBorder: "border-sage/30",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
      {columns.map((col) => {
        const Icon = col.icon;
        return (
          <div
            key={col.id}
            className="rounded-2xl border border-obsidian-border bg-obsidian-surface/50 p-4 min-h-[500px] flex flex-col shadow-card"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-obsidian-border">
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${col.color} stroke-[1.75]`} />
                <h3 className="text-sm font-semibold text-ivory tracking-tight">
                  {col.title}
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-obsidian-raised border border-obsidian-border text-slate">
                {col.count}
              </span>
            </div>

            {/* Task list in column */}
            <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar">
              {col.tasks.length > 0 ? (
                col.tasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onOpenDetails={onOpenDetails}
                    onEdit={onEdit}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-center text-xs text-slate font-mono">
                  <span>No {col.id} items</span>
                </div>
              )}
            </div>

            {col.id === "pending" && (
              <button
                onClick={openCreateTask}
                className="mt-3.5 w-full py-2.5 rounded-xl border border-dashed border-obsidian-border text-xs font-medium text-slate hover:text-ivory hover:border-gold/40 hover:bg-gold/5 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-3.5 h-3.5 text-gold" />
                <span>Add Task to Queue</span>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
