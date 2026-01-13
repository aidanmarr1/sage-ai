"use client";

import { useState } from "react";
import { Menu, X, Sparkles, Plus } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/cn";
import { useRouter } from "next/navigation";
import { useConversationStore } from "@/stores/conversationStore";
import { useChatStore } from "@/stores/chatStore";
import { usePlanStore } from "@/stores/planStore";

interface MobileHeaderProps {
  onMenuClick: () => void;
  isMenuOpen: boolean;
}

export function MobileHeader({ onMenuClick, isMenuOpen }: MobileHeaderProps) {
  const router = useRouter();
  const { setCurrentConversation } = useConversationStore();
  const { clearMessages } = useChatStore();
  const { clearPlan } = usePlanStore();

  const handleNewTask = () => {
    setCurrentConversation(null);
    clearMessages();
    clearPlan();
    router.push("/");
  };

  return (
    <header className="md:hidden flex h-14 flex-shrink-0 items-center justify-between border-b border-grey-200 bg-white px-4">
      {/* Menu button */}
      <button
        onClick={onMenuClick}
        className="flex h-10 w-10 items-center justify-center rounded-xl text-grey-600 transition-colors hover:bg-grey-100"
      >
        {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Logo */}
      <div className="flex items-center gap-2">
        <Image
          src="/sage-logo.png"
          alt="Sage"
          width={100}
          height={40}
          className="h-8 w-auto object-contain"
        />
      </div>

      {/* New task button */}
      <button
        onClick={handleNewTask}
        className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-100 text-sage-600 transition-colors hover:bg-sage-200"
      >
        <Plus className="h-5 w-5" />
      </button>
    </header>
  );
}
