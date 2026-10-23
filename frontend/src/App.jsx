import React, { useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AppSidebar } from "./components/common/AppSidebar.jsx";
import { AppHeader } from "./components/common/AppHeader.jsx";
import { TaskFormModal } from "./components/tasks/TaskFormModal.jsx";
import { TaskDetailsDrawer } from "./components/tasks/TaskDetailsDrawer.jsx";

import { DashboardView } from "./views/DashboardView.jsx";
import { TasksView } from "./views/TasksView.jsx";
import { PlannerView } from "./views/PlannerView.jsx";
import { GoalsView } from "./views/GoalsView.jsx";
import { AIAssistantView } from "./views/AIAssistantView.jsx";
import { SettingsView } from "./views/SettingsView.jsx";
import { LandingView } from "./views/LandingView.jsx";

export function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // If on the public marketing landing page, render standalone view without app shell
  const isLandingPage = location.pathname === "/landing";

  if (isLandingPage) {
    return <LandingView />;
  }

  return (
    <div className="flex h-screen bg-canvas text-text-primary overflow-hidden">
      {/* App Sidebar */}
      <AppSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Sticky Header */}
        <AppHeader onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
          <Routes>
            <Route path="/" element={<DashboardView />} />
            <Route path="/tasks" element={<TasksView />} />
            <Route path="/planner" element={<PlannerView />} />
            <Route path="/goals" element={<GoalsView />} />
            <Route path="/assistant" element={<AIAssistantView />} />
            <Route path="/settings" element={<SettingsView />} />
          </Routes>
        </main>
      </div>

      {/* Global Modals & Drawers */}
      <TaskFormModal />
      <TaskDetailsDrawer />
    </div>
  );
}

export default App;
