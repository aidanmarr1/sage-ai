"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
  RotateCcw,
  Clock,
  Pause,
  XCircle,
  SkipForward,
  Edit2,
  Trash2,
  Plus,
  CircleDashed,
  AlertCircle,
  Brain,
  Check,
  X,
  Timer,
  TrendingUp,
  Pencil,
} from "lucide-react";
import { Confetti } from "@/components/ui";
import { ReasoningPanel } from "@/components/workspace/ReasoningPanel";

export function PlanPanel() {
  const {
    currentPlan,
    isGenerating,
    pendingModifications,
    updateStepStatus,
    clearPlan,
    addStep,
    removeStep,
    updateStepContent,
    toggleOptional,
    setStepEditing,
    setStepError,
    clearStepError,
    resetAllSteps,
    skipRemainingSteps,
    addPendingModification,
    approveModification,
    rejectModification,
    clearPendingModifications,
  } = usePlanStore();

  const {
    isExecuting,
    executionStatus,
    pauseRequested,
    cancelRequested,
    currentReasoning,
    stepTimings,
    estimatedCompletion,
    addReasoningEntry,
    setExecuting,
    setExecutionStatus,
    pauseExecution,
    resumeExecution,
    cancelExecution,
    setCurrentStepIndex,
    setStepContents,
    addAction,
    appendFindings,
    setLatestSearchResults,
    setBrowserState,
    startStepTiming,
    endStepTiming,
    updateStepIterations,
    setEstimatedCompletion,
    reset,
  } = useAgentStore();

  const { setActiveTab } = useWorkspaceStore();

  const [showConfetti, setShowConfetti] = useState(false);
  const [executionStartTime, setExecutionStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [editingContent, setEditingContent] = useState<Record<string, string>>({});
  const [newStepContent, setNewStepContent] = useState("");
  const [showAddStep, setShowAddStep] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Update elapsed time every second while executing
  useEffect(() => {
    if (!isExecuting || !executionStartTime) {
      return;
    }

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - executionStartTime.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [isExecuting, executionStartTime]);

  // Format elapsed time as mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Memoized calculations
  const completedCount = useMemo(
    () => currentPlan?.steps.filter((s) => s.status === "completed").length ?? 0,
    [currentPlan?.steps]
  );
  const skippedCount = useMemo(
    () => currentPlan?.steps.filter((s) => s.status === "skipped").length ?? 0,
    [currentPlan?.steps]
  );
  const failedCount = useMemo(
    () => currentPlan?.steps.filter((s) => s.status === "failed").length ?? 0,
    [currentPlan?.steps]
  );
  const totalSteps = currentPlan?.steps.length ?? 0;
  const effectiveTotal = totalSteps - skippedCount;
  const progressPercent = useMemo(
    () => (effectiveTotal > 0 ? Math.round((completedCount / effectiveTotal) * 100) : 0),
    [completedCount, effectiveTotal]
  );

  const executeStep = async (stepIndex: number, stepContent: string, taskContext: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const currentFindings = useAgentStore.getState().findings;

      // Create abort controller for this step
      abortControllerRef.current = new AbortController();

      fetch("/api/agent/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: stepContent,
          stepIndex,
          taskContext,
          currentFindings,
        }),
        signal: abortControllerRef.current.signal,
      }).then(async (response) => {
        if (!response.ok || !response.body) {
          resolve(false);
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          // Check for pause/cancel requests
          const state = useAgentStore.getState();
          if (state.cancelRequested) {
            reader.cancel();
            resolve(false);
            return;
          }

          // If paused, wait until resumed or cancelled
          if (state.pauseRequested) {
            await new Promise<void>((resumeResolve) => {
              const checkInterval = setInterval(() => {
                const currentState = useAgentStore.getState();
                if (!currentState.pauseRequested || currentState.cancelRequested) {
                  clearInterval(checkInterval);
                  resumeResolve();
                }
              }, 100);
            });

            // Check again if cancelled during pause
            if (useAgentStore.getState().cancelRequested) {
              reader.cancel();
              resolve(false);
              return;
            }
          }

          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value);
          const lines = text.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const event = JSON.parse(line.slice(6));

                if (event.type === "action") {
                  addAction({
                    type: event.data.type,
                    label: event.data.label,
                    status: event.data.status,
                  });
                  // Track iterations
                  updateStepIterations(stepIndex);
                } else if (event.type === "searchResults") {
                  setLatestSearchResults(event.data);
                } else if (event.type === "browserState") {
                  setBrowserState(event.data);
                } else if (event.type === "findings") {
                  appendFindings(event.data);
                } else if (event.type === "reasoning") {
                  const data = event.data;
                  useAgentStore.getState().setCurrentReasoning(data.nextAction || data);
                  // Store full reasoning entry if structured
                  if (data.observation || data.analysis) {
                    addReasoningEntry({
                      observation: data.observation || "",
                      analysis: data.analysis || "",
                      hypothesis: data.hypothesis,
                      nextAction: data.nextAction || "",
                      alternatives: data.alternatives,
                    });
                  }
                } else if (event.type === "planModification") {
                  // Handle plan modification from agent
                  addPendingModification({
                    action: event.data.action,
                    reason: event.data.reason,
                    newContent: event.data.newContent,
                    stepIndex: event.data.stepIndex,
                  });
                } else if (event.type === "completionStatus") {
                  // Could update UI with completion progress
                } else if (event.type === "done") {
                  resolve(true);
                  return;
                } else if (event.type === "error") {
                  resolve(false);
                  return;
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        }

        resolve(true);
      }).catch((err) => {
        if (err.name === 'AbortError') {
          resolve(false);
        } else {
          resolve(false);
        }
      });
    });
  };

  const handleRestart = () => {
    if (!currentPlan) return;
    resetAllSteps();
    reset();
    setElapsedTime(0);
    setExecutionStartTime(null);
  };

  const handlePause = () => {
    pauseExecution();
  };

  const handleResume = () => {
    resumeExecution();
  };

  const handleCancel = () => {
    cancelExecution();
    abortControllerRef.current?.abort();
    skipRemainingSteps();
    setExecuting(false);
  };

  const handleRetryStep = async (stepIndex: number) => {
    if (!currentPlan) return;

    const step = currentPlan.steps[stepIndex];
    clearStepError(step.id);
    updateStepStatus(step.id, "in_progress");

    setExecuting(true);
    setCurrentStepIndex(stepIndex);

    const success = await executeStep(stepIndex, step.content, currentPlan.title);

    if (success) {
      updateStepStatus(step.id, "completed");
    } else {
      setStepError(step.id, "Step failed after retry");
    }

    setExecuting(false);
  };

  const handleSkipStep = (stepId: string) => {
    updateStepStatus(stepId, "skipped");
  };

  const handleStartEditing = (stepId: string, content: string) => {
    setEditingContent({ ...editingContent, [stepId]: content });
    setStepEditing(stepId, true);
  };

  const handleSaveEdit = (stepId: string) => {
    const content = editingContent[stepId];
    if (content?.trim()) {
      updateStepContent(stepId, content.trim());
    } else {
      setStepEditing(stepId, false);
    }
    const { [stepId]: removed, ...rest } = editingContent;
    setEditingContent(rest);
  };

  const handleCancelEdit = (stepId: string) => {
    setStepEditing(stepId, false);
    const { [stepId]: removed, ...rest } = editingContent;
    setEditingContent(rest);
  };

  const handleAddStep = (afterStepId: string | null) => {
    if (newStepContent.trim()) {
      addStep(afterStepId, newStepContent.trim());
      setNewStepContent("");
      setShowAddStep(null);
    }
  };

  const handleExecute = async () => {
    if (!currentPlan || isExecuting) return;

    // Reset and start execution
    reset();
    setExecuting(true);
    setExecutionStatus("running");
    setExecutionStartTime(new Date());
    setElapsedTime(0);

    // Switch to computer tab to show live search results
    setActiveTab("computer");

    // Store step contents for display
    setStepContents(currentPlan.steps.map((s) => s.content));

    try {
      let allStepsSucceeded = true;
      for (let i = 0; i < currentPlan.steps.length; i++) {
        // Check for cancellation
        if (useAgentStore.getState().cancelRequested) {
          allStepsSucceeded = false;
          break;
        }

        const step = currentPlan.steps[i];

        // Skip optional steps if they're marked as skipped, or skip failed/skipped steps on retry
        if (step.status === "skipped") {
          continue;
        }

        setCurrentStepIndex(i);
        updateStepStatus(step.id, "in_progress");
        startStepTiming(i);

        const success = await executeStep(i, step.content, currentPlan.title);
        endStepTiming(i);

        // Calculate estimated completion based on average step time
        const completedTimings = Array.from(stepTimings.values()).filter(t => t.duration);
        if (completedTimings.length > 0) {
          const avgTime = completedTimings.reduce((sum, t) => sum + (t.duration || 0), 0) / completedTimings.length;
          const remainingSteps = currentPlan.steps.length - i - 1;
          const estimatedMs = avgTime * remainingSteps;
          setEstimatedCompletion(new Date(Date.now() + estimatedMs));
        }

        // Check again for cancellation after step completes
        if (useAgentStore.getState().cancelRequested) {
          updateStepStatus(step.id, "pending");
          allStepsSucceeded = false;
          break;
        }

        if (success) {
          updateStepStatus(step.id, "completed");
        } else {
          setStepError(step.id, "Step execution failed");
          allStepsSucceeded = false;
          break;
        }
      }

      // If all steps succeeded, synthesize findings into final report
      if (allStepsSucceeded && !useAgentStore.getState().cancelRequested) {
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
      if (allStepsSucceeded) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }

    } finally {
      setExecuting(false);
      setExecutionStatus("idle");
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
          {/* Elapsed time and ETA during execution */}
          {isExecuting && (
            <div className="flex items-center gap-3 text-xs text-grey-500">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span className="font-mono">{formatTime(elapsedTime)}</span>
              </div>
              {estimatedCompletion && (
                <div className="flex items-center gap-1.5 text-sage-600">
                  <Timer className="h-3.5 w-3.5" />
                  <span className="font-mono">
                    ~{formatTime(Math.max(0, Math.floor((estimatedCompletion.getTime() - Date.now()) / 1000)))}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Execute button (initial state) */}
          {currentPlan.status === "ready" && !isExecuting && completedCount === 0 && failedCount === 0 && (
            <button
              onClick={handleExecute}
              className="flex items-center gap-2 rounded-full bg-sage-500 px-4 py-1.5 text-xs font-medium text-white shadow-md shadow-sage-500/20 transition-all hover:bg-sage-600 hover:shadow-lg active:scale-95"
            >
              <Play className="h-3.5 w-3.5" />
              Execute
            </button>
          )}

          {/* Execution controls */}
          {isExecuting && (
            <div className="flex items-center gap-2">
              {pauseRequested ? (
                <button
                  onClick={handleResume}
                  className="flex items-center gap-1.5 rounded-full bg-sage-500 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-sage-600 active:scale-95"
                >
                  <Play className="h-3.5 w-3.5" />
                  Resume
                </button>
              ) : (
                <button
                  onClick={handlePause}
                  className="flex items-center gap-1.5 rounded-full bg-grey-100 px-3 py-1.5 text-xs font-medium text-grey-700 transition-all hover:bg-grey-200 active:scale-95"
                >
                  <Pause className="h-3.5 w-3.5" />
                  Pause
                </button>
              )}
              <button
                onClick={handleCancel}
                className="flex items-center justify-center rounded-full bg-grey-100 p-1.5 text-grey-600 transition-all hover:bg-grey-200 hover:text-grey-800"
                title="Cancel execution"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Paused indicator */}
          {executionStatus === "paused" && !isExecuting && (
            <div className="flex items-center gap-2 rounded-full bg-grey-100 px-3 py-1.5 text-xs font-medium text-grey-600">
              <Pause className="h-3.5 w-3.5" />
              Paused
            </div>
          )}

          {/* Completed state with restart option */}
          {completedCount === effectiveTotal && effectiveTotal > 0 && !isExecuting && failedCount === 0 && (
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-sage-100 px-3 py-1 text-xs font-medium text-sage-700">
                Completed
              </span>
              <button
                onClick={handleRestart}
                className="flex items-center gap-1.5 rounded-full border border-grey-200 bg-white px-3 py-1 text-xs font-medium text-grey-600 transition-all hover:bg-grey-50 hover:border-grey-300"
                title="Reset and run again"
              >
                <RotateCcw className="h-3 w-3" />
                Restart
              </button>
            </div>
          )}

          {/* Partial completion or error state */}
          {(completedCount > 0 || failedCount > 0) && completedCount < effectiveTotal && !isExecuting && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleExecute}
                className="flex items-center gap-2 rounded-full bg-sage-500 px-4 py-1.5 text-xs font-medium text-white shadow-md shadow-sage-500/20 transition-all hover:bg-sage-600 hover:shadow-lg active:scale-95"
              >
                <Play className="h-3.5 w-3.5" />
                Continue
              </button>
              <button
                onClick={handleRestart}
                className="flex items-center gap-1.5 rounded-full border border-grey-200 bg-white px-3 py-1 text-xs font-medium text-grey-600 transition-all hover:bg-grey-50 hover:border-grey-300"
                title="Reset all steps"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced reasoning panel */}
      {isExecuting && <ReasoningPanel />}

      {/* Pending plan modifications */}
      {pendingModifications.filter(m => m.status === "pending").length > 0 && (
        <div className="border-b border-sage-200 bg-sage-50 px-6 py-3">
          <div className="flex items-center gap-2 mb-2">
            <Pencil className="h-4 w-4 text-sage-600" />
            <span className="text-sm font-medium text-sage-700">Plan Modifications Pending</span>
          </div>
          <div className="space-y-2">
            {pendingModifications.filter(m => m.status === "pending").map((mod) => (
              <div key={mod.id} className="flex items-start gap-3 p-2 bg-white rounded-lg border border-sage-200">
                <div className="flex-1">
                  <p className="text-xs text-grey-700">
                    <span className="font-medium capitalize">{mod.action.replace(/_/g, " ")}</span>
                    {mod.newContent && `: "${mod.newContent.substring(0, 50)}${mod.newContent.length > 50 ? "..." : ""}"`}
                  </p>
                  <p className="text-xs text-grey-500 mt-0.5">{mod.reason}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => approveModification(mod.id)}
                    className="p-1 rounded hover:bg-sage-100 text-sage-600"
                    title="Approve"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => rejectModification(mod.id)}
                    className="p-1 rounded hover:bg-grey-100 text-grey-500"
                    title="Reject"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overview */}
      <div className="border-b border-grey-100 bg-grey-50/50 px-6 py-4">
        <p className="text-sm leading-relaxed text-grey-700">
          {currentPlan.overview}
        </p>
      </div>

      {/* Steps */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="space-y-3">
          {/* Add step at beginning button */}
          {!isExecuting && (
            <div className="flex justify-center">
              {showAddStep === "start" ? (
                <div className="w-full rounded-xl border border-grey-200 bg-white p-3">
                  <input
                    type="text"
                    value={newStepContent}
                    onChange={(e) => setNewStepContent(e.target.value)}
                    placeholder="Enter new step content..."
                    className="w-full text-sm border-0 focus:ring-0 bg-transparent placeholder:text-grey-400"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddStep(null);
                      if (e.key === "Escape") setShowAddStep(null);
                    }}
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={() => setShowAddStep(null)}
                      className="px-2 py-1 text-xs text-grey-500 hover:text-grey-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleAddStep(null)}
                      className="px-3 py-1 text-xs bg-sage-500 text-white rounded-full hover:bg-sage-600"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddStep("start")}
                  className="flex items-center gap-1 text-xs text-grey-400 hover:text-sage-600 transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  Add step
                </button>
              )}
            </div>
          )}

          {currentPlan.steps.map((step, index) => (
            <div key={step.id}>
              <div
                className={cn(
                  "group relative flex gap-4 rounded-xl border p-4 transition-all animate-fade-in-up",
                  step.status === "completed"
                    ? "border-sage-200 bg-sage-50/50"
                    : step.status === "in_progress"
                    ? "border-sage-300 bg-sage-50 shadow-sm ring-1 ring-sage-200"
                    : step.status === "failed"
                    ? "border-grey-300 bg-grey-50"
                    : step.status === "skipped"
                    ? "border-grey-200 bg-grey-50/50 opacity-60"
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
                  ) : step.status === "failed" ? (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-grey-400 text-white">
                      <AlertCircle className="h-5 w-5" />
                    </div>
                  ) : step.status === "skipped" ? (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-grey-300 bg-grey-100 text-grey-400">
                      <SkipForward className="h-4 w-4" />
                    </div>
                  ) : step.isOptional ? (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed border-grey-300 bg-white text-sm font-semibold text-grey-400">
                      {index + 1}
                    </div>
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-grey-300 bg-white text-sm font-semibold text-grey-500">
                      {index + 1}
                    </div>
                  )}
                </div>

                {/* Step content */}
                <div className="flex-1 pt-1">
                  {step.isEditing ? (
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        value={editingContent[step.id] ?? step.content}
                        onChange={(e) => setEditingContent({ ...editingContent, [step.id]: e.target.value })}
                        className="w-full text-sm border border-grey-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-sage-300 focus:border-sage-300"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit(step.id);
                          if (e.key === "Escape") handleCancelEdit(step.id);
                        }}
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleCancelEdit(step.id)}
                          className="p-1 text-grey-400 hover:text-grey-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleSaveEdit(step.id)}
                          className="p-1 text-sage-600 hover:text-sage-700"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p
                        className={cn(
                          "text-sm leading-relaxed",
                          step.status === "completed"
                            ? "text-grey-600"
                            : step.status === "skipped"
                            ? "text-grey-400 line-through"
                            : "text-grey-800"
                        )}
                      >
                        {step.content}
                        {step.isOptional && (
                          <span className="ml-2 text-xs text-grey-400">(optional)</span>
                        )}
                      </p>

                      {/* Error state with retry/skip */}
                      {step.status === "failed" && step.error && (
                        <div className="mt-3 p-3 bg-grey-100 rounded-lg">
                          <p className="text-xs text-grey-600">{step.error}</p>
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleRetryStep(index)}
                              className="flex items-center gap-1 px-3 py-1 text-xs bg-sage-500 text-white rounded-full hover:bg-sage-600"
                            >
                              <RotateCcw className="h-3 w-3" />
                              Retry
                            </button>
                            <button
                              onClick={() => handleSkipStep(step.id)}
                              className="flex items-center gap-1 px-3 py-1 text-xs bg-grey-200 text-grey-700 rounded-full hover:bg-grey-300"
                            >
                              <SkipForward className="h-3 w-3" />
                              Skip
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Edit controls (shown on hover when not executing) */}
                {!isExecuting && step.status === "pending" && !step.isEditing && (
                  <div className="absolute right-3 top-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleStartEditing(step.id, step.content)}
                      className="p-1.5 rounded-lg hover:bg-grey-100 text-grey-400 hover:text-grey-600"
                      title="Edit step"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => toggleOptional(step.id)}
                      className={cn(
                        "p-1.5 rounded-lg hover:bg-grey-100",
                        step.isOptional ? "text-sage-500" : "text-grey-400 hover:text-grey-600"
                      )}
                      title={step.isOptional ? "Mark as required" : "Mark as optional"}
                    >
                      <CircleDashed className="h-3.5 w-3.5" />
                    </button>
                    {currentPlan.steps.length > 1 && (
                      <button
                        onClick={() => removeStep(step.id)}
                        className="p-1.5 rounded-lg hover:bg-grey-100 text-grey-400 hover:text-grey-600"
                        title="Remove step"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Add step button between steps */}
              {!isExecuting && (
                <div className="flex justify-center py-1">
                  {showAddStep === step.id ? (
                    <div className="w-full rounded-xl border border-grey-200 bg-white p-3 mt-2">
                      <input
                        type="text"
                        value={newStepContent}
                        onChange={(e) => setNewStepContent(e.target.value)}
                        placeholder="Enter new step content..."
                        className="w-full text-sm border-0 focus:ring-0 bg-transparent placeholder:text-grey-400"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddStep(step.id);
                          if (e.key === "Escape") setShowAddStep(null);
                        }}
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          onClick={() => setShowAddStep(null)}
                          className="px-2 py-1 text-xs text-grey-500 hover:text-grey-700"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleAddStep(step.id)}
                          className="px-3 py-1 text-xs bg-sage-500 text-white rounded-full hover:bg-sage-600"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAddStep(step.id)}
                      className="flex items-center gap-1 text-xs text-grey-400 hover:text-sage-600 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
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
              {completedCount} of {effectiveTotal} completed
              {skippedCount > 0 && ` (${skippedCount} skipped)`}
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
