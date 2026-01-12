"use client";

import { create } from "zustand";

export interface PlanStep {
  id: string;
  content: string;
  status: "pending" | "in_progress" | "completed";
}

export interface Plan {
  id: string;
  title: string;
  overview: string;
  steps: PlanStep[];
  status: "creating" | "ready" | "in_progress" | "completed";
  createdAt: Date;
}

interface PlanState {
  currentPlan: Plan | null;
  isGenerating: boolean;

  setPlan: (plan: Plan | null) => void;
  setGenerating: (generating: boolean) => void;
  updateStepStatus: (stepId: string, status: PlanStep["status"]) => void;
  clearPlan: () => void;
}

export const usePlanStore = create<PlanState>((set) => ({
  currentPlan: null,
  isGenerating: false,

  setPlan: (plan) => set({ currentPlan: plan }),

  setGenerating: (generating) => set({ isGenerating: generating }),

  updateStepStatus: (stepId, status) =>
    set((state) => {
      if (!state.currentPlan) return state;
      return {
        currentPlan: {
          ...state.currentPlan,
          steps: state.currentPlan.steps.map((step) =>
            step.id === stepId ? { ...step, status } : step
          ),
        },
      };
    }),

  clearPlan: () => set({ currentPlan: null, isGenerating: false }),
}));
