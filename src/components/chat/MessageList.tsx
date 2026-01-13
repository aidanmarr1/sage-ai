"use client";

import { useEffect, useRef, useState } from "react";
import { useChatStore } from "@/stores/chatStore";
import { useAgentStore } from "@/stores/agentStore";
import { Message } from "./Message";
import { TypingIndicator } from "./TypingIndicator";
import { AgentActions } from "./AgentActions";
import { ReportCard } from "./ReportCard";
import { Search, ArrowDown, PenLine, Lightbulb, Sparkles } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/cn";

const suggestions = [
  { icon: Search, label: "Research a topic" },
  { icon: PenLine, label: "Help me write" },
  { icon: Lightbulb, label: "Brainstorm ideas" },
  { icon: Sparkles, label: "Surprise me" },
];

export function MessageList() {
  const { messages, isTyping, addMessage, setTyping } = useChatStore();
  const { actions, isExecuting, finalReport } = useAgentStore();
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, actions, finalReport]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSuggestionClick = (label: string) => {
    addMessage({
      role: "user",
      content: label,
      status: "sent",
    });

    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      addMessage({
        role: "assistant",
        content: `I'd be happy to help you "${label.toLowerCase()}". Could you share more details about what you're working on?`,
        status: "sent",
      });
    }, 1200);
  };

  if (messages.length === 0 && !isTyping) {
    return (
      <div className="relative flex h-full flex-col items-center justify-center overflow-hidden px-8 py-12">
        {/* Decorative background elements */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-sage-100/40 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-sage-100/40 blur-3xl" />
          <div className="absolute left-1/2 top-1/3 h-32 w-32 -translate-x-1/2 rounded-full bg-sage-200/20 blur-2xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center">
          {/* Animated logo */}
          <div className="group relative mb-8">
            <Image
              src="/sage-logo.png"
              alt="Sage"
              width={280}
              height={112}
              className="h-28 w-auto object-contain transition-transform duration-500 group-hover:scale-105"
            />
          </div>

          {/* Welcome text */}
          <h3 className="bg-gradient-to-r from-grey-900 via-grey-800 to-grey-900 bg-clip-text font-serif text-3xl font-semibold text-transparent">
            How can I help you today?
          </h3>
          <p className="mt-3 max-w-md text-center text-sm leading-relaxed text-grey-500">
            I&apos;m your AI agent, ready to help with any task. From research and writing
            to analysis and problem-solving, just ask and I&apos;ll get to work.
          </p>

          {/* Suggestion cards */}
          <div className="mt-10 grid grid-cols-2 gap-3">
            {suggestions.map((suggestion, index) => {
              const Icon = suggestion.icon;
              return (
                <button
                  key={suggestion.label}
                  onClick={() => handleSuggestionClick(suggestion.label)}
                  className="group/card flex items-center gap-3 rounded-2xl border border-grey-200/80 bg-white/80 px-4 py-3.5 text-left shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-sage-200 hover:bg-white hover:shadow-lg hover:shadow-sage-100/50"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 group-hover/card:scale-110",
                    "bg-grey-100 group-hover/card:bg-gradient-to-br group-hover/card:from-sage-100 group-hover/card:to-sage-200/50"
                  )}>
                    <Icon className="h-5 w-5 text-grey-500 transition-colors duration-300 group-hover/card:text-sage-600" />
                  </div>
                  <span className="text-sm font-medium text-grey-700 transition-colors group-hover/card:text-grey-900">
                    {suggestion.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative flex h-full flex-col overflow-y-auto scroll-smooth">
      <div className="flex flex-col gap-1 px-4 py-6">
        {messages.map((message, index) => (
          <Message
            key={message.id}
            message={message}
            isFirst={index === 0 || messages[index - 1]?.role !== message.role}
            isLast={
              index === messages.length - 1 ||
              messages[index + 1]?.role !== message.role
            }
          />
        ))}
        {(actions.length > 0 || isExecuting) && (
          <div className="mx-4 my-2">
            <AgentActions />
          </div>
        )}
        {finalReport && !isExecuting && (
          <div className="mx-4 my-4">
            <ReportCard />
          </div>
        )}
        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-grey-600 shadow-lg ring-1 ring-grey-200 transition-all hover:bg-grey-50 hover:shadow-xl animate-fade-in"
        >
          <ArrowDown className="h-4 w-4" />
          New messages
        </button>
      )}
    </div>
  );
}
