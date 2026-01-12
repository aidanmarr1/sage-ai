"use client";

import { create } from "zustand";

interface UIState {
  leftPanelWidth: number;
  terminalHeight: number;
  fileBrowserHeight: number;
  sidebarOpen: boolean;

  setLeftPanelWidth: (width: number) => void;
  setTerminalHeight: (height: number) => void;
  setFileBrowserHeight: (height: number) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  leftPanelWidth: 40,
  terminalHeight: 33,
  fileBrowserHeight: 33,
  sidebarOpen: true,

  setLeftPanelWidth: (width) =>
    set({ leftPanelWidth: Math.min(Math.max(width, 25), 75) }),
  setTerminalHeight: (height) =>
    set({ terminalHeight: Math.min(Math.max(height, 15), 50) }),
  setFileBrowserHeight: (height) =>
    set({ fileBrowserHeight: Math.min(Math.max(height, 15), 50) }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
