import React, { useState } from "react";
import { Plus, List, LayoutGrid } from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import { TaskList } from "../components/tasks/TaskList.jsx";
import { TaskBoard } from "../components/tasks/TaskBoard.jsx";
import { TaskListSkeleton } from "../components/common/LoadingSkeleton.jsx";
import { cn } from "../utils/cn.js";

export function TasksView() {
  const { tasks, isLoading, openCreateTask, setSelectedTask, openEditTask } = useApp();
  const [viewMode, setViewMode] = useState("list"); // "list" | "board"

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Title & View Toggles */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-obsidian-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
            <span className="text-[10px] font-mono text-gold uppercase tracking-widest font-semibold">
              Registry
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-medium text-ivory tracking-tight">
            Task Orchestration
          </h1>
          <p className="text-xs sm:text-sm text-slate mt-1 font-sans">
            Review, prioritize, and track MongoDB Atlas tasks with verified subtask hierarchy.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* List / Board Toggle */}
          <div className="p-1 rounded-xl bg-obsidian-surface border border-obsidian-border flex items-center gap-1 shadow-subtle">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5",
                viewMode === "list"
                  ? "bg-teal text-ivory border border-gold/30 shadow-subtle font-semibold"
                  : "text-slate hover:text-ivory"
              )}
              title="List view"
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode("board")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5",
                viewMode === "board"
                  ? "bg-teal text-ivory border border-gold/30 shadow-subtle font-semibold"
                  : "text-slate hover:text-ivory"
              )}
              title="Board view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>
          </div>

          {/* Add Task Button */}
          <button
            onClick={openCreateTask}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-teal text-ivory border border-gold/40 hover:border-gold hover:bg-teal-subtle hover:shadow-gold transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.2] text-gold" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Main View Area */}
      {isLoading ? (
        <TaskListSkeleton />
      ) : viewMode === "list" ? (
        <TaskList onOpenDetails={setSelectedTask} onEdit={openEditTask} />
      ) : (
        <TaskBoard onOpenDetails={setSelectedTask} onEdit={openEditTask} />
      )}
    </div>
  );
}
