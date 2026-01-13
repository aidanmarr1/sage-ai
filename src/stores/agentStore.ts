import { create } from "zustand";
import { nanoid } from "nanoid";

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  favicon?: string;
}

export interface AgentAction {
  id: string;
  type: "thinking" | "searching" | "search_complete" | "writing" | "complete" | "error";
  label: string;
  status: "running" | "completed" | "error";
  detail?: string;
  timestamp: Date;
  stepIndex: number;
  searchResults?: SearchResult[];
}

export interface StepExecution {
  stepIndex: number;
  stepContent: string;
  status: "pending" | "running" | "completed" | "error";
  actions: AgentAction[];
}

interface AgentState {
  isExecuting: boolean;
  currentStepIndex: number;
  actions: AgentAction[];
  findings: string;
  stepContents: string[];
  latestSearchResults: SearchResult[];

  // Actions
  setExecuting: (executing: boolean) => void;
  setCurrentStepIndex: (index: number) => void;
  setStepContents: (contents: string[]) => void;
  addAction: (action: Omit<AgentAction, "id" | "timestamp" | "stepIndex">) => string;
  updateAction: (id: string, updates: Partial<AgentAction>) => void;
  completeAction: (id: string) => void;
  completeActionWithResults: (id: string, results: SearchResult[]) => void;
  errorAction: (id: string, detail?: string) => void;
  appendFindings: (content: string) => void;
  setFindings: (content: string) => void;
  setLatestSearchResults: (results: SearchResult[]) => void;
  clearActions: () => void;
  reset: () => void;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  isExecuting: false,
  currentStepIndex: 0,
  actions: [],
  findings: "",
  stepContents: [],
  latestSearchResults: [],

  setExecuting: (executing) => set({ isExecuting: executing }),

  setCurrentStepIndex: (index) => set({ currentStepIndex: index }),

  setStepContents: (contents) => set({ stepContents: contents }),

  addAction: (action) => {
    const id = nanoid();
    const { currentStepIndex } = get();
    const newAction: AgentAction = {
      ...action,
      id,
      timestamp: new Date(),
      stepIndex: currentStepIndex,
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

  completeActionWithResults: (id, results) => {
    set((state) => ({
      actions: state.actions.map((action) =>
        action.id === id
          ? { ...action, status: "completed" as const, searchResults: results }
          : action
      ),
      latestSearchResults: results,
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

  setLatestSearchResults: (results) => set({ latestSearchResults: results }),

  clearActions: () => set({ actions: [] }),

  reset: () =>
    set({
      isExecuting: false,
      currentStepIndex: 0,
      actions: [],
      findings: "",
      stepContents: [],
      latestSearchResults: [],
    }),
}));
