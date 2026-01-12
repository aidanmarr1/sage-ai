"use client";

import { create } from "zustand";
import type { WebContainer } from "@webcontainer/api";

interface TerminalState {
  isBooting: boolean;
  isReady: boolean;
  error: string | null;
  webcontainer: WebContainer | null;

  setBooting: (booting: boolean) => void;
  setReady: (ready: boolean) => void;
  setError: (error: string | null) => void;
  setWebContainer: (container: WebContainer | null) => void;
}

export const useTerminalStore = create<TerminalState>((set) => ({
  isBooting: false,
  isReady: false,
  error: null,
  webcontainer: null,

  setBooting: (booting) => set({ isBooting: booting }),
  setReady: (ready) => set({ isReady: ready }),
  setError: (error) => set({ error }),
  setWebContainer: (container) => set({ webcontainer: container }),
}));
