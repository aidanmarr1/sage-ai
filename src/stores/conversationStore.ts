"use client";

import { create } from "zustand";

export interface Conversation {
  id: string;
  title: string;
  starred: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ConversationState {
  conversations: Conversation[];
  currentConversationId: string | null;
  isLoading: boolean;

  setConversations: (conversations: Conversation[]) => void;
  setCurrentConversation: (id: string | null) => void;
  setLoading: (loading: boolean) => void;

  fetchConversations: () => Promise<void>;
  createConversation: (title: string) => Promise<Conversation | null>;
  deleteConversation: (id: string) => Promise<void>;
  toggleStar: (id: string) => Promise<void>;
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  conversations: [],
  currentConversationId: null,
  isLoading: false,

  setConversations: (conversations) => set({ conversations }),
  setCurrentConversation: (id) => set({ currentConversationId: id }),
  setLoading: (loading) => set({ isLoading: loading }),

  fetchConversations: async () => {
    try {
      set({ isLoading: true });
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        set({ conversations: data.conversations || [] });
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  createConversation: async (title: string) => {
    try {
      console.log("API: Creating conversation...");
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });

      console.log("API response status:", res.status);
      if (res.ok) {
        const data = await res.json();
        console.log("API response data:", data);
        const newConv = data.conversation;
        set((state) => ({
          conversations: [newConv, ...state.conversations],
          currentConversationId: newConv.id,
        }));
        return newConv;
      }
      const errorText = await res.text();
      console.error("API error:", errorText);
      return null;
    } catch (error) {
      console.error("Failed to create conversation:", error);
      return null;
    }
  },

  deleteConversation: async (id: string) => {
    try {
      const res = await fetch(`/api/conversations/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
          currentConversationId:
            state.currentConversationId === id ? null : state.currentConversationId,
        }));
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  },

  toggleStar: async (id: string) => {
    const conv = get().conversations.find((c) => c.id === id);
    if (!conv) return;

    const newStarred = !conv.starred;

    // Optimistic update
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, starred: newStarred } : c
      ),
    }));

    try {
      const res = await fetch(`/api/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ starred: newStarred }),
      });

      if (!res.ok) {
        // Revert on failure
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, starred: !newStarred } : c
          ),
        }));
      }
    } catch (error) {
      console.error("Failed to toggle star:", error);
      // Revert on error
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === id ? { ...c, starred: !newStarred } : c
        ),
      }));
    }
  },
}));
