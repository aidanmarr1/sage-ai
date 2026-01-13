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

function ActionPill({ action }: { action: AgentAction }) {
  const getIcon = () => {
    switch (action.type) {
      case "thinking":
        return <Brain className="h-3.5 w-3.5" />;
      case "searching":
        return <Search className="h-3.5 w-3.5" />;
      case "writing":
        return <FileText className="h-3.5 w-3.5" />;
      case "complete":
        return <CheckCircle2 className="h-3.5 w-3.5" />;
      case "error":
        return <AlertCircle className="h-3.5 w-3.5" />;
      default:
        return <Brain className="h-3.5 w-3.5" />;
    }
  };

  const isRunning = action.status === "running";
  const isError = action.status === "error";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
        isRunning && "bg-sage-100 text-sage-700 animate-pulse",
        action.status === "completed" && "bg-grey-100 text-grey-600",
        isError && "bg-grey-200 text-grey-500"
      )}
    >
      {isRunning ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        getIcon()
      )}
      <span>{action.label}</span>
      {action.detail && (
        <span className="text-grey-400">· {action.detail}</span>
      )}
    </div>
  );
}

export function AgentActions() {
  const { actions, isExecuting, currentStepIndex } = useAgentStore();

  if (actions.length === 0 && !isExecuting) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 py-4">
      {isExecuting && (
        <div className="flex items-center gap-2 text-sm text-sage-600 font-medium mb-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Executing Step {currentStepIndex + 1}...</span>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <ActionPill key={action.id} action={action} />
        ))}
      </div>
    </div>
  );
}

export function AgentActionsList() {
  const { actions } = useAgentStore();

  if (actions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1.5 py-2">
      {actions.map((action, index) => (
        <div
          key={action.id}
          className={cn(
            "flex items-center gap-2 text-sm",
            action.status === "running" && "text-sage-700",
            action.status === "completed" && "text-grey-500",
            action.status === "error" && "text-grey-400"
          )}
          style={{
            animationDelay: `${index * 100}ms`,
          }}
        >
          {action.status === "running" ? (
            <Loader2 className="h-4 w-4 animate-spin text-sage-500" />
          ) : action.status === "completed" ? (
            <CheckCircle2 className="h-4 w-4 text-sage-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-grey-400" />
          )}
          <span>{action.label}</span>
        </div>
      ))}
    </div>
  );
}
