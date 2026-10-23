import React from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Target,
  Calendar,
  ArrowRight,
  Compass,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { useApp } from "../context/AppContext.jsx";
import { MetricCard } from "../components/common/MetricCard.jsx";
import { CommandInput } from "../components/common/CommandInput.jsx";
import { TaskItem } from "../components/tasks/TaskItem.jsx";
import { EmptyState } from "../components/common/EmptyState.jsx";
import { TaskListSkeleton } from "../components/common/LoadingSkeleton.jsx";
import { BrandMark } from "../components/common/BrandLogo.jsx";

export function DashboardView() {
  const navigate = useNavigate();
  const {
    tasks,
    goals,
    todayTasks,
    overdueTasks,
    todayPlan,
    isLoading,
    openCreateTask,
    setSelectedTask,
    openEditTask,
  } = useApp();

  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const completedTasks = tasks.filter((t) => t.status === "completed");
  const completionRate =
    tasks.length === 0 ? 0 : Math.round((completedTasks.length / tasks.length) * 100);

  // Compute total estimated workload for today's tasks
  const todayWorkloadMinutes = todayTasks.reduce(
    (acc, t) => acc + (t.durationMinutes || 30),
    0
  );

  // Chart data: tasks grouped by priority using quiet luxury palette
  const priorityChartData = [
    {
      name: "High",
      count: tasks.filter((t) => t.priority === "high").length,
      fill: "#9E5A5A", // Restrained terracotta
    },
    {
      name: "Medium",
      count: tasks.filter((t) => t.priority === "medium").length,
      fill: "#B69A62", // Antique Gold
    },
    {
      name: "Low",
      count: tasks.filter((t) => t.priority === "low").length,
      fill: "#A7B6A2", // Soft Sage
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Editorial Welcome & Command Section */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
            <span className="text-[10px] font-mono text-gold uppercase tracking-widest font-semibold">
              Grounded Intelligence Desk
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-medium text-ivory tracking-tight">
            Focus & Orchestration
          </h1>
          <p className="text-xs sm:text-sm text-slate mt-1 max-w-2xl font-sans">
            Sovereign productivity grounded by Model Context Protocol and MongoDB Atlas. What priority will you advance today?
          </p>
        </div>

        {/* AI Command Bar */}
        <CommandInput />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Today's Schedule"
          value={todayTasks.length}
          subtitle={`${todayWorkloadMinutes}m estimated workload`}
          icon={Calendar}
          color="teal"
        />

        <MetricCard
          title="Pending Queue"
          value={pendingTasks.length}
          subtitle={`${completionRate}% overall completion`}
          icon={Clock}
          color="gold"
        />

        <MetricCard
          title="Completed"
          value={completedTasks.length}
          subtitle="Grounded in database"
          icon={CheckCircle2}
          color="sage"
        />

        <MetricCard
          title="Overdue Items"
          value={overdueTasks.length}
          subtitle={
            overdueTasks.length > 0
              ? "Session 1 priority clearing"
              : "All commitments on schedule"
          }
          icon={AlertTriangle}
          color={overdueTasks.length > 0 ? "rose" : "sage"}
        />
      </div>

      {/* Main Grid: Priority Tasks + Productivity Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Today's Focus & Priority Tasks */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl border border-obsidian-border bg-obsidian-surface shadow-card">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-obsidian-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-teal/30 border border-gold/20 text-gold">
                  <Clock className="w-4 h-4 stroke-[1.75]" />
                </div>
                <div>
                  <h3 className="text-base font-display font-medium text-ivory">
                    Today's Priority Focus
                  </h3>
                  <span className="text-[11px] text-slate font-mono">
                    Scheduled commitments & urgent items
                  </span>
                </div>
              </div>

              <button
                onClick={() => navigate("/planner")}
                className="text-xs font-semibold text-gold hover:text-ivory flex items-center gap-1.5 transition-colors font-mono"
              >
                <span>Full Daily Plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {isLoading ? (
              <TaskListSkeleton />
            ) : todayTasks.length > 0 || overdueTasks.length > 0 ? (
              <div className="space-y-3">
                {/* Overdue alert if any */}
                {overdueTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onOpenDetails={setSelectedTask}
                    onEdit={openEditTask}
                  />
                ))}

                {/* Scheduled for today */}
                {todayTasks
                  .filter((t) => !overdueTasks.some((o) => o.id === t.id))
                  .map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onOpenDetails={setSelectedTask}
                      onEdit={openEditTask}
                    />
                  ))}
              </div>
            ) : (
              <EmptyState
                title="No tasks scheduled for today"
                description="Your executive schedule for today is open. Add a priority item or command LifePilot to generate a schedule."
                actionLabel="Create Task"
                onAction={openCreateTask}
              />
            )}
          </div>

          {/* Quick Goals Breakdown */}
          {goals.length > 0 && (
            <div className="p-6 rounded-2xl border border-obsidian-border bg-obsidian-surface shadow-card">
              <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-obsidian-border">
                <h3 className="text-base font-display font-medium text-ivory flex items-center gap-2">
                  <Target className="w-4 h-4 text-gold stroke-[1.75]" />
                  Active Milestone Trajectory
                </h3>
                <button
                  onClick={() => navigate("/goals")}
                  className="text-xs font-semibold text-gold hover:text-ivory flex items-center gap-1 font-mono transition-colors"
                >
                  <span>All Goals</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {goals.slice(0, 4).map((g, i) => (
                  <div
                    key={i}
                    onClick={() => navigate("/goals")}
                    className="p-4 rounded-xl border border-obsidian-border/80 bg-obsidian-raised/60 hover:border-gold/30 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs sm:text-sm font-semibold text-ivory truncate">
                        {g.goal}
                      </h4>
                      <span className="text-xs font-mono font-bold text-gold">
                        {g.progressPercentage}%
                      </span>
                    </div>

                    <div className="w-full h-1.5 bg-obsidian-deep rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-gold rounded-full transition-all duration-300"
                        style={{ width: `${g.progressPercentage}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[10px] font-mono text-slate">
                      <span>{g.completedTasks}/{g.totalTasks} tasks</span>
                      <span>{g.completedSubtasks}/{g.totalSubtasks} subtasks</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Workload & Productivity Chart */}
        <div className="space-y-6">
          {/* Priority Breakdown Chart */}
          <div className="p-6 rounded-2xl border border-obsidian-border bg-obsidian-surface shadow-card flex flex-col">
            <h3 className="text-base font-display font-medium text-ivory mb-0.5">
              Urgency Distribution
            </h3>
            <p className="text-[11px] text-slate mb-4 font-mono">
              Task density across priority tiers
            </p>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityChartData}>
                  <XAxis
                    dataKey="name"
                    stroke="#89928D"
                    fontSize={10}
                    fontFamily="IBM Plex Mono"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#89928D"
                    fontSize={10}
                    fontFamily="IBM Plex Mono"
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#141C1A",
                      borderColor: "rgba(182, 154, 98, 0.25)",
                      borderRadius: "0.75rem",
                      fontSize: "11px",
                      fontFamily: "IBM Plex Mono",
                      color: "#F0EEE5",
                      boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {priorityChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Warm Ivory High-Priority Executive Briefing Card */}
          <div className="p-6 rounded-2xl bg-ivory text-obsidian border border-gold/30 shadow-luxury relative overflow-hidden">
            <div className="flex items-center gap-2 mb-3">
              <BrandMark size={24} />
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-teal">
                Executive Briefing
              </span>
            </div>

            <p className="text-xs sm:text-sm text-obsidian leading-relaxed font-medium">
              {overdueTasks.length > 0
                ? `You have ${overdueTasks.length} overdue task(s). The Grounded Planner will place these in Session 1 to clear cognitive overhead.`
                : pendingTasks.length > 0
                ? `You have ${pendingTasks.length} pending commitments. Allocate a 4-hour focus block to finalize top high-priority deliverables.`
                : "All commitments are up to date. Direct LifePilot to draft your next roadmap or learning milestone."}
            </p>

            <button
              onClick={() => navigate("/assistant")}
              className="mt-5 px-4 py-2 rounded-xl bg-teal text-ivory hover:bg-teal-subtle text-xs font-semibold transition-all flex items-center gap-2 shadow-subtle"
            >
              <span>Consult Concierge</span>
              <ArrowRight className="w-3.5 h-3.5 text-gold" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
