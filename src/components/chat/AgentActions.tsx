"use client";

import { useMemo } from "react";
import { useAgentStore, type AgentAction } from "@/stores/agentStore";
import { usePlanStore } from "@/stores/planStore";
import {
  Brain,
  Search,
  CheckCircle2,
  FileText,
  AlertCircle,
  Loader2,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/cn";

function ActionIcon({ type, status }: { type: AgentAction["type"]; status: AgentAction["status"] }) {
  if (status === "running") {
    return <Loader2 className="h-3.5 w-3.5 animate-spin text-sage-600" />;
  }

  switch (type) {
    case "thinking":
      return <Brain className="h-3.5 w-3.5 text-sage-500" />;
    case "searching":
      return <Search className="h-3.5 w-3.5 text-sage-500" />;
    case "writing":
      return <FileText className="h-3.5 w-3.5 text-sage-500" />;
    case "complete":
      return <CheckCircle2 className="h-3.5 w-3.5 text-sage-500" />;
    case "error":
      return <AlertCircle className="h-3.5 w-3.5 text-grey-400" />;
    default:
      return <Sparkles className="h-3.5 w-3.5 text-sage-500" />;
  }
}

function StepCard({
  stepIndex,
  stepContent,
  actions,
  isCurrentStep,
  isCompleted,
}: {
  stepIndex: number;
  stepContent: string;
  actions: AgentAction[];
  isCurrentStep: boolean;
  isCompleted: boolean;
}) {
  const hasError = actions.some((a) => a.status === "error");

  return (
    <div
      className={cn(
        "rounded-xl border overflow-hidden transition-all",
        isCurrentStep && !isCompleted && "border-sage-300 bg-sage-50/50 shadow-sm",
        isCompleted && !hasError && "border-sage-200 bg-white",
        hasError && "border-grey-300 bg-grey-50",
        !isCurrentStep && !isCompleted && "border-grey-200 bg-white opacity-60"
      )}
    >
      {/* Step Header */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 border-b",
          isCurrentStep && !isCompleted && "border-sage-200 bg-sage-100/50",
          isCompleted && "border-grey-100 bg-grey-50",
          hasError && "border-grey-200 bg-grey-100"
        )}
      >
        {/* Step Number */}
        <div
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold flex-shrink-0",
            isCompleted && !hasError && "bg-sage-500 text-white",
            isCurrentStep && !isCompleted && "bg-sage-500 text-white",
            hasError && "bg-grey-400 text-white",
            !isCurrentStep && !isCompleted && "bg-grey-200 text-grey-500"
          )}
        >
          {isCompleted && !hasError ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : isCurrentStep && !isCompleted ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            stepIndex + 1
          )}
        </div>

        {/* Step Title */}
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-sm font-medium truncate",
              isCompleted && "text-grey-700",
              isCurrentStep && !isCompleted && "text-sage-900",
              hasError && "text-grey-600",
              !isCurrentStep && !isCompleted && "text-grey-500"
            )}
          >
            Step {stepIndex + 1}
          </p>
          <p className="text-xs text-grey-500 truncate">{stepContent}</p>
        </div>

        {/* Status Badge */}
        {isCompleted && !hasError && (
          <span className="flex-shrink-0 rounded-full bg-sage-100 px-2 py-0.5 text-xs font-medium text-sage-700">
            Done
          </span>
        )}
        {isCurrentStep && !isCompleted && (
          <span className="flex-shrink-0 rounded-full bg-sage-200 px-2 py-0.5 text-xs font-medium text-sage-800 animate-pulse">
            Running
          </span>
        )}
        {hasError && (
          <span className="flex-shrink-0 rounded-full bg-grey-200 px-2 py-0.5 text-xs font-medium text-grey-600">
            Error
          </span>
        )}
      </div>

      {/* Actions List */}
      {actions.length > 0 && (
        <div className="px-4 py-3 space-y-2">
          {actions.map((action) => (
            <div
              key={action.id}
              className={cn(
                "flex items-center gap-2 text-xs",
                action.status === "running" && "text-sage-700",
                action.status === "completed" && "text-grey-600",
                action.status === "error" && "text-grey-500"
              )}
            >
              <ActionIcon type={action.type} status={action.status} />
              <span className="truncate">{action.label}</span>
              {action.type === "complete" && action.status === "completed" && (
                <CheckCircle2 className="h-3 w-3 text-sage-500 ml-auto flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
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
        {actions.slice(-5).map((action) => (
          <div
            key={action.id}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium",
              action.status === "running" && "bg-sage-100 text-sage-700 animate-pulse",
              action.status === "completed" && "bg-grey-100 text-grey-600",
              action.status === "error" && "bg-grey-200 text-grey-500"
            )}
          >
            <ActionIcon type={action.type} status={action.status} />
            <span className="max-w-[200px] truncate">{action.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AgentActionsList() {
  const { actions, isExecuting, currentStepIndex, stepContents } = useAgentStore();
  const { currentPlan } = usePlanStore();

  // Group actions by step
  const stepGroups = useMemo(() => {
    const groups: Map<number, AgentAction[]> = new Map();

    actions.forEach((action) => {
      const existing = groups.get(action.stepIndex) || [];
      groups.set(action.stepIndex, [...existing, action]);
    });

    return groups;
  }, [actions]);

  // Get step contents from plan or stored contents
  const getStepContent = (index: number) => {
    if (currentPlan?.steps[index]) {
      return currentPlan.steps[index].content;
    }
    if (stepContents[index]) {
      return stepContents[index];
    }
    return `Step ${index + 1}`;
  };

  // Determine which steps to show
  const stepsToShow = useMemo(() => {
    const maxStep = Math.max(...Array.from(stepGroups.keys()), currentStepIndex);
    const steps: number[] = [];
    for (let i = 0; i <= maxStep; i++) {
      steps.push(i);
    }
    return steps;
  }, [stepGroups, currentStepIndex]);

  if (actions.length === 0 && !isExecuting) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-grey-100">
        <Sparkles className="h-4 w-4 text-sage-600" />
        <span className="text-sm font-medium text-grey-900">Agent Activity</span>
        {isExecuting && (
          <span className="ml-auto text-xs text-sage-600 flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Working...
          </span>
        )}
      </div>

      {/* Step Cards */}
      <div className="space-y-2">
        {stepsToShow.map((stepIndex) => {
          const stepActions = stepGroups.get(stepIndex) || [];
          const isCurrentStep = stepIndex === currentStepIndex && isExecuting;
          const isCompleted = stepActions.some((a) => a.type === "complete" && a.status === "completed");

          return (
            <StepCard
              key={stepIndex}
              stepIndex={stepIndex}
              stepContent={getStepContent(stepIndex)}
              actions={stepActions}
              isCurrentStep={isCurrentStep}
              isCompleted={isCompleted}
            />
          );
        })}
      </div>

      {/* Summary */}
      {!isExecuting && actions.length > 0 && (
        <div className="flex items-center justify-between pt-2 border-t border-grey-100 text-xs text-grey-500">
          <span>
            {stepsToShow.filter((i) => {
              const stepActions = stepGroups.get(i) || [];
              return stepActions.some((a) => a.type === "complete" && a.status === "completed");
            }).length}{" "}
            of {stepsToShow.length} steps completed
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-sage-500" />
            Execution finished
          </span>
        </div>
      )}
    </div>
  );
}
