# LifePilot AI — Hallucination Prevention & Grounding Specification

## 1. Overview and Core Philosophy

In personal productivity and task scheduling systems, AI hallucinations lead directly to missed real-world deadlines, double-scheduled meetings, and corrupted task states. LifePilot enforces a strict **Zero-Hallucination Architecture** where:
1. The **MongoDB database via MCP tools is the sole source of truth**.
2. Speculation is explicitly forbidden for all task properties (IDs, deadlines, completion statuses, priorities).
3. Stored database facts are rigorously separated from heuristic suggestions.

---

## 2. Database Grounding Principles

### A. Mutation Grounding
The AI agent is barred from claiming that an operation (creation, completion, deletion, scheduling) succeeded unless the underlying MCP tool returned confirmation.
- **Enforcement**: If a tool returns `{ isError: true }`, the agent relays the failure directly to the user.
- **Verification**: Verified in `tests/agent.test.js` (Test 16: *"No Claim of Mutation When Tool Reports Failure"*).

### B. Distinguishing Stored Facts from Estimates
- If a task lacks a stored `durationMinutes`, the system never invents a duration and presents it as a database fact.
- Any heuristic duration suggested by the planner is explicitly formatted as `"(estimated)"` (e.g. `"45m (estimated)"`).
- Verified in `tests/planner.test.js` (Test 8 & B1: *"Missing Task Durations Explicitly Labeled as Estimates"*).

---

## 3. Grounded Smart Daily Planner Rules

The Smart Daily Planner in [utils/planner.js](file:///c:/Users/leno/OneDrive/Desktop/Alexplus/utils/planner.js) implements deterministic algorithms to eliminate planning hallucinations:

### 1. Genuine Overdue Prioritization
- Overdue tasks (where `deadline < now` and `status == "pending"`) are automatically identified and placed in **Session 1** before scheduled tasks.
- Verified in `tests/planner.test.js` (Test 9: *"Genuine Mocked Overdue Task Prioritized First"*).

### 2. Elimination of Invented Clock Times
- When users request a daily plan without providing an explicit start time (e.g. *"Plan my day with 3 hours"*), typical LLMs hallucinate calendar clock times (e.g., *"9:00 AM - 10:00 AM"*).
- LifePilot strictly generates **numbered work sessions** (`"Session 1"`, `"Session 2"`) unless the user explicitly provides a start time.
- Verified in `tests/planner.test.js` (Test 13: *"No Invented Clock Times Without a Supplied Start Time"*).

### 3. Multi-Day Stage Isolation
- Multi-day goals broken into day-labelled subtasks (e.g., `"Day 1"`, `"Day 2"`, `"Day 3"`) must not have future stages scheduled today by default.
- LifePilot isolates and schedules **only the earliest incomplete stage** (e.g. Day 1) for today, keeping later stages under `"Remaining Tasks"`.
- Verified in `tests/planner.test.js` (Test 11: *"Multi-Day Plan Not Scheduling Future Stages by Default"*).

### 4. Strict Time-Budget Arithmetic
- Allocations are checked against the user's available time.
- Total scheduled minutes plus breaks never exceed the stated budget. Tasks that do not fit are placed into `"Remaining Tasks"` with clear explanations.
- Verified in `tests/planner.test.js` (Test 12: *"Correct Time-Budget Arithmetic"*).

### 5. Read-Only Planning Safety
- Planning is strictly read-only by default. The system never claims a plan has been saved to MongoDB unless a mutation tool (`create_task`, `schedule_task`) was explicitly invoked and confirmed.

---

## 4. Input Validation & Error Isolation

To prevent malformed prompts or database injection:
- **ObjectId Guard**: `isValidObjectId()` validates all MongoDB IDs before queries are issued, preventing Mongoose casting crashes.
- **Past Date Rejection**: Both `schedule_task` and `update_deadline` reject dates earlier than today's local midnight.
- **Untrusted Tool Outputs**: Tool outputs are sanitized and formatted via `formatSafeErrorMessage()`, preventing stack traces, environment variables, or database connection strings from leaking to the user.

---

## 5. Verification Matrix

| Hallucination Vector | Prevention Mechanism | Test Case | Status |
| :--- | :--- | :--- | :--- |
| **Invented Task Status** | MCP tool result required as source of truth | `tests/agent.test.js` (Test 3) | **VERIFIED** |
| **Fake Mutation Confirmation** | Agent inspects `isError` flag on tool result | `tests/agent.test.js` (Test 16) | **VERIFIED** |
| **Invented Clock Times** | Numbered sessions enforced without start time | `tests/planner.test.js` (Test 13) | **VERIFIED** |
| **Double-Counting Multi-Day** | Earliest incomplete stage isolated | `tests/planner.test.js` (Test 11) | **VERIFIED** |
| **Budget Math Drift** | Deterministic budget verification | `tests/planner.test.js` (Test 12) | **VERIFIED** |
| **Fabricated Durations** | Missing durations labeled `(estimated)` | `tests/planner.test.js` (Test 8 & B1) | **VERIFIED** |
| **Past Date Scheduling** | Date boundary check against local midnight | `tests/tool-routing.test.js` (Test 6) | **VERIFIED** |
