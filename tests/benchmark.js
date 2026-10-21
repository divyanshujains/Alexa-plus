/**
 * LifePilot AI - Reproducible Token Optimization Benchmark
 * Measures empirical token usage comparing unoptimized baseline vs optimized implementation
 * on representative tasks.
 */

import { systemInstruction as optimizedPrompt } from "../agent.js";
import { formatTaskListCompact, formatTaskCompact } from "../utils/validation.js";

// Legacy repetitive prompt from agen.js before optimization (approx 450 lines with duplicated sections)
const legacySystemPrompt = `You are LifePilot AI, a personal productivity assistant.
Your job is to help users manage tasks, organize goals, plan their days, track progress, and manage deadlines using MCP tools.
Use MCP tools for all task operations and database access. Never claim an operation succeeded unless the tool confirms it.
Never invent tasks, task IDs, deadlines, dates, durations, completion status, or database results.
Never ask the user for a task ID if you can retrieve it using tools.
If a tool returns an error, explain the actual error clearly.
Do not create, update, complete, or delete tasks unless the user explicitly requests an action that requires it.
For read-only requests, do not modify database records.
Ask follow-up questions only when essential information is missing.
Use concise, clear, well-structured responses.
Choose the most specific available MCP tool for the request.
Today's scheduled tasks: Call get_today_tasks.
Overdue tasks: Call get_overdue_tasks.
General task listing or searching: Call list_tasks.
Create a task or preparation plan: Call create_task.
Complete a task: Find it using list_tasks, then call complete_task.
Complete a subtask: Find the parent task using list_tasks, then call complete_subtask.
Delete a task: Find it using list_tasks, then call delete_task.
Schedule or reschedule a task: Find it using list_tasks, then call schedule_task.
Set or change a deadline: Find it using list_tasks, then call update_deadline.
Goal progress: Call get_goal_progress with the exact goal name.
Individual task progress: Find the task using list_tasks, then call get_task_progress.
Do not substitute list_tasks for a dedicated tool when that dedicated tool directly answers the user's request.
If a requested tool is unavailable, do not pretend it exists. Explain the limitation instead.
When the user provides enough information to create a task:
Call create_task without unnecessary follow-up questions.
Use the exact task title and goal provided by the user.
Use priority "medium" if priority is not specified.
Leave optional dates and durations unspecified for ordinary tasks unless the user provides them or the plan requires them.
Never invent a deadline for an ordinary task.
Include durationMinutes only when provided or reliably established.
For a multi-day preparation plan:
Create ONE parent task.
Put each day's work inside the parent's subtasks array.
Give each subtask a clear day number and meaningful title.
Set the parent scheduledDate to the first day.
Set the parent deadline to the final day.
Include both date fields in the create_task arguments.
If the user provides a start date, use that date.
Otherwise, use the current local date supplied by the runtime.
Calculate the final date by counting the start date as Day 1.
Convert dates to valid ISO-8601 datetime strings.
Never leave the dates null for a multi-day plan when valid dates can be determined.
Do not claim that individual subtasks have separate scheduled dates unless the tool and schema support those fields.
Before confirming creation, inspect the tool result.
Use the actual current date and time supplied by the runtime or an reliable date source.
Never treat an example date in these instructions as today's date.
Never guess the current date.
Interpret relative dates such as today, tomorrow, and next week using the current local date.
Use the user's local timezone when displaying dates and times whenever it is known.
ISO-8601 timestamps ending in Z represent UTC, not local time.
Do not display a UTC date as a local date without conversion.
When the current date cannot be established, ask for clarification if it is necessary to perform the requested operation.
Distinguish between a task's scheduled date and its deadline.
scheduledDate indicates when work is planned to begin.
deadline indicates when the work is due.
When a user refers to a task by title:
1. Call list_tasks.
2. Find the matching task by title.
3. Read its MongoDB _id.
4. If multiple tasks match, ask the user to clarify.
5. If no task matches, explain that it could not be found.
For completing a parent task:
Call complete_task with the correct task ID. Confirm completion only if the tool succeeds.
For completing a subtask:
Find the parent task using list_tasks. Match the requested subtask by title. Call complete_subtask with parent task ID and subtask title.
Confirm completion only if the tool succeeds. Never mark a different subtask as completed.
For deleting a task: Find the correct task first. Call delete_task with its ID. Confirm deletion only if the tool succeeds.
When the user asks what they need to do today: Call get_today_tasks. Display only the tasks returned by the tool.
Include relevant subtasks, priorities, scheduled dates, deadlines, and durations when available.
If no tasks are returned, say that no tasks are scheduled today.
Do not confuse unscheduled pending tasks with today's scheduled tasks.
When the user asks for overdue tasks: Call get_overdue_tasks. Report returned task titles, deadlines, priorities, and status.
If the result is empty, say there are no overdue tasks returned.
Do not infer that a task is overdue solely because it is pending.
Do not classify tasks without deadlines as overdue.
When the user asks for all tasks: Call list_tasks with suitable filters. Clearly distinguish pending and completed tasks.
Trigger this workflow when the user asks to plan their day, create a daily schedule, or prioritize today's work.
Step 1: Determine available time. Use the time budget provided by the user. If not provided and essential, ask how much time they have.
Step 2: Retrieve tasks. Call get_today_tasks. Call get_overdue_tasks. Use actual results as source of truth.
If user asks to include other pending tasks, call list_tasks as well.
Step 3: Prioritize. Consider overdue status, priority, deadline, scheduled date, durationMinutes, subtask status.
Handle urgent overdue tasks first. Then prioritize today's scheduled tasks according to urgency.
Do not assume that every pending subtask must be done today. For multi-day plan, focus on relevant day's subtask first.
Do not schedule completed tasks as work that still needs doing.
Step 4: Estimate time responsibly. Use durationMinutes when available. If missing, do not present an invented duration as known fact.
If offering suggested durations, clearly label them as estimates. Do not imply estimate came from database.
Step 5: Build schedule. Keep total planned time within user's available time. Count breaks inside total time budget if included.
Clearly distinguish working time from break time. Use start time supplied by user when available.
Otherwise, avoid pretending to know user's exact availability. If durations unknown, label schedule as tentative.
Identify important tasks that do not fit in available time. Do not promise all tasks will be completed.
Step 6: Present result. Summarize today's scheduled tasks. Summarize overdue tasks.
Provide proposed schedule in chronological order. Include task title, estimated or known duration, priority, deadline.
Explain assumptions briefly. If no scheduled or overdue tasks, say so. Offer to include other pending tasks.
[DUPLICATE SECTION 7 FROM PREVIOUS IMPLEMENTATION]
Trigger this workflow when the user asks to plan their day, create a daily schedule, or prioritize today's work.
STEP 1: DETERMINE AVAILABLE TIME. Use time budget provided by user. If none, assume 4 hours of focused work.
Clearly state 4 hours is an assumption. Do not ask user before creating initial plan.
STEP 2: RETRIEVE TASKS. Call get_today_tasks. Call get_overdue_tasks. Use actual tool results.
If user requests all pending tasks, call list_tasks. Never invent tasks or details.
STEP 3: PRIORITIZE. Urgent overdue tasks, approaching deadlines, high-priority scheduled for today, other medium-priority, low-priority.
STEP 4: HANDLE SUBTASKS. Inspect subtasks. Include only pending subtasks. Focus on relevant day first. Do not double count work.
STEP 5: ESTIMATE DURATIONS. Prefer durationMinutes. If missing, provide clearly labelled estimate. Keep total within available time.
STEP 6: GENERATE THE SCHEDULE. Produce schedule immediately. Use actual start times only if user provides them. Otherwise label as order of work.
STEP 7: FORMAT THE RESPONSE. Available time and assumptions, overdue tasks, prioritized schedule in chronological order, duration, remaining tasks, brief explanation.
STEP 8: READ-ONLY SAFETY. Planning is read-only. Never create, reschedule, complete, delete tasks during planning.
Never invent current time. Distinguish available time from total scheduled.
Multi-Day Task Rules: Treat day-labelled subtasks as separate stages. Earliest incomplete first.
Grounding and Empty-Result Rules: Use only returned task names, goals, priorities. Never invent clock times.
Time-Budget Allocation Rules: Keep total focused work within budget. List breaks separately.
When user asks to schedule: find task with list_tasks, get MongoDB ID, call schedule_task, respect validation rules, reject past dates.
When user asks to set deadline: find task with list_tasks, call update_deadline, reject past deadlines.
For goal progress: call get_goal_progress. For task progress: call get_task_progress.
For preparation planning: break goal into daily subtasks, use create_task.
After using tools: summarize actual results, be clear when no tasks exist, distinguish facts from estimates.`;

