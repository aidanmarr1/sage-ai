"use client";

import { create } from "zustand";
import { nanoid } from "nanoid";

export interface PlanStep {
  id: string;
  content: string;
  status: "pending" | "in_progress" | "completed" | "skipped" | "failed";
  isOptional: boolean;
  isEditing: boolean;
  error?: string;
}

export interface Plan {
  id: string;
  title: string;
  overview: string;
  steps: PlanStep[];
  status: "creating" | "ready" | "in_progress" | "completed";
  createdAt: Date;
}

export interface PlanModificationRequest {
  id: string;
  action: "add_step" | "remove_step" | "modify_current";
  reason: string;
  newContent?: string;
  stepIndex?: number;
  timestamp: Date;
  status: "pending" | "approved" | "rejected";
}

interface PlanState {
  currentPlan: Plan | null;
  isGenerating: boolean;
  pendingModifications: PlanModificationRequest[];

  // Basic actions
  setPlan: (plan: Plan | null) => void;
  setGenerating: (generating: boolean) => void;
  updateStepStatus: (stepId: string, status: PlanStep["status"]) => void;
  clearPlan: () => void;

  // Step editing actions
  addStep: (afterStepId: string | null, content: string) => void;
  removeStep: (stepId: string) => void;
  updateStepContent: (stepId: string, content: string) => void;
  toggleOptional: (stepId: string) => void;
  setStepEditing: (stepId: string, isEditing: boolean) => void;
  setStepError: (stepId: string, error: string) => void;
  clearStepError: (stepId: string) => void;
  reorderSteps: (fromIndex: number, toIndex: number) => void;

  // Bulk actions
  resetAllSteps: () => void;
  skipRemainingSteps: () => void;

  // Plan modification actions (from agent)
  addPendingModification: (mod: Omit<PlanModificationRequest, "id" | "timestamp" | "status">) => void;
  approveModification: (modId: string) => void;
  rejectModification: (modId: string) => void;
  clearPendingModifications: () => void;
  applyModification: (mod: PlanModificationRequest) => void;
}

