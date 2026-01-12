"use client";

import { usePlanStore } from "@/stores/planStore";
import { cn } from "@/lib/cn";
import {
  ClipboardList,
  Circle,
  CheckCircle2,
  Loader2,
  Sparkles,
} from "lucide-react";

export function PlanPanel() {
  const { currentPlan, isGenerating } = usePlanStore();

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
        <div
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium",
            currentPlan.status === "ready" &&
              "bg-sage-100 text-sage-700",
            currentPlan.status === "in_progress" &&
              "bg-sage-100 text-sage-700",
            currentPlan.status === "completed" &&
              "bg-sage-100 text-sage-700"
          )}
        >
          {currentPlan.status === "ready" && "Ready"}
          {currentPlan.status === "in_progress" && "In Progress"}
          {currentPlan.status === "completed" && "Completed"}
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
                "group flex gap-4 rounded-xl border p-4 transition-all",
                step.status === "completed"
                  ? "border-sage-200 bg-sage-50/50"
                  : step.status === "in_progress"
                  ? "border-sage-300 bg-sage-50 shadow-sm"
                  : "border-grey-200 bg-white hover:border-grey-300 hover:shadow-sm"
              )}
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

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-grey-200 bg-white px-6 py-3">
        <div className="flex items-center gap-2">
          <Circle className="h-2.5 w-2.5 fill-sage-500 text-sage-500" />
          <span className="text-xs text-grey-500">
            {currentPlan.steps.filter((s) => s.status === "completed").length} of{" "}
            {currentPlan.steps.length} completed
          </span>
        </div>
      </div>
    </div>
  );
}
