import { create } from "zustand";
import { nanoid } from "nanoid";

export interface AgentAction {
  id: string;
  type: "thinking" | "searching" | "writing" | "complete" | "error";
  label: string;
  status: "running" | "completed" | "error";
  detail?: string;
  timestamp: Date;
}

interface AgentState {
  isExecuting: boolean;
  currentStepIndex: number;
  actions: AgentAction[];
  findings: string;

  // Actions
  setExecuting: (executing: boolean) => void;
  setCurrentStepIndex: (index: number) => void;
  addAction: (action: Omit<AgentAction, "id" | "timestamp">) => string;
  updateAction: (id: string, updates: Partial<AgentAction>) => void;
  completeAction: (id: string) => void;
  errorAction: (id: string, detail?: string) => void;
  appendFindings: (content: string) => void;
  setFindings: (content: string) => void;
  clearActions: () => void;
  reset: () => void;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  isExecuting: false,
  currentStepIndex: 0,
  actions: [],
  findings: "",

  setExecuting: (executing) => set({ isExecuting: executing }),

  setCurrentStepIndex: (index) => set({ currentStepIndex: index }),

  addAction: (action) => {
    const id = nanoid();
    const newAction: AgentAction = {
      ...action,
      id,
      timestamp: new Date(),
    };
    set((state) => ({
      actions: [...state.actions, newAction],
    }));
    return id;
  },

  updateAction: (id, updates) => {
    set((state) => ({
      actions: state.actions.map((action) =>
        action.id === id ? { ...action, ...updates } : action
      ),
    }));
  },

  completeAction: (id) => {
    set((state) => ({
      actions: state.actions.map((action) =>
        action.id === id ? { ...action, status: "completed" as const } : action
      ),
    }));
  },

  errorAction: (id, detail) => {
    set((state) => ({
      actions: state.actions.map((action) =>
        action.id === id
          ? { ...action, status: "error" as const, detail: detail || action.detail }
          : action
      ),
    }));
  },

  appendFindings: (content) => {
    set((state) => ({
      findings: state.findings + content,
    }));
  },

  setFindings: (content) => set({ findings: content }),

  clearActions: () => set({ actions: [] }),

  reset: () =>
    set({
      isExecuting: false,
      currentStepIndex: 0,
      actions: [],
      findings: "",
    }),
}));
