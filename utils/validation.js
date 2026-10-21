import mongoose from "mongoose";

/**
 * Validates whether a given string is a valid MongoDB ObjectId.
 * @param {string} id
 * @returns {boolean}
 */
export function isValidObjectId(id) {
  return typeof id === "string" && mongoose.isValidObjectId(id);
}

/**
 * Formats a raw Mongoose task document into a compact, token-optimized object.
 * Strips MongoDB internal fields (__v, internal getters/setters) to minimize token consumption.
 * @param {Object} task
 * @returns {Object}
 */
export function formatTaskCompact(task) {
  if (!task) return null;
  const raw = typeof task.toObject === "function" ? task.toObject() : task;

  return {
    id: raw._id ? raw._id.toString() : raw.id,
    title: raw.title,
    goal: raw.goal ?? null,
    priority: raw.priority ?? "medium",
    status: raw.status ?? "pending",
    durationMinutes: raw.durationMinutes ?? null,
    scheduledDate: raw.scheduledDate ? new Date(raw.scheduledDate).toISOString() : null,
    deadline: raw.deadline ? new Date(raw.deadline).toISOString() : null,
    subtasks: Array.isArray(raw.subtasks)
      ? raw.subtasks.map((st) => ({
          title: st.title,
          status: st.status ?? "pending",
          durationMinutes: st.durationMinutes ?? null,
          completedAt: st.completedAt ? new Date(st.completedAt).toISOString() : null,
        }))
      : [],
  };
}

/**
 * Formats an array of task documents into compact token-optimized objects.
 * @param {Array<Object>} tasks
 * @returns {Array<Object>}
 */
export function formatTaskListCompact(tasks) {
  if (!Array.isArray(tasks)) return [];
  return tasks.map(formatTaskCompact);
}

/**
 * Validates planning time budget arithmetic.
 * Ensures allocated minutes do not exceed the user's available time.
 * @param {number} availableMinutes
 * @param {Array<{durationMinutes: number}>} sessions
 * @param {number} breakMinutes
 * @returns {{isValid: boolean, totalAllocated: number, remainingMinutes: number}}
 */
export function validateTimeBudget(availableMinutes, sessions = [], breakMinutes = 0) {
  const sessionTotal = sessions.reduce((acc, s) => acc + (Number(s.durationMinutes) || 0), 0);
  const totalAllocated = sessionTotal + (Number(breakMinutes) || 0);
  const remainingMinutes = availableMinutes - totalAllocated;

  return {
    isValid: totalAllocated <= availableMinutes,
    totalAllocated,
    remainingMinutes,
  };
}
