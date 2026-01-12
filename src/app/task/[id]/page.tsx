"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { MainLayout } from "@/components/layout";
import { useConversationStore } from "@/stores/conversationStore";
import { useChatStore } from "@/stores/chatStore";
import { usePlanStore } from "@/stores/planStore";

export default function TaskPage() {
  const params = useParams();
  const taskId = params.id as string;

  const { setCurrentConversation, fetchConversations } = useConversationStore();
  const { setMessages, clearMessages } = useChatStore();
  const { clearPlan } = usePlanStore();

  useEffect(() => {
    if (taskId) {
      // Set the current conversation from URL
      setCurrentConversation(taskId);

      // Load messages for this conversation
      const loadMessages = async () => {
        try {
          const res = await fetch(`/api/conversations/${taskId}/messages`);
          if (res.ok) {
            const data = await res.json();
            if (data.messages && data.messages.length > 0) {
              // Convert API messages to chat format
              const formattedMessages = data.messages.map((msg: { id: string; role: string; content: string; createdAt: string }) => ({
                id: msg.id,
                role: msg.role as "user" | "assistant",
                content: msg.content,
                timestamp: new Date(msg.createdAt),
                status: "sent" as const,
              }));
              setMessages(formattedMessages);
            } else {
              clearMessages();
            }
          }
        } catch (error) {
          console.error("Failed to load messages:", error);
          clearMessages();
        }
      };

      loadMessages();

      // Also ensure conversations list is loaded
      fetchConversations();
    }

    // Clear plan when loading a conversation
    clearPlan();
  }, [taskId, setCurrentConversation, setMessages, clearMessages, clearPlan, fetchConversations]);

  return <MainLayout />;
}
