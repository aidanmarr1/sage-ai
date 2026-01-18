"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useChatStore } from "@/stores/chatStore";
import { useAgentStore } from "@/stores/agentStore";
import { Message } from "./Message";
import { TypingIndicator } from "./TypingIndicator";
import { AgentActions } from "./AgentActions";
import { ReportCard } from "./ReportCard";
import {
  Search,
  ArrowDown,
  PenLine,
  Lightbulb,
  Sparkles,
  TrendingUp,
  FileText,
  Globe,
  Code,
  BookOpen,
  Zap,
  ArrowRight,
  Clock,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/cn";

// Detailed suggestions with examples
const suggestionCategories = [
  {
    title: "Research",
    icon: Search,
    color: "from-sage-500 to-sage-600",
    suggestions: [
      {
        label: "Deep dive into a topic",
        example: "Research the latest developments in quantum computing",
        icon: Globe,
      },
      {
        label: "Compare options",
        example: "Compare React vs Vue vs Svelte for my next project",
        icon: TrendingUp,
      },
    ],
  },
  {
    title: "Writing",
    icon: PenLine,
    color: "from-sage-400 to-sage-500",
    suggestions: [
      {
        label: "Draft content",
        example: "Write a blog post about sustainable living",
        icon: FileText,
      },
      {
        label: "Summarize documents",
        example: "Summarize this research paper for me",
        icon: BookOpen,
      },
    ],
  },
  {
    title: "Analysis",
    icon: Lightbulb,
    color: "from-sage-500 to-sage-600",
    suggestions: [
      {
        label: "Analyze data",
        example: "Help me understand this dataset's patterns",
        icon: TrendingUp,
      },
      {
        label: "Code review",
        example: "Review this code for bugs and improvements",
        icon: Code,
      },
    ],
  },
];

// Quick action templates
const quickActions = [
  { label: "Research a topic", prompt: "I need to research ", icon: Search },
  { label: "Help me write", prompt: "Help me write ", icon: PenLine },
  { label: "Explain something", prompt: "Explain ", icon: Lightbulb },
  { label: "Analyze this", prompt: "Analyze ", icon: TrendingUp },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function MessageList() {
  const { messages, isTyping, addMessage, setTyping, setInputValue } = useChatStore();
  const { actions, isExecuting, finalReport } = useAgentStore();
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const greeting = useMemo(() => getGreeting(), []);

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

  const handleSuggestionClick = (prompt: string) => {
    // If it's a template (ends with space), put it in input
    if (prompt.endsWith(" ")) {
      setInputValue(prompt);
      return;
    }

    // Otherwise send as message
    addMessage({
      role: "user",
      content: prompt,
      status: "sent",
    });

    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      addMessage({
        role: "assistant",
        content: `I'd be happy to help! Could you share more details about what you're looking for?`,
        status: "sent",
      });
    }, 1200);
  };

  const handleExampleClick = (example: string) => {
    addMessage({
      role: "user",
      content: example,
      status: "sent",
    });

    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      addMessage({
        role: "assistant",
        content: `Great! Let me help you with that. I'll create a plan to tackle this task thoroughly.`,
        status: "sent",
      });
    }, 1500);
  };

  if (messages.length === 0 && !isTyping) {
    return (
      <div className="relative flex h-full flex-col overflow-hidden">
        {/* Decorative background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-sage-100/50 blur-3xl" />
          <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-sage-200/40 blur-3xl" />
          <div className="absolute left-1/2 top-1/4 h-64 w-64 -translate-x-1/2 rounded-full bg-sage-100/30 blur-3xl" />
        </div>

        {/* Scrollable content */}
        <div className="relative z-10 flex-1 overflow-y-auto">
          <div className="flex flex-col items-center px-6 py-12">
            {/* Logo and greeting */}
            <div className="group relative mb-6 animate-float">
              <Image
                src="/sage-logo.png"
                alt="Sage"
                width={240}
                height={96}
                className="h-24 w-auto object-contain"
                priority
              />
            </div>

            <h2 className="font-serif text-3xl font-semibold text-grey-900 mb-2">
              {greeting}
            </h2>
            <p className="text-grey-500 text-center max-w-lg mb-10">
              I&apos;m Sage, your AI research assistant. I can help you research topics,
              write content, analyze information, and much more.
            </p>

            {/* Quick action chips */}
            <div className="flex flex-wrap justify-center gap-2 mb-10">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    onClick={() => handleSuggestionClick(action.prompt)}
                    className="group flex items-center gap-2 rounded-full border border-grey-200 bg-white/80 backdrop-blur-sm px-4 py-2.5 text-sm font-medium text-grey-700 shadow-sm transition-all hover:border-sage-300 hover:bg-white hover:shadow-md hover:text-sage-700 animate-fade-in-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <Icon className="h-4 w-4 text-grey-400 group-hover:text-sage-500 transition-colors" />
                    {action.label}
                    <ArrowRight className="h-3 w-3 text-grey-300 group-hover:text-sage-400 transition-colors" />
                  </button>
                );
              })}
            </div>

            {/* Category cards */}
            <div className="w-full max-w-3xl">
              <h3 className="text-xs font-semibold text-grey-400 uppercase tracking-wider mb-4 px-1">
                Or try one of these
              </h3>

              <div className="grid gap-4 md:grid-cols-3">
                {suggestionCategories.map((category, catIndex) => {
                  const CategoryIcon = category.icon;
                  const isSelected = selectedCategory === catIndex;

                  return (
                    <div
                      key={category.title}
                      className={cn(
                        "rounded-2xl border transition-all duration-300 animate-fade-in-up overflow-hidden",
                        isSelected
                          ? "border-sage-300 bg-white shadow-lg shadow-sage-100/50"
                          : "border-grey-200 bg-white/80 hover:border-grey-300 hover:shadow-md"
                      )}
                      style={{ animationDelay: `${catIndex * 100 + 200}ms` }}
                    >
                      {/* Category header */}
                      <button
                        onClick={() => setSelectedCategory(isSelected ? null : catIndex)}
                        className="w-full flex items-center gap-3 p-4"
                      >
                        <div className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm",
                          category.color
                        )}>
                          <CategoryIcon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                          <span className="font-semibold text-grey-900">{category.title}</span>
                          <p className="text-xs text-grey-500">{category.suggestions.length} templates</p>
                        </div>
                        <ArrowRight className={cn(
                          "h-4 w-4 text-grey-400 transition-transform",
                          isSelected && "rotate-90"
                        )} />
                      </button>

                      {/* Expanded suggestions */}
                      {isSelected && (
                        <div className="border-t border-grey-100 p-3 space-y-2 animate-fade-in">
                          {category.suggestions.map((suggestion, index) => {
                            const SuggestionIcon = suggestion.icon;
                            return (
                              <button
                                key={suggestion.label}
                                onClick={() => handleExampleClick(suggestion.example)}
                                className="w-full group flex items-start gap-3 p-3 rounded-xl hover:bg-sage-50 transition-colors text-left"
                              >
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-grey-100 group-hover:bg-sage-100 transition-colors flex-shrink-0">
                                  <SuggestionIcon className="h-4 w-4 text-grey-500 group-hover:text-sage-600 transition-colors" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm font-medium text-grey-800 group-hover:text-sage-700">
                                    {suggestion.label}
                                  </span>
                                  <p className="text-xs text-grey-500 mt-0.5 line-clamp-1">
                                    "{suggestion.example}"
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Keyboard shortcut hint */}
            <div className="mt-10 flex items-center gap-2 text-xs text-grey-400">
              <kbd className="px-2 py-1 rounded bg-grey-100 font-mono text-grey-500">⌘</kbd>
              <span>+</span>
              <kbd className="px-2 py-1 rounded bg-grey-100 font-mono text-grey-500">K</kbd>
              <span className="ml-1">to search conversations</span>
            </div>
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
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-sage-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-sage-600/25 transition-all hover:bg-sage-700 hover:shadow-xl hover:shadow-sage-600/30 animate-fade-in"
        >
          <ArrowDown className="h-4 w-4" />
          Scroll to latest
        </button>
      )}
    </div>
  );
}
