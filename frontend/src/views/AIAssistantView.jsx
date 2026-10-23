import React from "react";
import { useSearchParams } from "react-router-dom";
import { AIChatPanel } from "../components/chat/AIChatPanel.jsx";

export function AIAssistantView() {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  return (
    <div className="h-[calc(100vh-6.5rem)] max-w-5xl mx-auto flex flex-col pb-4">
      <AIChatPanel initialQuery={initialQuery} />
    </div>
  );
}
