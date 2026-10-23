import React, { useState } from "react";
import { TaskItem } from "./TaskItem.jsx";
import { EmptyState } from "../common/EmptyState.jsx";
import { ConfirmDialog } from "../common/ConfirmDialog.jsx";
import { useApp } from "../../context/AppContext.jsx";
import { Search } from "lucide-react";

export function TaskList({ tasks: propTasks, onOpenDetails, onEdit }) {
  const {
    tasks: contextTasks,
    deleteTask,
    openCreateTask,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
  } = useApp();

  const [taskToDelete, setTaskToDelete] = useState(null);

  const taskList = propTasks || contextTasks;

  // Apply filters
  const filteredTasks = taskList.filter((task) => {
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchGoal = task.goal?.toLowerCase().includes(q);
      const matchSub = (task.subtasks || []).some((st) => st.title.toLowerCase().includes(q));
      if (!matchTitle && !matchGoal && !matchSub) return false;
    }

    // Status
    if (statusFilter !== "all" && task.status !== statusFilter) {
      return false;
    }

    // Priority
    if (priorityFilter !== "all" && task.priority !== priorityFilter) {
      return false;
    }

    return true;
  });

  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return;
    try {
      await deleteTask(taskToDelete.id);
    } finally {
      setTaskToDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      {!propTasks && (
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[1.75]" />
            <input
              type="text"
              placeholder="Filter tasks, goals, subtasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-obsidian-surface border border-obsidian-border text-xs sm:text-sm text-ivory placeholder:text-slate focus:outline-none focus:border-gold/50 transition-colors font-sans"
            />
          </div>

          <div className="flex items-center gap-2.5">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-obsidian-surface border border-obsidian-border text-xs sm:text-sm text-slate hover:text-ivory focus:outline-none focus:border-gold/50 transition-colors font-mono cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-obsidian-surface border border-obsidian-border text-xs sm:text-sm text-slate hover:text-ivory focus:outline-none focus:border-gold/50 transition-colors font-mono cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      )}

      {/* Task Count Summary */}
      <div className="flex items-center justify-between text-xs font-mono text-slate px-1">
        <span>
          Showing {filteredTasks.length} {filteredTasks.length === 1 ? "task" : "tasks"}
        </span>
      </div>

      {/* Task Rows */}
      {filteredTasks.length > 0 ? (
        <div className="space-y-2.5">
          {filteredTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onOpenDetails={onOpenDetails}
              onEdit={onEdit}
              onDelete={(t) => setTaskToDelete(t)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title={
            searchQuery || statusFilter !== "all" || priorityFilter !== "all"
              ? "No matching tasks"
              : "Executive workspace clear"
          }
          description={
            searchQuery || statusFilter !== "all" || priorityFilter !== "all"
              ? "Try adjusting your search query or filters to discover active tasks."
              : "No pending tasks scheduled right now. Add a task or command LifePilot to draft your day."
          }
          actionLabel="Add New Task"
          onAction={openCreateTask}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!taskToDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${taskToDelete?.title}"? This will permanently remove the record and nested subtasks from MongoDB.`}
        confirmLabel="Delete Task"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setTaskToDelete(null)}
      />
    </div>
  );
}
