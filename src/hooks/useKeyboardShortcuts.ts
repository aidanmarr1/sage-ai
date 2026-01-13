"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/stores/uiStore";
import { useConversationStore } from "@/stores/conversationStore";
import { useChatStore } from "@/stores/chatStore";
import { usePlanStore } from "@/stores/planStore";

export function useKeyboardShortcuts() {
  const router = useRouter();
  const { toggleSidebar } = useUIStore();
  const { setCurrentConversation } = useConversationStore();
  const { clearMessages } = useChatStore();
  const { clearPlan } = usePlanStore();

  const handleNewTask = useCallback(() => {
    setCurrentConversation(null);
    clearMessages();
    clearPlan();
    router.push("/");
  }, [setCurrentConversation, clearMessages, clearPlan, router]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const isMeta = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl + N: New Task
      if (isMeta && e.key === "n") {
        e.preventDefault();
        handleNewTask();
        return;
      }

      // Cmd/Ctrl + B: Toggle Sidebar
      if (isMeta && e.key === "b") {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      // Cmd/Ctrl + K: Focus Search (TODO: implement search modal)
      if (isMeta && e.key === "k") {
        e.preventDefault();
        // For now, just log - will implement search modal later
        console.log("Search triggered");
        return;
      }

      // Cmd/Ctrl + ,: Settings
      if (isMeta && e.key === ",") {
        e.preventDefault();
        router.push("/settings");
        return;
      }

      // ?: Help
      if (e.key === "?" && !isMeta) {
        e.preventDefault();
        router.push("/help");
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNewTask, toggleSidebar, router]);
}