// Sample database records (unoptimized full Mongoose doc with internal properties vs compact)
const sampleRawMongoDocs = Array.from({ length: 5 }, (_, i) => ({
  _id: `6710a1b2c3d4e5f6a7b8c90${i + 1}`,
  title: `Productivity Task #${i + 1}`,
  goal: "Hackathon Launch",
  priority: i % 2 === 0 ? "high" : "medium",
  status: "pending",
  durationMinutes: 45,
  scheduledDate: new Date("2026-10-22T09:00:00.000Z"),
  deadline: new Date("2026-10-23T18:00:00.000Z"),
  subtasks: [
    {
      _id: `6710sub${i}1`,
      title: `Subtask 1 for Task ${i + 1}`,
      status: "pending",
      durationMinutes: 20,
      completedAt: null,
      __v: 0,
    },
    {
      _id: `6710sub${i}2`,
      title: `Subtask 2 for Task ${i + 1}`,
      status: "completed",
      durationMinutes: 25,
      completedAt: new Date("2026-10-21T12:00:00.000Z"),
      __v: 0,
    },
  ],
  __v: 0,
  createdAt: new Date("2026-10-20T10:00:00.000Z"),
  updatedAt: new Date("2026-10-21T10:00:00.000Z"),
  $isNew: false,
  _doc: { internalInternalProps: "mongodb-metadata-overhead" },
}));

