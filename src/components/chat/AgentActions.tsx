"use client";

import { useMemo } from "react";
import { useAgentStore, type AgentAction } from "@/stores/agentStore";
import {
  Brain,
  Search,
  CheckCircle2,
  FileText,
  AlertCircle,
  Loader2,
  Sparkles,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/cn";

function ActionIcon({ type, status }: { type: AgentAction["type"]; status: AgentAction["status"] }) {
  const baseClass = "h-4 w-4 flex-shrink-0";

  if (status === "running") {
    return <Loader2 className={cn(baseClass, "animate-spin text-sage-600")} />;
  }

  switch (type) {
    case "thinking":
      return <Brain className={cn(baseClass, "text-sage-500")} />;
    case "searching":
      return <Search className={cn(baseClass, "text-sage-500")} />;
    case "search_complete":
      return <CheckCircle2 className={cn(baseClass, "text-sage-500")} />;
    case "browsing":
      return <Globe className={cn(baseClass, "text-sage-600")} />;
    case "writing":
      return <FileText className={cn(baseClass, "text-sage-500")} />;
    case "synthesizing":
      return <Sparkles className={cn(baseClass, "text-sage-600")} />;
    case "complete":
      return <CheckCircle2 className={cn(baseClass, "text-sage-600")} />;
    case "error":
      return <AlertCircle className={cn(baseClass, "text-grey-400")} />;
    default:
      return <Brain className={cn(baseClass, "text-sage-500")} />;
  }
}

export function AgentActions() {
  const { actions, isExecuting, currentStepIndex, stepContents } = useAgentStore();

  // Group actions by step
  const groupedActions = useMemo(() => {
    const groups: Map<number, AgentAction[]> = new Map();

    actions.forEach((action) => {
      const stepIdx = action.stepIndex;
      if (!groups.has(stepIdx)) {
        groups.set(stepIdx, []);
      }
      groups.get(stepIdx)!.push(action);
    });

    return groups;
  }, [actions]);

  // Get all step indices that have actions
  const stepIndices = useMemo(() => {
    return Array.from(groupedActions.keys()).sort((a, b) => a - b);
  }, [groupedActions]);

  if (actions.length === 0 && !isExecuting) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 py-4">
      {stepIndices.map((stepIdx) => {
        const stepActions = groupedActions.get(stepIdx) || [];
        const stepContent = stepContents[stepIdx] || `Step ${stepIdx + 1}`;
        const isCurrentStep = stepIdx === currentStepIndex && isExecuting;
        const isStepComplete = stepActions.some(a => a.type === "complete" && a.status === "completed");

        return (
          <div key={stepIdx} className="flex flex-col gap-2">
            {/* Step Header */}
            <div className={cn(
              "flex items-center gap-2 text-sm font-medium",
              isCurrentStep ? "text-sage-700" : "text-grey-600"
            )}>
              <div className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                isStepComplete ? "bg-sage-500 text-white" :
                isCurrentStep ? "bg-sage-100 text-sage-700" :
                "bg-grey-100 text-grey-500"
              )}>
                {isStepComplete ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : isCurrentStep ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  stepIdx + 1
                )}
              </div>
              <span className="line-clamp-1">{stepContent}</span>
            </div>

            {/* Actions for this step - vertical list */}
            <div className="ml-8 flex flex-col gap-1 border-l-2 border-grey-100 pl-4">
              {stepActions.map((action, idx) => {
                // Skip duplicate completed actions (keep only the latest state)
                const isDuplicate = stepActions.findIndex(
                  a => a.type === action.type && a.label === action.label
                ) !== idx && action.status === "running";

                if (isDuplicate) return null;

                return (
                  <div
                    key={action.id}
                    className={cn(
                      "flex items-center gap-2 py-1 text-sm transition-all",
                      action.status === "running" && "text-sage-700",
                      action.status === "completed" && "text-grey-500",
                      action.status === "error" && "text-grey-400"
                    )}
                  >
                    <ActionIcon type={action.type} status={action.status} />
                    <span className="line-clamp-1">{action.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Overall completion */}
      {!isExecuting && actions.length > 0 && (
        <div className="flex items-center gap-2 pt-2 border-t border-grey-100 text-sm text-sage-600">
          <CheckCircle2 className="h-4 w-4" />
          <span>Research complete</span>
        </div>
      )}
    </div>
  );
}
