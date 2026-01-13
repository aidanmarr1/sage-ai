"use client";

import { useState, useEffect, useMemo } from "react";
import { usePlanStore } from "@/stores/planStore";
import { useAgentStore } from "@/stores/agentStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { cn } from "@/lib/cn";
import {
  ClipboardList,
  Circle,
  CheckCircle2,
  Loader2,
  Sparkles,
  Play,
  Pause,
} from "lucide-react";
import { Confetti } from "@/components/ui";

export function PlanPanel() {
  const { currentPlan, isGenerating, updateStepStatus } = usePlanStore();
  const [showConfetti, setShowConfetti] = useState(false);
  const { isExecuting, setExecuting, setCurrentStepIndex, setStepContents, addAction, completeAction, appendFindings, setLatestSearchResults, setBrowserState, clearActions, reset } = useAgentStore();
  const { setActiveTab } = useWorkspaceStore();

  // Memoized calculations
  const completedCount = useMemo(
    () => currentPlan?.steps.filter((s) => s.status === "completed").length ?? 0,
    [currentPlan?.steps]
  );
  const totalSteps = currentPlan?.steps.length ?? 0;
  const progressPercent = useMemo(
    () => (totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0),
    [completedCount, totalSteps]
  );

  const executeStep = async (stepIndex: number, stepContent: string, taskContext: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const currentFindings = useAgentStore.getState().findings;

      fetch("/api/agent/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: stepContent,
          stepIndex,
          taskContext,
          currentFindings,
        }),
      }).then(async (response) => {
        if (!response.ok || !response.body) {
          resolve(false);
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value);
          const lines = text.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const event = JSON.parse(line.slice(6));

                if (event.type === "action") {
                  // Add or update action in store
                  addAction({
                    type: event.data.type,
                    label: event.data.label,
                    status: event.data.status,
                  });
                } else if (event.type === "searchResults") {
                  // Update search results for ComputerPanel
                  setLatestSearchResults(event.data);
                } else if (event.type === "browserState") {
                  // Update browser state for ComputerPanel
                  setBrowserState(event.data);
                } else if (event.type === "findings") {
                  // Append findings
                  appendFindings(event.data);
                } else if (event.type === "done") {
                  resolve(true);
                  return;
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        }

        resolve(true);
      }).catch(() => {
        resolve(false);
      });
    });
  };

  const handleExecute = async () => {
    if (!currentPlan || isExecuting) return;

    // Reset and start execution
    reset();
    setExecuting(true);

    // Switch to computer tab to show live search results
    setActiveTab("computer");

    // Store step contents for display
    setStepContents(currentPlan.steps.map((s) => s.content));

    try {
      let allStepsSucceeded = true;
      for (let i = 0; i < currentPlan.steps.length; i++) {
        const step = currentPlan.steps[i];
        setCurrentStepIndex(i);
        updateStepStatus(step.id, "in_progress");

        const success = await executeStep(i, step.content, currentPlan.title);

        if (success) {
          updateStepStatus(step.id, "completed");
        } else {
          addAction({
            type: "error",
            label: `Step ${i + 1} failed`,
            status: "error",
          });
          updateStepStatus(step.id, "pending");
          allStepsSucceeded = false;
          break;
        }
      }

      // If all steps succeeded, synthesize findings into final report
      if (allStepsSucceeded) {
        const findings = useAgentStore.getState().findings;

        if (findings) {
          // Move to synthesis step
          setCurrentStepIndex(currentPlan.steps.length);
          setStepContents([...currentPlan.steps.map((s) => s.content), "Synthesizing final report"]);

          addAction({
            type: "synthesizing",
            label: "Creating polished report...",
            status: "running",
          });

          try {
            const response = await fetch("/api/agent/synthesize", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                findings,
                taskContext: currentPlan.title,
              }),
            });

            if (response.ok && response.body) {
              const reader = response.body.getReader();
              const decoder = new TextDecoder();

              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const text = decoder.decode(value);
                const lines = text.split("\n");

                for (const line of lines) {
                  if (line.startsWith("data: ")) {
                    try {
                      const event = JSON.parse(line.slice(6));
                      if (event.type === "content") {
                        useAgentStore.getState().appendFinalReport(event.data);
                      } else if (event.type === "done") {
                        addAction({
                          type: "synthesizing",
                          label: "Report ready",
                          status: "completed",
                        });
                      }
                    } catch {
                      // Ignore parse errors
                    }
                  }
                }
              }
            }
          } catch (error) {
            console.error("Synthesis error:", error);
            addAction({
              type: "error",
              label: "Failed to synthesize report",
              status: "error",
            });
          }
        }
      }

      // Switch to findings tab when done
      setActiveTab("findings");

      // Show confetti on successful completion
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);

    } finally {
      setExecuting(false);
    }
  };

  if (isGenerating) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-grey-50 via-white to-grey-50 p-8">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-sage-500 to-sage-600 shadow-xl shadow-sage-500/25">
              <Loader2 className="h-10 w-10 animate-spin text-white" />
            </div>
          </div>
          <h3 className="font-serif text-2xl font-semibold text-grey-900">
            Creating Plan...
          </h3>
          <p className="mt-2 max-w-xs text-sm text-grey-500">
            Analyzing your request and generating a step-by-step plan.
          </p>
        </div>
      </div>
    );
  }

  if (!currentPlan) {
    return (
      <div className="relative flex h-full flex-col overflow-hidden bg-gradient-to-br from-grey-50 via-white to-grey-50">
        {/* Decorative background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-sage-100/30 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-sage-100/30 blur-3xl" />
        </div>

        <div className="relative flex flex-1 items-center justify-center p-8">
          <div className="flex flex-col items-center text-center">
            <div className="group relative mb-6">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-sage-200/50 to-sage-300/30 opacity-0 blur-xl transition-all duration-700 group-hover:opacity-100" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-sage-500 to-sage-600 shadow-2xl shadow-sage-500/25 transition-all duration-500 group-hover:scale-105">
                <ClipboardList className="h-12 w-12 text-white" />
              </div>
            </div>

            <h3 className="font-serif text-2xl font-semibold text-grey-900">
              No Active Plan
            </h3>
            <p className="mt-2 max-w-xs text-sm text-grey-500">
              Start a conversation with Sage to create a plan for your task.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              {["Task breakdown", "Step tracking", "Progress view"].map(
                (feature) => (
                  <span
                    key={feature}
                    className="rounded-full border border-grey-200 bg-white px-3 py-1.5 text-xs font-medium text-grey-500 shadow-sm"
                  >
                    {feature}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      {/* Confetti celebration */}
      <Confetti isActive={showConfetti} />

      {/* Header */}
      <div className="relative flex items-center justify-between border-b border-grey-100 bg-gradient-to-r from-sage-50 to-white px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sage-500 to-sage-600 shadow-md shadow-sage-500/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-semibold text-grey-900">
              Plan
            </h2>
            <p className="text-xs text-grey-500">
              {currentPlan.steps.length} steps
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {currentPlan.status === "ready" && !isExecuting && (
            <button
              onClick={handleExecute}
              className="flex items-center gap-2 rounded-full bg-sage-500 px-4 py-1.5 text-xs font-medium text-white shadow-md shadow-sage-500/20 transition-all hover:bg-sage-600 hover:shadow-lg"
            >
              <Play className="h-3.5 w-3.5" />
              Execute
            </button>
          )}
          {isExecuting && (
            <div className="flex items-center gap-2 rounded-full bg-sage-100 px-4 py-1.5 text-xs font-medium text-sage-700">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Executing...
            </div>
          )}
          {currentPlan.status === "completed" && !isExecuting && (
            <span className="rounded-full bg-sage-100 px-3 py-1 text-xs font-medium text-sage-700">
              Completed
            </span>
          )}
        </div>
      </div>

      {/* Overview */}
      <div className="border-b border-grey-100 bg-grey-50/50 px-6 py-4">
        <p className="text-sm leading-relaxed text-grey-700">
          {currentPlan.overview}
        </p>
      </div>

      {/* Steps */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="space-y-3">
          {currentPlan.steps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                "group flex gap-4 rounded-xl border p-4 transition-all animate-fade-in-up",
                step.status === "completed"
                  ? "border-sage-200 bg-sage-50/50"
                  : step.status === "in_progress"
                  ? "border-sage-300 bg-sage-50 shadow-sm ring-1 ring-sage-200"
                  : "border-grey-200 bg-white hover:border-grey-300 hover:shadow-sm"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Step number / status */}
              <div className="flex-shrink-0">
                {step.status === "completed" ? (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sage-500 text-white">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                ) : step.status === "in_progress" ? (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sage-500 text-white">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-grey-300 bg-white text-sm font-semibold text-grey-500">
                    {index + 1}
                  </div>
                )}
              </div>

              {/* Step content */}
              <div className="flex-1 pt-1">
                <p
                  className={cn(
                    "text-sm leading-relaxed",
                    step.status === "completed"
                      ? "text-grey-600"
                      : "text-grey-800"
                  )}
                >
                  {step.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer with progress bar */}
      <div className="border-t border-grey-200 bg-white px-6 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Circle className="h-2.5 w-2.5 fill-sage-500 text-sage-500" />
            <span className="text-xs text-grey-500">
              {completedCount} of {totalSteps} completed
            </span>
          </div>
          <span className="text-xs font-medium text-sage-600">
            {progressPercent}%
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-grey-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sage-400 to-sage-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