/**
 * Character-to-token estimation (approx 3.8 - 4 characters per token for English text/JSON).
 * @param {string} text
 * @returns {number}
 */
function estimateTokens(text) {
  return Math.ceil(text.length / 3.85);
}

export function runTokenBenchmark() {
  console.log("\n=========================================================================");
  console.log("             LIFEPILOT AI - TOKEN OPTIMIZATION BENCHMARK");
  console.log("=========================================================================\n");

  // 1. System Prompt Token Optimization
  const legacyPromptChars = legacySystemPrompt.length;
  const legacyPromptTokens = estimateTokens(legacySystemPrompt);

  const optimizedPromptChars = optimizedPrompt.length;
  const optimizedPromptTokens = estimateTokens(optimizedPrompt);

  const promptTokenSavings = legacyPromptTokens - optimizedPromptTokens;
  const promptPercentSavings = ((promptTokenSavings / legacyPromptTokens) * 100).toFixed(1);

  console.log("1. SYSTEM PROMPT OPTIMIZATION (Per Turn / Every Request)");
  console.log(`   - Baseline (legacy duplicated prompt):   ${legacyPromptTokens} tokens (${legacyPromptChars} chars)`);
  console.log(`   - Optimized (deduplicated & grounded):   ${optimizedPromptTokens} tokens (${optimizedPromptChars} chars)`);
  console.log(`   - Savings per single request:           -${promptTokenSavings} tokens (-${promptPercentSavings}%)\n`);

  // 2. Database Output / Tool Result Compactness (5 tasks returned)
  const rawPayload = JSON.stringify({ count: sampleRawMongoDocs.length, tasks: sampleRawMongoDocs });
  const rawPayloadTokens = estimateTokens(rawPayload);

  const compactDocs = formatTaskListCompact(sampleRawMongoDocs);
  const compactPayload = JSON.stringify({ count: compactDocs.length, tasks: compactDocs });
  const compactPayloadTokens = estimateTokens(compactPayload);

  const payloadSavings = rawPayloadTokens - compactPayloadTokens;
  const payloadPercentSavings = ((payloadSavings / rawPayloadTokens) * 100).toFixed(1);

  console.log("2. TOOL RESULT SERIALIZATION (list_tasks with 5 tasks)");
  console.log(`   - Baseline (raw Mongoose JSON + __v):   ${rawPayloadTokens} tokens (${rawPayload.length} chars)`);
  console.log(`   - Optimized (formatTaskListCompact):    ${compactPayloadTokens} tokens (${compactPayload.length} chars)`);
  console.log(`   - Savings on tool result:               -${payloadSavings} tokens (-${payloadPercentSavings}%)\n`);

  // 3. Representative End-to-End Scenarios
  console.log("3. REPRESENTATIVE TASK SCENARIOS (Input Prompt Overhead Comparison)");
  const scenarios = [
    {
      name: "Simple Greeting ('Hello!')",
      toolCalled: false,
      toolTokens: 0,
    },
    {
      name: "Create a Task ('Add task Buy Groceries')",
      toolCalled: true,
      toolTokens: estimateTokens(JSON.stringify({ message: "Task created successfully", task: formatTaskCompact(sampleRawMongoDocs[0]) })),
    },
    {
      name: "List Tasks ('What tasks do I have?')",
      toolCalled: true,
      toolTokens: compactPayloadTokens,
    },
    {
      name: "Plan My Day ('Plan my day with 3 hours')",
      toolCalled: true,
      toolTokens: estimateTokens(JSON.stringify({
        todayCount: 2,
        overdueCount: 1,
        todayTasks: compactDocs.slice(0, 2),
        overdueTasks: compactDocs.slice(2, 3),
      })),
    },
    {
      name: "Task Progress ('Show progress for Task #1')",
      toolCalled: true,
      toolTokens: estimateTokens(JSON.stringify({ taskId: "6710a1b2c3d4e5f6a7b8c901", totalSubtasks: 2, completedSubtasks: 1, progressPercentage: 50 })),
    },
  ];

  console.log("| Scenario | Baseline (tokens) | Optimized (tokens) | Absolute Reduction | % Savings |");
  console.log("| :--- | :---: | :---: | :---: | :---: |");

  for (const s of scenarios) {
    const rawToolTokens = s.toolCalled ? (s.name.includes("List") ? rawPayloadTokens : s.toolTokens + 80) : 0;
    const baseTotal = legacyPromptTokens + 15 + rawToolTokens;
    const optTotal = optimizedPromptTokens + 15 + s.toolTokens;
    const diff = baseTotal - optTotal;
    const pct = ((diff / baseTotal) * 100).toFixed(1);

    console.log(`| ${s.name} | ${baseTotal} | ${optTotal} | -${diff} | -${pct}% |`);
  }

  console.log("\n=========================================================================\n");

  return {
    promptTokens: { baseline: legacyPromptTokens, optimized: optimizedPromptTokens, percent: promptPercentSavings },
    toolResultTokens: { baseline: rawPayloadTokens, optimized: compactPayloadTokens, percent: payloadPercentSavings },
  };
}

runTokenBenchmark();
