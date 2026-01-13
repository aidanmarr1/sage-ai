"use client";

import { useCallback, useRef, KeyboardEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useChatStore } from "@/stores/chatStore";
import { usePlanStore } from "@/stores/planStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useConversationStore } from "@/stores/conversationStore";
import { useAuthStore } from "@/stores/authStore";
import { Send, Paperclip, Smile, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { EmojiPicker } from "./EmojiPicker";
import { nanoid } from "nanoid";
import type { ImageAttachment } from "@/types";

export function ChatInput() {
  const router = useRouter();
  const { inputValue, setInputValue, addMessage, setTyping, clearMessages } = useChatStore();
  const { setPlan, setGenerating } = usePlanStore();
  const { setActiveTab } = useWorkspaceStore();
  const { currentConversationId, createConversation, setCurrentConversation } = useConversationStore();
  const { isAuthenticated } = useAuthStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachedImages, setAttachedImages] = useState<ImageAttachment[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleEmojiSelect = (emoji: string) => {
    setInputValue(inputValue + emoji);
    textareaRef.current?.focus();
  };

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setAttachedImages((prev) => [
          ...prev,
          {
            id: nanoid(),
            url,
            name: file.name,
            size: file.size,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input so same file can be selected again
    e.target.value = "";
  }, []);

  const removeImage = useCallback((id: string) => {
    setAttachedImages((prev) => prev.filter((img) => img.id !== id));
  }, []);

  const saveMessage = async (conversationId: string, role: string, content: string) => {
    if (!isAuthenticated) return;
    try {
      await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, content }),
      });
    } catch (error) {
      console.error("Failed to save message:", error);
    }
  };

  const handleSend = useCallback(async () => {
    const trimmedValue = inputValue.trim();
    if (!trimmedValue && attachedImages.length === 0) return;
    if (isProcessing) return;

    const userMessage = trimmedValue;

    addMessage({
      role: "user",
      content: userMessage,
      status: "sent",
      images: attachedImages.length > 0 ? attachedImages : undefined,
    });

    setInputValue("");
    setAttachedImages([]);
    setIsProcessing(true);
    setTyping(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      // Step 1: Classify the message to determine if it's a task or greeting
      const classifyResponse = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: userMessage }],
          type: "classify",
        }),
      });

      if (!classifyResponse.ok) {
        if (classifyResponse.status === 401) {
          throw new Error("Please sign in to use Sage.");
        }
        throw new Error("Failed to classify message");
      }

      const classifyData = await classifyResponse.json();
      const classifyResult = (classifyData.content || "").toLowerCase().trim();
      console.log("Classification result:", classifyResult);
      // More lenient check - LLM might return extra text
      const isTask = classifyResult.includes("task") && !classifyResult.includes("greeting");
      console.log("Is task:", isTask);

      // If it's just a greeting, respond conversationally without creating a task
      if (!isTask) {
        const greetingResponse = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: userMessage }],
            type: "greeting",
          }),
        });

        if (!greetingResponse.ok) {
          throw new Error("Failed to get response");
        }

        const greetingData = await greetingResponse.json();
        setTyping(false);
        addMessage({
          role: "assistant",
          content: greetingData.content,
          status: "sent",
        });
        return;
      }

      // It's a task - create conversation if authenticated and none exists
      let convId = currentConversationId;
      console.log("Task detected. isAuthenticated:", isAuthenticated, "currentConvId:", convId);
      if (isAuthenticated && !convId) {
        const title = userMessage.slice(0, 50) + (userMessage.length > 50 ? "..." : "");
        console.log("Creating conversation with title:", title);
        const conv = await createConversation(title);
        console.log("Created conversation:", conv);
        if (conv) {
          convId = conv.id;
          clearMessages(); // Clear local messages for new conversation
          addMessage({
            role: "user",
            content: userMessage,
            status: "sent",
            images: attachedImages.length > 0 ? attachedImages : undefined,
          });
          // Navigate to the new task URL
          router.push(`/task/${conv.id}`);
        }
      }

      // Save user message to database
      if (convId) {
        await saveMessage(convId, "user", userMessage);
      }

      // Step 2: Get acknowledgement
      const ackResponse = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: userMessage }],
          type: "acknowledge",
        }),
      });

      if (!ackResponse.ok) {
        if (ackResponse.status === 401) {
          throw new Error("Please sign in to use Sage.");
        }
        throw new Error("Failed to get acknowledgement");
      }

      const ackData = await ackResponse.json();

      setTyping(false);
      addMessage({
        role: "assistant",
        content: ackData.content,
        status: "sent",
      });

      // Save assistant message to database
      if (convId) {
        await saveMessage(convId, "assistant", ackData.content);
      }

      // Step 3: Generate plan
      setGenerating(true);
      setActiveTab("plan");

      const planResponse = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: userMessage }],
          type: "plan",
        }),
      });

      if (!planResponse.ok) {
        if (planResponse.status === 401) {
          throw new Error("Please sign in to use Sage.");
        }
        throw new Error("Failed to generate plan");
      }

      const planData = await planResponse.json();

      // Parse the plan content into steps
      const planContent = planData.content;
      const lines = planContent.split("\n").filter((line: string) => line.trim());

      // Extract overview (first line or first sentence)
      const overview = lines[0] || "Working on your request...";

      // Extract numbered steps
      const steps = lines
        .slice(1)
        .filter((line: string) => /^\d+[.)]/.test(line.trim()))
        .map((line: string) => ({
          id: nanoid(),
          content: line.replace(/^\d+[.)]\s*/, "").trim(),
          status: "pending" as const,
        }));

      // If no numbered steps found, use all remaining lines as steps
      const finalSteps = steps.length > 0 ? steps : lines.slice(1).map((line: string) => ({
        id: nanoid(),
        content: line.trim(),
        status: "pending" as const,
      }));

      setPlan({
        id: nanoid(),
        title: userMessage.slice(0, 50),
        overview: overview.replace(/^\d+[.)]\s*/, "").trim(),
        steps: finalSteps,
        status: "ready",
        createdAt: new Date(),
      });

      setGenerating(false);
    } catch (error) {
      console.error("Error:", error);
      setTyping(false);
      setGenerating(false);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      addMessage({
        role: "assistant",
        content: errorMessage,
        status: "sent",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [inputValue, attachedImages, isProcessing, isAuthenticated, currentConversationId, addMessage, setInputValue, setTyping, setGenerating, setActiveTab, setPlan, createConversation, clearMessages, router]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInputValue(e.target.value);

      // Auto-resize textarea
      const textarea = e.target;
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    },
    [setInputValue]
  );

  const characterCount = inputValue.length;
  const isNearLimit = characterCount > 3500;
  const isOverLimit = characterCount > 4000;

  return (
    <div className="relative border-t border-grey-100 bg-white p-4">
      {/* Gradient line at top */}
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-sage-200 to-transparent" />

      <div
        className={cn(
          "relative rounded-2xl border-2 bg-white transition-all duration-300",
          isFocused
            ? "border-sage-400 shadow-lg shadow-sage-100/50 ring-4 ring-sage-100/50"
            : "border-grey-200 shadow-sm hover:border-grey-300"
        )}
      >
        {/* Image previews */}
        {attachedImages.length > 0 && (
          <div className="flex gap-2 overflow-x-auto border-b border-grey-100 p-2">
            {attachedImages.map((img) => (
              <div
                key={img.id}
                className="group relative flex-shrink-0"
              >
                <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-grey-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <button
                  onClick={() => removeImage(img.id)}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-grey-800 text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100 hover:bg-grey-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input row */}
        <div className="flex items-end gap-2 p-2">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Left actions */}
          <div className="flex gap-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-all hover:scale-105",
                attachedImages.length > 0
                  ? "bg-sage-100 text-sage-600"
                  : "text-grey-400 hover:bg-grey-100 hover:text-grey-600"
              )}
            >
              <Paperclip className="h-5 w-5" />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={cn(
                  "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-all hover:scale-105",
                  showEmojiPicker
                    ? "bg-sage-100 text-sage-600"
                    : "text-grey-400 hover:bg-grey-100 hover:text-grey-600"
                )}
              >
                <Smile className="h-5 w-5" />
              </button>

              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div className="absolute bottom-12 left-0 z-50 animate-fade-in">
                  <EmojiPicker
                    onSelect={handleEmojiSelect}
                    onClose={() => setShowEmojiPicker(false)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Input */}
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Ask Sage anything..."
              rows={1}
              className="max-h-[200px] min-h-[44px] w-full resize-none bg-transparent py-3 text-[15px] text-grey-900 placeholder:text-grey-400 focus:outline-none"
            />
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={(!inputValue.trim() && attachedImages.length === 0) || isOverLimit || isProcessing}
            className={cn(
              "group relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-300",
              (inputValue.trim() || attachedImages.length > 0) && !isOverLimit && !isProcessing
                ? "bg-gradient-to-br from-sage-500 to-sage-600 text-white shadow-lg shadow-sage-500/30 hover:shadow-xl hover:shadow-sage-500/40 hover:scale-105 active:scale-95"
                : "bg-grey-100 text-grey-400"
            )}
          >
            {isProcessing ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-grey-300 border-t-grey-600" />
            ) : (inputValue.trim() || attachedImages.length > 0) && !isOverLimit ? (
              <Sparkles className="h-5 w-5 transition-transform group-hover:rotate-12" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between border-t border-grey-100 bg-grey-50/50 px-4 py-2">
          <div className="flex items-center gap-3 text-xs text-grey-400">
            <span className="flex items-center gap-1">
              <kbd className="rounded-md bg-white px-1.5 py-0.5 font-mono text-[10px] text-grey-500 shadow-sm ring-1 ring-grey-200">
                Enter
              </kbd>
              <span>to send</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded-md bg-white px-1.5 py-0.5 font-mono text-[10px] text-grey-500 shadow-sm ring-1 ring-grey-200">
                Shift + Enter
              </kbd>
              <span>for new line</span>
            </span>
          </div>

          {characterCount > 0 && (
            <span
              className={cn(
                "text-xs font-medium transition-colors",
                isOverLimit
                  ? "text-grey-700"
                  : isNearLimit
                  ? "text-sage-600"
                  : "text-grey-400"
              )}
            >
              {characterCount.toLocaleString()} / 4,000
            </span>
          )}
        </div>
      </div>

      {/* AI hint */}
      <p className="mt-3 text-center text-xs text-grey-400">
        Sage may make mistakes. Please verify important information.
      </p>
    </div>
  );
}
