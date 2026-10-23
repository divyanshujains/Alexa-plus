/**
 * LifePilot API Client
 * Interfaces with the backend REST endpoints.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}/api${endpoint}`;
  const config = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  try {
    const res = await fetch(url, config);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}: ${res.statusText}`);
    }

    return data;
  } catch (err) {
    console.error(`API Error on [${options.method || "GET"} ${endpoint}]:`, err.message);
    throw err;
  }
}

export const api = {
  // System Health
  health: {
    check: () => request("/health"),
  },

  // Task Operations
  tasks: {
    list: (params = {}) => {
      const query = new URLSearchParams();
      if (params.status && params.status !== "all") query.append("status", params.status);
      if (params.priority && params.priority !== "all") query.append("priority", params.priority);
      if (params.goal) query.append("goal", params.goal);
      if (params.search) query.append("search", params.search);

      const qs = query.toString();
      return request(`/tasks${qs ? `?${qs}` : ""}`);
    },

    get: (id) => request(`/tasks/${id}`),

    create: (taskData) =>
      request("/tasks", {
        method: "POST",
        body: JSON.stringify(taskData),
      }),

    update: (id, taskData) =>
      request(`/tasks/${id}`, {
        method: "PUT",
        body: JSON.stringify(taskData),
      }),

    complete: (id) =>
      request(`/tasks/${id}/complete`, {
        method: "PATCH",
      }),

    completeSubtask: (id, subtaskTitle) =>
      request(`/tasks/${id}/subtasks/${encodeURIComponent(subtaskTitle)}/complete`, {
        method: "PATCH",
      }),

    delete: (id) =>
      request(`/tasks/${id}`, {
        method: "DELETE",
      }),

    getToday: () => request("/tasks-today"),

    getOverdue: () => request("/tasks-overdue"),
  },

  // Daily Planning
  planner: {
    getTodayPlan: (availableMinutes = 240, userStartTime = null) => {
      const query = new URLSearchParams({ availableMinutes });
      if (userStartTime) query.append("userStartTime", userStartTime);
      return request(`/planner/today?${query.toString()}`);
    },
  },

  // Goals
  goals: {
    getSummary: () => request("/goals/summary"),
  },

  // AI Assistant Chat
  chat: {
    send: (message, conversationHistory = []) =>
      request("/chat", {
        method: "POST",
        body: JSON.stringify({ message, conversationHistory }),
      }),
  },
};
