/**
 * Mock data fixtures for testing LifePilot AI tools and agent logic.
 * Ensures zero dependency on production MongoDB data.
 */

export const mockTasks = [
  {
    _id: "6710a1b2c3d4e5f6a7b8c901",
    title: "Finish Hackathon Presentation",
    goal: "Win Hackathon",
    priority: "high",
    status: "pending",
    durationMinutes: 60,
    scheduledDate: new Date("2026-10-21T09:00:00.000Z"),
    deadline: new Date("2026-10-21T18:00:00.000Z"),
    subtasks: [
      {
        title: "Create slides",
        status: "completed",
        durationMinutes: 30,
        completedAt: new Date("2026-10-21T10:00:00.000Z"),
      },
      {
        title: "Record demo video",
        status: "pending",
        durationMinutes: 30,
        completedAt: null,
      },
    ],
  },
  {
    _id: "6710a1b2c3d4e5f6a7b8c902",
    title: "Review Pull Request #42",
    goal: "Code Quality",
    priority: "medium",
    status: "pending",
    durationMinutes: null, // missing duration
    scheduledDate: new Date("2026-10-21T14:00:00.000Z"),
    deadline: new Date("2026-10-22T17:00:00.000Z"),
    subtasks: [],
  },
];

export const mockOverdueTasks = [
  {
    _id: "6710a1b2c3d4e5f6a7b8c903",
    title: "Submit Expense Report",
    goal: "Finance",
    priority: "high",
    status: "pending",
    durationMinutes: 30,
    scheduledDate: new Date("2026-10-18T10:00:00.000Z"),
    deadline: new Date("2026-10-19T23:59:59.000Z"), // Overdue!
    subtasks: [],
  },
];

export const mockMultiDayTask = {
  _id: "6710a1b2c3d4e5f6a7b8c904",
  title: "Fullstack Architecture Certification",
  goal: "Career Growth",
  priority: "high",
  status: "pending",
  durationMinutes: 180,
  scheduledDate: new Date("2026-10-21T00:00:00.000Z"),
  deadline: new Date("2026-10-25T23:59:59.000Z"),
  subtasks: [
    {
      title: "Day 1: System Design Fundamentals",
      status: "pending",
      durationMinutes: 60,
      completedAt: null,
    },
    {
      title: "Day 2: Distributed Databases & Sharding",
      status: "pending",
      durationMinutes: 60,
      completedAt: null,
    },
    {
      title: "Day 3: Caching & Rate Limiting",
      status: "pending",
      durationMinutes: 60,
      completedAt: null,
    },
  ],
};
