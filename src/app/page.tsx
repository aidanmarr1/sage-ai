"use client";

import { useEffect } from "react";
import { MainLayout } from "@/components/layout";
import { useConversationStore } from "@/stores/conversationStore";
import { useChatStore } from "@/stores/chatStore";
import { usePlanStore } from "@/stores/planStore";

export default function Home() {
  const { setCurrentConversation } = useConversationStore();
  const { clearMessages } = useChatStore();
  const { clearPlan } = usePlanStore();

  useEffect(() => {
    // Clear state for a fresh new task
    setCurrentConversation(null);
    clearMessages();
    clearPlan();
  }, [setCurrentConversation, clearMessages, clearPlan]);

  return <MainLayout />;
}
