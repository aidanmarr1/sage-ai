"use client";

import { create } from "zustand";
import { nanoid } from "nanoid";
import type { Message } from "@/types";

interface ChatState {
  messages: Message[];
  isTyping: boolean;
  inputValue: string;

  addMessage: (message: Omit<Message, "id" | "timestamp">) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  setTyping: (isTyping: boolean) => void;
  setInputValue: (value: string) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isTyping: false,
  inputValue: "",

  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id: nanoid(),
          timestamp: new Date(),
        },
      ],
    })),

  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, ...updates } : msg
      ),
    })),

  setTyping: (isTyping) => set({ isTyping }),
  setInputValue: (inputValue) => set({ inputValue }),
  clearMessages: () => set({ messages: [] }),
}));
