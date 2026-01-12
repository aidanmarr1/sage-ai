"use client";

import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";

export function ChatPanel() {
  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-white via-white to-grey-50/30">
      {/* Messages */}
      <div className="relative flex-1 overflow-hidden">
        <MessageList />
      </div>

      {/* Input */}
      <ChatInput />
    </div>
  );
}
