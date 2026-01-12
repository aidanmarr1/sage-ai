"use client";

import { create } from "zustand";
import { nanoid } from "nanoid";
import type { FileNode, TerminalLine, WorkspaceTab } from "@/types";

interface WorkspaceState {
  // File browser state
  fileTree: FileNode[];
  selectedFile: FileNode | null;
  expandedFolders: Set<string>;

  // Terminal state
  terminalLines: TerminalLine[];

  // Code preview state
  openFiles: FileNode[];
  activeFileId: string | null;

  // UI state
  activeTab: WorkspaceTab;

  // File browser actions
  setFileTree: (tree: FileNode[]) => void;
  selectFile: (file: FileNode | null) => void;
  toggleFolder: (folderId: string) => void;

  // Terminal actions
  addTerminalLine: (line: Omit<TerminalLine, "id" | "timestamp">) => void;
  clearTerminal: () => void;

  // Code preview actions
  openFile: (file: FileNode) => void;
  closeFile: (fileId: string) => void;
  setActiveFile: (fileId: string) => void;

  // UI actions
  setActiveTab: (tab: WorkspaceTab) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  fileTree: [],
  selectedFile: null,
  expandedFolders: new Set(),
  terminalLines: [],
  openFiles: [],
  activeFileId: null,
  activeTab: "computer",

  setFileTree: (tree) => set({ fileTree: tree }),

  selectFile: (file) => set({ selectedFile: file }),

  toggleFolder: (folderId) =>
    set((state) => {
      const newExpanded = new Set(state.expandedFolders);
      if (newExpanded.has(folderId)) {
        newExpanded.delete(folderId);
      } else {
        newExpanded.add(folderId);
      }
      return { expandedFolders: newExpanded };
    }),

  addTerminalLine: (line) =>
    set((state) => ({
      terminalLines: [
        ...state.terminalLines,
        { ...line, id: nanoid(), timestamp: new Date() },
      ],
    })),

  clearTerminal: () => set({ terminalLines: [] }),

  openFile: (file) =>
    set((state) => {
      if (state.openFiles.some((f) => f.id === file.id)) {
        return { activeFileId: file.id };
      }
      return {
        openFiles: [...state.openFiles, file],
        activeFileId: file.id,
      };
    }),

  closeFile: (fileId) =>
    set((state) => {
      const newOpenFiles = state.openFiles.filter((f) => f.id !== fileId);
      return {
        openFiles: newOpenFiles,
        activeFileId:
          state.activeFileId === fileId
            ? newOpenFiles[0]?.id ?? null
            : state.activeFileId,
      };
    }),

  setActiveFile: (fileId) => set({ activeFileId: fileId }),
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
