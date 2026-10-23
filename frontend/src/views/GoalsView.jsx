import React from "react";
import { Target, Plus } from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import { ProgressRing } from "../components/common/ProgressRing.jsx";
import { EmptyState } from "../components/common/EmptyState.jsx";
import { TaskItem } from "../components/tasks/TaskItem.jsx";

export function GoalsView() {
  const { goals, openCreateTask, setSelectedTask, openEditTask } = useApp();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-obsidian-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
            <span className="text-[10px] font-mono text-gold uppercase tracking-widest font-semibold">
              Objectives
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-medium text-ivory tracking-tight">
            Strategic Milestones
          </h1>
          <p className="text-xs sm:text-sm text-slate mt-1 font-sans">
            Cluster related deliverables, track execution velocity, and achieve long-term objectives.
          </p>
        </div>

        <button
          onClick={openCreateTask}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-teal text-ivory border border-gold/40 hover:border-gold hover:bg-teal-subtle hover:shadow-gold transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.2] text-gold" />
          <span>New Goal Task</span>
        </button>
      </div>

      {/* Goals Grid */}
      {goals.length > 0 ? (
        <div className="space-y-6">
          {goals.map((g, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl border border-obsidian-border bg-obsidian-surface shadow-card space-y-4"
            >
              {/* Goal Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-obsidian-border/70">
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 rounded-xl bg-teal/40 text-gold border border-gold/25">
                    <Target className="w-5 h-5 stroke-[1.75]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-display font-medium text-ivory">
                      {g.goal}
                    </h3>
                    <div className="flex items-center gap-3 text-xs font-mono text-slate mt-0.5">
                      <span>{g.completedTasks}/{g.totalTasks} tasks complete</span>
                      <span>•</span>
                      <span>{g.completedSubtasks}/{g.totalSubtasks} subtasks complete</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <ProgressRing
                    percentage={g.progressPercentage}
                    size={52}
                    strokeWidth={4}
                    color="#B69A62"
                  />
                </div>
              </div>

              {/* Tasks under this goal */}
              <div className="space-y-2.5">
                {g.tasks && g.tasks.length > 0 ? (
                  g.tasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onOpenDetails={setSelectedTask}
                      onEdit={openEditTask}
                    />
                  ))
                ) : (
                  <p className="text-xs text-slate font-mono">
                    No active tasks assigned under this milestone.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No strategic goals established"
          description="Assign a goal or category when creating tasks (e.g. 'Series A Preparation' or 'System Design') to track your milestones."
          actionLabel="Create Task with Milestone"
          onAction={openCreateTask}
        />
      )}
    </div>
  );
}
