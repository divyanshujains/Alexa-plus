import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "../services/api.js";
import { useToast } from "./ToastContext.jsx";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { addToast } = useToast();

  const [tasks, setTasks] = useState([]);
  const [goals, setGoals] = useState([]);
  const [todayTasks, setTodayTasks] = useState([]);
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [todayPlan, setTodayPlan] = useState(null);
  const [healthStatus, setHealthStatus] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Selected task for Drawer
  const [selectedTask, setSelectedTask] = useState(null);

  // Modal form state
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const refreshAll = useCallback(async (quiet = false) => {
    if (!quiet) setIsRefreshing(true);
    try {
      const [tasksRes, todayRes, overdueRes, goalsRes, healthRes] = await Promise.allSettled([
        api.tasks.list(),
        api.tasks.getToday(),
        api.tasks.getOverdue(),
        api.goals.getSummary(),
        api.health.check(),
      ]);

      if (tasksRes.status === "fulfilled") {
        setTasks(tasksRes.value.tasks || []);
      }
      if (todayRes.status === "fulfilled") {
        setTodayTasks(todayRes.value.tasks || []);
      }
      if (overdueRes.status === "fulfilled") {
        setOverdueTasks(overdueRes.value.tasks || []);
      }
      if (goalsRes.status === "fulfilled") {
        setGoals(goalsRes.value.goals || []);
      }
      if (healthRes.status === "fulfilled") {
        setHealthStatus(healthRes.value);
      }

      setError(null);
    } catch (err) {
      setError(err.message);
      addToast({
        title: "Connection Error",
        message: "Failed to sync with LifePilot backend. Please ensure the server is running.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [addToast]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const fetchPlan = useCallback(async (availableMinutes = 240, userStartTime = null) => {
    try {
      const plan = await api.planner.getTodayPlan(availableMinutes, userStartTime);
      setTodayPlan(plan);
      return plan;
    } catch (err) {
      addToast({
        title: "Planner Error",
        message: "Failed to generate grounded daily plan.",
        type: "error",
      });
      return null;
    }
  }, [addToast]);

  const createTask = async (taskData) => {
    try {
      const res = await api.tasks.create(taskData);
      setTasks((prev) => [res.task, ...prev]);
      addToast({
        title: "Task Created",
        message: `"${res.task.title}" has been saved.`,
        type: "success",
      });
      refreshAll(true);
      return res.task;
    } catch (err) {
      addToast({
        title: "Creation Failed",
        message: err.message,
        type: "error",
      });
      throw err;
    }
  };

  const updateTask = async (id, taskData) => {
    try {
      const res = await api.tasks.update(id, taskData);
      setTasks((prev) => prev.map((t) => (t.id === id ? res.task : t)));
      if (selectedTask?.id === id) setSelectedTask(res.task);
      addToast({
        title: "Task Updated",
        message: `Changes saved for "${res.task.title}".`,
        type: "success",
      });
      refreshAll(true);
      return res.task;
    } catch (err) {
      addToast({
        title: "Update Failed",
        message: err.message,
        type: "error",
      });
      throw err;
    }
  };

  const completeTask = async (id) => {
    try {
      const res = await api.tasks.complete(id);
      setTasks((prev) => prev.map((t) => (t.id === id ? res.task : t)));
      if (selectedTask?.id === id) setSelectedTask(res.task);
      addToast({
        title: "Task Completed",
        message: `"${res.task.title}" marked as complete! 🎉`,
        type: "success",
      });
      refreshAll(true);
      return res.task;
    } catch (err) {
      addToast({
        title: "Operation Failed",
        message: err.message,
        type: "error",
      });
      throw err;
    }
  };

  const completeSubtask = async (id, subtaskTitle) => {
    try {
      const res = await api.tasks.completeSubtask(id, subtaskTitle);
      setTasks((prev) => prev.map((t) => (t.id === id ? res.task : t)));
      if (selectedTask?.id === id) setSelectedTask(res.task);
      addToast({
        title: "Subtask Done",
        message: `Completed "${subtaskTitle}".`,
        type: "success",
      });
      refreshAll(true);
      return res.task;
    } catch (err) {
      addToast({
        title: "Failed to Complete Subtask",
        message: err.message,
        type: "error",
      });
      throw err;
    }
  };

  const deleteTask = async (id) => {
    try {
      await api.tasks.delete(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      if (selectedTask?.id === id) setSelectedTask(null);
      addToast({
        title: "Task Deleted",
        message: "The task was removed.",
        type: "info",
      });
      refreshAll(true);
    } catch (err) {
      addToast({
        title: "Deletion Failed",
        message: err.message,
        type: "error",
      });
      throw err;
    }
  };

  const openCreateTask = () => {
    setEditingTask(null);
    setIsTaskFormOpen(true);
  };

  const openEditTask = (task) => {
    setEditingTask(task);
    setIsTaskFormOpen(true);
  };

  const closeTaskForm = () => {
    setIsTaskFormOpen(false);
    setEditingTask(null);
  };

  return (
    <AppContext.Provider
      value={{
        tasks,
        goals,
        todayTasks,
        overdueTasks,
        todayPlan,
        healthStatus,
        isLoading,
        isRefreshing,
        error,
        selectedTask,
        setSelectedTask,
        isTaskFormOpen,
        editingTask,
        openCreateTask,
        openEditTask,
        closeTaskForm,
        searchQuery,
        setSearchQuery,
        statusFilter,
        setStatusFilter,
        priorityFilter,
        setPriorityFilter,
        refreshAll,
        fetchPlan,
        createTask,
        updateTask,
        completeTask,
        completeSubtask,
        deleteTask,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
