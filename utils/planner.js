import { validateTimeBudget } from "./validation.js";

/**
 * Pure, grounded Smart Daily Planner logic for LifePilot AI.
 * Deterministically sorts, allocates, and bounds tasks according to grounding rules.
 *
 * Rules strictly followed:
 * 1. Genuine overdue tasks prioritized first.
 * 2. Approaching deadlines and high priority next.
 * 3. Respect user time budget (arithmetic strictly verified).
 * 4. Stored durations preferred; missing durations explicitly labeled as estimates.
 * 5. Numbered work sessions (no invented clock times without a supplied start time).
 * 6. Multi-day plans: schedule only the earliest incomplete stage by default.
 * 7. No double-counting work.
 * 8. Empty state handling.
 *
 * @param {Object} options
 * @param {Array<Object>} [options.todayTasks]
 * @param {Array<Object>} [options.overdueTasks]
 * @param {Array<Object>} [options.pendingTasks]
 * @param {number} [options.availableMinutes=240] Total time budget (default 4 hours / 240 mins)
 * @param {string|null} [options.userStartTime=null] Optional user-supplied start time (e.g. "09:00 AM")
 * @param {number} [options.breakMinutes=15] Break duration between intensive sessions
 * @returns {Object} Grounded daily plan
 */
export function generateDailyPlan({
  todayTasks = [],
  overdueTasks = [],
  pendingTasks = [],
  availableMinutes = 240,
  userStartTime = null,
  breakMinutes = 15,
} = {}) {
  // 1. Handle Empty State
  const allTasks = [...overdueTasks, ...todayTasks, ...pendingTasks];
  if (allTasks.length === 0) {
    return {
      emptyState: true,
      summary: "No scheduled or overdue tasks found.",
      timeBudget: availableMinutes,
      sessions: [],
      remainingTasks: [],
      breaks: [],
      savedToDatabase: false,
    };
  }

  // 2. Identify candidates and eliminate duplicates by ID
  const seenIds = new Set();
  const prioritizedCandidates = [];

  // Group 1: Overdue tasks (Priority 1)
  for (const t of overdueTasks) {
    const id = t.id || (t._id ? t._id.toString() : t.title);
    if (!seenIds.has(id)) {
      seenIds.add(id);
      prioritizedCandidates.push({ ...t, isOverdue: true });
    }
  }

  // Group 2: Today's scheduled tasks and other pending tasks
  const remainingCandidates = [];
  for (const t of [...todayTasks, ...pendingTasks]) {
    const id = t.id || (t._id ? t._id.toString() : t.title);
    if (!seenIds.has(id)) {
      seenIds.add(id);
      remainingCandidates.push({ ...t, isOverdue: false });
    }
  }

  // Sort remaining candidates by priority ('high' > 'medium' > 'low') then deadline
  const priorityWeight = { high: 3, medium: 2, low: 1 };
  remainingCandidates.sort((a, b) => {
    const pA = priorityWeight[a.priority] || 2;
    const pB = priorityWeight[b.priority] || 2;
    if (pB !== pA) return pB - pA;

    if (a.deadline && b.deadline) {
      return new Date(a.deadline) - new Date(b.deadline);
    }
    return a.deadline ? -1 : b.deadline ? 1 : 0;
  });

  const fullQueue = [...prioritizedCandidates, ...remainingCandidates];

  // 3. Build Work Sessions respecting multi-day stages and time budget
  const sessions = [];
  const remainingTasks = [];
  let allocatedMinutes = 0;
  let sessionIndex = 1;

  for (const task of fullQueue) {
    // Check if task is a multi-day plan with day-labelled subtasks
    const subtasks = task.subtasks || [];
    const dayLabelledSubtasks = subtasks.filter((st) =>
      /day\s*\d+/i.test(st.title)
    );

    let sessionTitle = task.title;
    let plannedDuration = task.durationMinutes;
    let isEstimated = false;

    if (dayLabelledSubtasks.length > 0) {
      // Find the earliest incomplete day stage
      const earliestIncomplete = dayLabelledSubtasks.find(
        (st) => st.status !== "completed"
      );

      if (earliestIncomplete) {
        sessionTitle = `${task.title} - ${earliestIncomplete.title}`;
        plannedDuration = earliestIncomplete.durationMinutes || 60;
        isEstimated = !earliestIncomplete.durationMinutes;
      } else {
        // All day stages are completed
        continue;
      }
    } else if (!plannedDuration) {
      // Missing duration: default to 45 mins and label as estimate
      plannedDuration = 45;
      isEstimated = true;
    }

    // Check if adding this task exceeds budget
    if (allocatedMinutes + plannedDuration <= availableMinutes) {
      allocatedMinutes += plannedDuration;

      // Formatting session label: use numbered sessions if no start time is provided
      const sessionLabel = userStartTime
        ? `Session at ${userStartTime} (+${allocatedMinutes - plannedDuration}m)`
        : `Session ${sessionIndex}`;

      sessions.push({
        sessionNumber: sessionIndex++,
        label: sessionLabel,
        taskId: task.id || (task._id ? task._id.toString() : null),
        taskTitle: sessionTitle,
        isOverdue: !!task.isOverdue,
        priority: task.priority || "medium",
        durationMinutes: plannedDuration,
        isEstimatedDuration: isEstimated,
        durationLabel: isEstimated ? `${plannedDuration}m (estimated)` : `${plannedDuration}m (stored)`,
      });
    } else {
      // Does not fit in time budget
      remainingTasks.push({
        taskId: task.id || (task._id ? task._id.toString() : null),
        taskTitle: task.title,
        priority: task.priority || "medium",
        durationMinutes: plannedDuration,
        reason: "Exceeds available time budget",
      });
    }
  }

  // 4. Arithmetic validation
  const budgetValidation = validateTimeBudget(availableMinutes, sessions, 0);

  return {
    emptyState: false,
    availableMinutes,
    totalAllocatedMinutes: budgetValidation.totalAllocated,
    remainingMinutes: budgetValidation.remainingMinutes,
    hasInventedClockTimes: false, // strictly numbered sessions
    userProvidedStartTime: userStartTime,
    sessions,
    remainingTasks,
    savedToDatabase: false, // Read-only plan proposal
  };
}
