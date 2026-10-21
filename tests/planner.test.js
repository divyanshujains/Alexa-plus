import test from "node:test";
import assert from "node:assert/strict";
import { generateDailyPlan } from "../utils/planner.js";
import {
  mockTasks,
  mockOverdueTasks,
  mockMultiDayTask,
} from "./fixtures/mockData.js";

test("9. Genuine Mocked Overdue Task Prioritized First", () => {
  const plan = generateDailyPlan({
    todayTasks: [mockTasks[0]], // high priority today task (60 mins)
    overdueTasks: [mockOverdueTasks[0]], // overdue expense report (30 mins)
    availableMinutes: 180,
  });

  assert.ok(plan.sessions.length >= 2, "Should have scheduled sessions");
  const firstSession = plan.sessions[0];
  assert.strictEqual(
    firstSession.taskTitle,
    "Submit Expense Report",
    "Overdue task must be placed in Session 1"
  );
  assert.strictEqual(firstSession.isOverdue, true, "First session must be flagged as overdue");
});

test("10. Regular Task Scheduled After Overdue Task", () => {
  const plan = generateDailyPlan({
    todayTasks: [mockTasks[0]], // Finish Hackathon Presentation
    overdueTasks: [mockOverdueTasks[0]], // Submit Expense Report
    availableMinutes: 180,
  });

  assert.strictEqual(plan.sessions[0].taskTitle, "Submit Expense Report");
  assert.strictEqual(plan.sessions[1].taskTitle, "Finish Hackathon Presentation");
  assert.strictEqual(plan.sessions[1].sessionNumber, 2);
  assert.strictEqual(plan.sessions[1].isOverdue, false);
});

test("11. Multi-Day Plan Not Scheduling Future Stages by Default", () => {
  const plan = generateDailyPlan({
    todayTasks: [mockMultiDayTask],
    overdueTasks: [],
    availableMinutes: 240,
  });

  // Check that only Day 1 is scheduled
  const multiDaySessions = plan.sessions.filter((s) =>
    s.taskTitle.includes("Fullstack Architecture Certification")
  );

  assert.strictEqual(
    multiDaySessions.length,
    1,
    "Only the earliest incomplete stage (Day 1) must be scheduled today"
  );
  assert.match(
    multiDaySessions[0].taskTitle,
    /Day 1/i,
    "Scheduled session must be Day 1"
  );
  // Ensure Day 2 and Day 3 were not scheduled
  const hasFutureStages = plan.sessions.some(
    (s) => s.taskTitle.includes("Day 2") || s.taskTitle.includes("Day 3")
  );
  assert.strictEqual(hasFutureStages, false, "Future stages Day 2 and Day 3 must not be scheduled today");
});

test("12. Correct Time-Budget Arithmetic", () => {
  const plan = generateDailyPlan({
    todayTasks: [
      { id: "1", title: "Task 1", durationMinutes: 60, priority: "high" },
      { id: "2", title: "Task 2", durationMinutes: 45, priority: "high" },
      { id: "3", title: "Task 3", durationMinutes: 90, priority: "medium" },
    ],
    overdueTasks: [],
    availableMinutes: 120, // Budget is 120 mins
  });

  // Task 1 (60) + Task 2 (45) = 105 mins <= 120 mins.
  // Task 3 (90) would make 195 mins > 120 mins, so it must be put in remainingTasks.
  assert.strictEqual(plan.sessions.length, 2);
  assert.strictEqual(plan.totalAllocatedMinutes, 105);
  assert.strictEqual(plan.remainingMinutes, 15);
  assert.strictEqual(plan.totalAllocatedMinutes + plan.remainingMinutes, 120);

  // Check remaining tasks
  assert.strictEqual(plan.remainingTasks.length, 1);
  assert.strictEqual(plan.remainingTasks[0].taskTitle, "Task 3");
  assert.strictEqual(plan.remainingTasks[0].reason, "Exceeds available time budget");
});

test("13. No Invented Clock Times Without a Supplied Start Time", () => {
  // Case A: No start time supplied
  const planWithoutStart = generateDailyPlan({
    todayTasks: [mockTasks[0]],
    availableMinutes: 120,
    userStartTime: null,
  });

  assert.strictEqual(planWithoutStart.sessions[0].label, "Session 1");
  assert.strictEqual(planWithoutStart.hasInventedClockTimes, false);
  // Must NOT contain arbitrary invented clock times like '9:00 AM'
  assert.doesNotMatch(planWithoutStart.sessions[0].label, /\d{1,2}:\d{2}\s*(AM|PM)/i);

  // Case B: User supplied start time
  const planWithStart = generateDailyPlan({
    todayTasks: [mockTasks[0]],
    availableMinutes: 120,
    userStartTime: "10:00 AM",
  });
  assert.match(planWithStart.sessions[0].label, /10:00 AM/);
});

test("8 & B1. Missing Task Durations Explicitly Labeled as Estimates", () => {
  const plan = generateDailyPlan({
    todayTasks: [mockTasks[1]], // Review PR #42 (duration is null)
    availableMinutes: 120,
  });

  assert.strictEqual(plan.sessions.length, 1);
  assert.strictEqual(plan.sessions[0].isEstimatedDuration, true);
  assert.match(plan.sessions[0].durationLabel, /estimated/i);
});

test("B4. Empty State Handled Safely", () => {
  const plan = generateDailyPlan({
    todayTasks: [],
    overdueTasks: [],
    availableMinutes: 120,
  });

  assert.strictEqual(plan.emptyState, true);
  assert.strictEqual(plan.sessions.length, 0);
  assert.strictEqual(plan.savedToDatabase, false);
});
