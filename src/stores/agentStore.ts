import { create } from "zustand";
import { nanoid } from "nanoid";
import type { SourceAuthority } from "@/lib/source-quality";

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  favicon?: string;
  authority?: SourceAuthority;
}

export interface BrowserState {
  sessionId: string | null;
  liveViewUrl: string | null;
  currentUrl: string | null;
  screenshot: string | null;
  isActive: boolean;
  status: "idle" | "loading" | "complete" | "error";
  authority?: SourceAuthority;
}

export interface AgentAction {
  id: string;
  type: "thinking" | "reasoning" | "searching" | "deep_searching" | "search_complete" | "browsing" | "analyzing" | "validating" | "writing" | "evaluating" | "synthesizing" | "complete" | "error";
  label: string;
  status: "running" | "completed" | "error";
  detail?: string;
  reasoning?: string;
  confidence?: "high" | "medium" | "low";
  timestamp: Date;
  stepIndex: number;
  searchResults?: SearchResult[];
}

export interface StepExecution {
  stepIndex: number;
  stepContent: string;
  status: "pending" | "running" | "completed" | "error" | "skipped";
  actions: AgentAction[];
  error?: string;
  retryCount: number;
}

export interface StepError {
  stepIndex: number;
  error: string;
  retryCount: number;
}

export interface ProgressInfo {
  goal: string;
  completed: string[];
  remaining: string[];
  confidence: number;
}

export interface QualityMetrics {
  sourceDiversity: number;
  factVerification: number;
  completeness: number;
  actionability: number;
  avgScore: number;
}

// Execution status type
export type ExecutionStatus = "idle" | "running" | "paused" | "cancelled" | "completed" | "error";

interface AgentState {
  // Execution state
  isExecuting: boolean;
  executionStatus: ExecutionStatus;
  pauseRequested: boolean;
  cancelRequested: boolean;

  // Step tracking
  currentStepIndex: number;
  stepContents: string[];
  stepErrors: Map<number, StepError>;

  // Actions and findings
  actions: AgentAction[];
  findings: string;
  finalReport: string;

  // Search and browser
  latestSearchResults: SearchResult[];
  browserState: BrowserState;

  // Progress and quality
  currentReasoning: string;
  progressInfo: ProgressInfo | null;
  qualityMetrics: QualityMetrics | null;
  qualityScore: "excellent" | "good" | "needs_improvement" | null;
  totalIterations: number;

  // Actions
  setExecuting: (executing: boolean) => void;
  setExecutionStatus: (status: ExecutionStatus) => void;
  pauseExecution: () => void;
  resumeExecution: () => void;
  cancelExecution: () => void;
  setCurrentStepIndex: (index: number) => void;
  setStepContents: (contents: string[]) => void;
  setStepError: (stepIndex: number, error: string) => void;
  clearStepError: (stepIndex: number) => void;
  incrementStepRetry: (stepIndex: number) => void;
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
  setCurrentReasoning: (reasoning: string) => void;
  setProgressInfo: (info: ProgressInfo | null) => void;
  setQualityMetrics: (metrics: QualityMetrics | null) => void;
  setQualityScore: (score: "excellent" | "good" | "needs_improvement" | null) => void;
  incrementIterations: () => void;
  clearActions: () => void;
  reset: () => void;
}

const initialBrowserState: BrowserState = {
  sessionId: null,
  liveViewUrl: null,
  currentUrl: null,
  screenshot: null,
  isActive: false,
  status: "idle",
};

export const useAgentStore = create<AgentState>((set, get) => ({
  // Initial state
  isExecuting: false,
  executionStatus: "idle",
  pauseRequested: false,
  cancelRequested: false,
  currentStepIndex: 0,
  stepContents: [],
  stepErrors: new Map(),
  actions: [],
  findings: "",
  finalReport: "",
  latestSearchResults: [],
  browserState: initialBrowserState,
  currentReasoning: "",
  progressInfo: null,
  qualityMetrics: null,
  qualityScore: null,
  totalIterations: 0,

  // Execution control
  setExecuting: (executing) => set({
    isExecuting: executing,
    executionStatus: executing ? "running" : "idle"
  }),

  setExecutionStatus: (status) => set({
    executionStatus: status,
    isExecuting: status === "running"
  }),

  pauseExecution: () => set({
    pauseRequested: true,
    executionStatus: "paused"
  }),

  resumeExecution: () => set({
    pauseRequested: false,
    executionStatus: "running",
    isExecuting: true
  }),

  cancelExecution: () => set({
    cancelRequested: true,
    executionStatus: "cancelled",
    isExecuting: false
  }),

  // Step management
  setCurrentStepIndex: (index) => set({ currentStepIndex: index }),

  setStepContents: (contents) => set({ stepContents: contents }),

  setStepError: (stepIndex, error) => {
    set((state) => {
      const newErrors = new Map(state.stepErrors);
      const existing = newErrors.get(stepIndex);
      newErrors.set(stepIndex, {
        stepIndex,
        error,
        retryCount: existing?.retryCount || 0,
      });
      return { stepErrors: newErrors };
    });
  },

  clearStepError: (stepIndex) => {
    set((state) => {
      const newErrors = new Map(state.stepErrors);
      newErrors.delete(stepIndex);
      return { stepErrors: newErrors };
    });
  },

  incrementStepRetry: (stepIndex) => {
    set((state) => {
      const newErrors = new Map(state.stepErrors);
      const existing = newErrors.get(stepIndex);
      if (existing) {
        newErrors.set(stepIndex, {
          ...existing,
          retryCount: existing.retryCount + 1,
        });
      }
      return { stepErrors: newErrors };
    });
  },

  // Action management
  addAction: (action) => {
    const { currentStepIndex, actions } = get();

    // Check if there's an existing action with same type and label in current step
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

  // Findings management
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

  // Search and browser
  setLatestSearchResults: (results) => set({ latestSearchResults: results }),

  setBrowserState: (state) => {
    set((prev) => ({
      browserState: { ...prev.browserState, ...state },
    }));
  },

  resetBrowserState: () => set({ browserState: initialBrowserState }),

  // Progress and quality
  setCurrentReasoning: (reasoning) => set({ currentReasoning: reasoning }),

  setProgressInfo: (info) => set({ progressInfo: info }),

  setQualityMetrics: (metrics) => set({ qualityMetrics: metrics }),

  setQualityScore: (score) => set({ qualityScore: score }),

  incrementIterations: () => set((state) => ({ totalIterations: state.totalIterations + 1 })),

  clearActions: () => set({ actions: [] }),

  reset: () =>
    set({
      isExecuting: false,
      executionStatus: "idle",
      pauseRequested: false,
      cancelRequested: false,
      currentStepIndex: 0,
      stepContents: [],
      stepErrors: new Map(),
      actions: [],
      findings: "",
      finalReport: "",
      latestSearchResults: [],
      browserState: initialBrowserState,
      currentReasoning: "",
      progressInfo: null,
      qualityMetrics: null,
      qualityScore: null,
      totalIterations: 0,
    }),
}));
