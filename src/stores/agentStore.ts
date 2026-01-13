import { create } from "zustand";
import { nanoid } from "nanoid";

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  favicon?: string;
}

export interface BrowserState {
  sessionId: string | null;
  liveViewUrl: string | null;
  currentUrl: string | null;
  screenshot: string | null;
  isActive: boolean;
}

export interface AgentAction {
  id: string;
  type: "thinking" | "searching" | "search_complete" | "browsing" | "writing" | "synthesizing" | "complete" | "error";
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
  finalReport: string;
  stepContents: string[];
  latestSearchResults: SearchResult[];
  browserState: BrowserState;

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
  setFinalReport: (report: string) => void;
  appendFinalReport: (content: string) => void;
  setLatestSearchResults: (results: SearchResult[]) => void;
  setBrowserState: (state: Partial<BrowserState>) => void;
  resetBrowserState: () => void;
  clearActions: () => void;
  reset: () => void;
}

const initialBrowserState: BrowserState = {
  sessionId: null,
  liveViewUrl: null,
  currentUrl: null,
  screenshot: null,
  isActive: false,
};

export const useAgentStore = create<AgentState>((set, get) => ({
  isExecuting: false,
  currentStepIndex: 0,
  actions: [],
  findings: "",
  finalReport: "",
  stepContents: [],
  latestSearchResults: [],
  browserState: initialBrowserState,

  setExecuting: (executing) => set({ isExecuting: executing }),

  setCurrentStepIndex: (index) => set({ currentStepIndex: index }),

  setStepContents: (contents) => set({ stepContents: contents }),

  addAction: (action) => {
    const { currentStepIndex, actions } = get();

    // Check if there's an existing action with same type and label in current step
    // If so, update it instead of adding a duplicate
    const existingIndex = actions.findIndex(
      a => a.stepIndex === currentStepIndex &&
           a.type === action.type &&
           a.label === action.label
    );

    if (existingIndex !== -1) {
      // Update existing action
      set((state) => ({
        actions: state.actions.map((a, i) =>
          i === existingIndex ? { ...a, status: action.status } : a
        ),
      }));
      return actions[existingIndex].id;
    }

    // Add new action
    const id = nanoid();
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

  setFinalReport: (report) => set({ finalReport: report }),

  appendFinalReport: (content) => {
    set((state) => ({
      finalReport: state.finalReport + content,
    }));
  },

  setLatestSearchResults: (results) => set({ latestSearchResults: results }),

  setBrowserState: (state) => {
    set((prev) => ({
      browserState: { ...prev.browserState, ...state },
    }));
  },

  resetBrowserState: () => set({ browserState: initialBrowserState }),

  clearActions: () => set({ actions: [] }),

  reset: () =>
    set({
      isExecuting: false,
      currentStepIndex: 0,
      actions: [],
      findings: "",
      finalReport: "",
      stepContents: [],
      latestSearchResults: [],
      browserState: initialBrowserState,
    }),
}));
