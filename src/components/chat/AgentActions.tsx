"use client";

import { useAgentStore, type AgentAction } from "@/stores/agentStore";
import {
  Brain,
  Search,
  CheckCircle2,
  FileText,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/cn";

function ActionIcon({ type, status }: { type: AgentAction["type"]; status: AgentAction["status"] }) {
  if (status === "running") {
    return <Loader2 className="h-3.5 w-3.5 animate-spin" />;
  }

  switch (type) {
    case "thinking":
      return <Brain className="h-3.5 w-3.5" />;
    case "searching":
      return <Search className="h-3.5 w-3.5" />;
    case "search_complete":
      return <CheckCircle2 className="h-3.5 w-3.5" />;
    case "writing":
      return <FileText className="h-3.5 w-3.5" />;
    case "complete":
      return <CheckCircle2 className="h-3.5 w-3.5" />;
    case "error":
      return <AlertCircle className="h-3.5 w-3.5" />;
    default:
      return <Brain className="h-3.5 w-3.5" />;
  }
}

export function AgentActions() {
  const { actions, isExecuting, currentStepIndex, stepContents } = useAgentStore();

  if (actions.length === 0 && !isExecuting) {
    return null;
  }

  // Get current step content
  const currentStepContent = stepContents[currentStepIndex] || `Step ${currentStepIndex + 1}`;

  return (
    <div className="flex flex-col gap-3 py-4">
      {/* Current step indicator */}
      {isExecuting && (
        <div className="text-sm font-medium text-grey-700">
          Step {currentStepIndex + 1}: {currentStepContent}
        </div>
      )}

      {/* Action pills - simple flowing layout */}
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <div
            key={action.id}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
              action.status === "running" && "bg-sage-100 text-sage-700 animate-pulse",
              action.status === "completed" && "bg-grey-100 text-grey-600",
              action.status === "error" && "bg-grey-200 text-grey-500"
            )}
          >
            <ActionIcon type={action.type} status={action.status} />
            <span className="max-w-[250px] truncate">{action.label}</span>
          </div>
        ))}
      </div>

      {/* Completion indicator */}
      {!isExecuting && actions.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-grey-500">
          <CheckCircle2 className="h-3.5 w-3.5 text-sage-500" />
          <span>Execution complete</span>
        </div>
      )}
    </div>
  );
}