export const usePlanStore = create<PlanState>((set, get) => ({
  currentPlan: null,
  isGenerating: false,
  pendingModifications: [],

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

  // Add a new step after the specified step (or at beginning if null)
  addStep: (afterStepId, content) =>
    set((state) => {
      if (!state.currentPlan) return state;

      const newStep: PlanStep = {
        id: nanoid(),
        content,
        status: "pending",
        isOptional: false,
        isEditing: false,
      };

      let newSteps: PlanStep[];
      if (afterStepId === null) {
        newSteps = [newStep, ...state.currentPlan.steps];
      } else {
        const index = state.currentPlan.steps.findIndex(s => s.id === afterStepId);
        if (index === -1) {
          newSteps = [...state.currentPlan.steps, newStep];
        } else {
          newSteps = [
            ...state.currentPlan.steps.slice(0, index + 1),
            newStep,
            ...state.currentPlan.steps.slice(index + 1),
          ];
        }
      }

      return {
        currentPlan: {
          ...state.currentPlan,
          steps: newSteps,
        },
      };
    }),

  // Remove a step by ID
  removeStep: (stepId) =>
    set((state) => {
      if (!state.currentPlan) return state;
      return {
        currentPlan: {
          ...state.currentPlan,
          steps: state.currentPlan.steps.filter((step) => step.id !== stepId),
        },
      };
    }),

  // Update step content
  updateStepContent: (stepId, content) =>
    set((state) => {
      if (!state.currentPlan) return state;
      return {
        currentPlan: {
          ...state.currentPlan,
          steps: state.currentPlan.steps.map((step) =>
            step.id === stepId ? { ...step, content, isEditing: false } : step
          ),
        },
      };
    }),

  // Toggle step optional status
  toggleOptional: (stepId) =>
    set((state) => {
      if (!state.currentPlan) return state;
      return {
        currentPlan: {
          ...state.currentPlan,
          steps: state.currentPlan.steps.map((step) =>
            step.id === stepId ? { ...step, isOptional: !step.isOptional } : step
          ),
        },
      };
    }),

  // Set step editing state
  setStepEditing: (stepId, isEditing) =>
    set((state) => {
      if (!state.currentPlan) return state;
      return {
        currentPlan: {
          ...state.currentPlan,
          steps: state.currentPlan.steps.map((step) =>
            step.id === stepId ? { ...step, isEditing } : step
          ),
        },
      };
    }),

  // Set error on a step
  setStepError: (stepId, error) =>
    set((state) => {
      if (!state.currentPlan) return state;
      return {
        currentPlan: {
          ...state.currentPlan,
          steps: state.currentPlan.steps.map((step) =>
            step.id === stepId ? { ...step, error, status: "failed" } : step
          ),
        },
      };
    }),

  // Clear error from a step
  clearStepError: (stepId) =>
    set((state) => {
      if (!state.currentPlan) return state;
      return {
        currentPlan: {
          ...state.currentPlan,
          steps: state.currentPlan.steps.map((step) =>
            step.id === stepId ? { ...step, error: undefined } : step
          ),
        },
      };
    }),

  // Reorder steps
  reorderSteps: (fromIndex, toIndex) =>
    set((state) => {
      if (!state.currentPlan) return state;
      const steps = [...state.currentPlan.steps];
      const [removed] = steps.splice(fromIndex, 1);
      steps.splice(toIndex, 0, removed);
      return {
        currentPlan: {
          ...state.currentPlan,
          steps,
        },
      };
    }),

  // Reset all steps to pending
  resetAllSteps: () =>
    set((state) => {
      if (!state.currentPlan) return state;
      return {
        currentPlan: {
          ...state.currentPlan,
          status: "ready",
          steps: state.currentPlan.steps.map((step) => ({
            ...step,
            status: "pending" as const,
            error: undefined,
          })),
        },
      };
    }),

  // Skip all remaining pending steps
  skipRemainingSteps: () =>
    set((state) => {
      if (!state.currentPlan) return state;
      return {
        currentPlan: {
          ...state.currentPlan,
          steps: state.currentPlan.steps.map((step) =>
            step.status === "pending" ? { ...step, status: "skipped" as const } : step
          ),
        },
      };
    }),

  // Add a pending modification from the agent
  addPendingModification: (mod) =>
    set((state) => ({
      pendingModifications: [
        ...state.pendingModifications,
        {
          ...mod,
          id: nanoid(),
          timestamp: new Date(),
          status: "pending" as const,
        },
      ],
    })),

  // Approve a modification and apply it
  approveModification: (modId) => {
    const state = get();
    const mod = state.pendingModifications.find((m) => m.id === modId);
    if (!mod) return;

    // Apply the modification
    get().applyModification(mod);

    // Update status
    set((s) => ({
      pendingModifications: s.pendingModifications.map((m) =>
        m.id === modId ? { ...m, status: "approved" as const } : m
      ),
    }));
  },

  // Reject a modification
  rejectModification: (modId) =>
    set((state) => ({
      pendingModifications: state.pendingModifications.map((m) =>
        m.id === modId ? { ...m, status: "rejected" as const } : m
      ),
    })),

  // Clear all pending modifications
  clearPendingModifications: () => set({ pendingModifications: [] }),

  // Apply a modification to the plan
  applyModification: (mod) =>
    set((state) => {
      if (!state.currentPlan) return state;

      const { action, newContent, stepIndex } = mod;

      switch (action) {
        case "add_step": {
          if (!newContent) return state;
          const newStep: PlanStep = {
            id: nanoid(),
            content: newContent,
            status: "pending",
            isOptional: false,
            isEditing: false,
          };

          // Add after the current step index if provided
          const insertIndex = stepIndex !== undefined ? stepIndex + 1 : state.currentPlan.steps.length;
          const newSteps = [
            ...state.currentPlan.steps.slice(0, insertIndex),
            newStep,
            ...state.currentPlan.steps.slice(insertIndex),
          ];

          return {
            currentPlan: {
              ...state.currentPlan,
              steps: newSteps,
            },
          };
        }

        case "remove_step": {
          if (stepIndex === undefined) return state;
          return {
            currentPlan: {
              ...state.currentPlan,
              steps: state.currentPlan.steps.filter((_, i) => i !== stepIndex),
            },
          };
        }

        case "modify_current": {
          if (!newContent || stepIndex === undefined) return state;
          return {
            currentPlan: {
              ...state.currentPlan,
              steps: state.currentPlan.steps.map((step, i) =>
                i === stepIndex ? { ...step, content: newContent } : step
              ),
            },
          };
        }

        default:
          return state;
      }
    }),
}));
