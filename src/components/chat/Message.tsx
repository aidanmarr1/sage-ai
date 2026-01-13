"use client";

import { format } from "date-fns";
import { cn } from "@/lib/cn";
import type { Message as MessageType } from "@/types";
import { User, Copy, Check, ThumbsUp, ThumbsDown, RotateCcw } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface MessageProps {
  message: MessageType;
  isFirst?: boolean;
  isLast?: boolean;
}

export function Message({ message, isFirst = true, isLast = true }: MessageProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [reaction, setReaction] = useState<"up" | "down" | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "group relative flex w-full gap-3 px-2 py-2 transition-all duration-200",
        isUser ? "flex-row-reverse" : "flex-row",
        isFirst && "mt-4",
        "animate-slide-up"
      )}
    >
      {/* Avatar - only show on first message in group */}
      <div className={cn("w-10 flex-shrink-0 pt-1", !isFirst && "invisible")}>
        {isFirst && (
          <div className="group/avatar relative">
            {isUser ? (
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sage-500 to-sage-600 shadow-md shadow-sage-500/25 transition-all duration-300 group-hover/avatar:scale-110 group-hover/avatar:shadow-lg">
                <User className="h-5 w-5 text-white" />
              </div>
            ) : (
              <Image
                src="/sage-logo.png"
                alt="Sage"
                width={40}
                height={40}
                className="h-10 w-10 object-contain transition-all duration-300 group-hover/avatar:scale-110"
              />
            )}
            {!isUser && (
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-sage-500" />
            )}
          </div>
        )}
      </div>

      {/* Message content */}
      <div
        className={cn(
          "flex max-w-[75%] flex-col",
          isUser ? "items-end" : "items-start"
        )}
      >
        {/* Name and time - only on first message */}
        {isFirst && (
          <div
            className={cn(
              "mb-1.5 flex items-center gap-2 px-1",
              isUser && "flex-row-reverse"
            )}
          >
            <span className="text-sm font-semibold text-grey-900">
              {isUser ? "You" : "Sage"}
            </span>
            <span className="text-xs text-grey-400">
              {format(message.timestamp, "h:mm a")}
            </span>
          </div>
        )}

        {/* Images */}
        {message.images && message.images.length > 0 && (
          <div
            className={cn(
              "mb-2 grid gap-2",
              message.images.length === 1 ? "grid-cols-1" : "grid-cols-2",
              message.images.length > 2 && "grid-cols-2"
            )}
          >
            {message.images.map((img) => (
              <div
                key={img.id}
                className="relative aspect-square overflow-hidden rounded-xl border border-grey-200 shadow-sm"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.name}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {/* Bubble */}
        {message.content && (
          <div
            className={cn(
              "relative rounded-2xl px-4 py-3 transition-all duration-200",
              isUser
                ? "bg-gradient-to-br from-sage-500 to-sage-600 text-white shadow-md shadow-sage-500/20"
                : "bg-white text-grey-800 shadow-md shadow-grey-200/50 ring-1 ring-grey-100",
              isFirst && isUser && "rounded-tr-lg",
              isFirst && !isUser && "rounded-tl-lg",
              isLast && isUser && "rounded-br-lg",
              isLast && !isUser && "rounded-bl-lg",
              "group-hover:shadow-lg"
            )}
          >
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
              {message.content}
            </p>
          </div>
        )}

        {/* Action buttons - only for assistant messages on last message */}
        {!isUser && isLast && (
          <div className="mt-2 flex items-center gap-1 opacity-0 transition-all duration-200 group-hover:opacity-100">
            <button
              onClick={handleCopy}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-all",
                copied
                  ? "bg-sage-100 text-sage-700"
                  : "text-grey-400 hover:bg-grey-100 hover:text-grey-600"
              )}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </>
              )}
            </button>

            <div className="mx-1 h-4 w-px bg-grey-200" />

            <button
              onClick={() => setReaction(reaction === "up" ? null : "up")}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg transition-all",
                reaction === "up"
                  ? "bg-sage-100 text-sage-600"
                  : "text-grey-400 hover:bg-grey-100 hover:text-grey-600"
              )}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={() => setReaction(reaction === "down" ? null : "down")}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg transition-all",
                reaction === "down"
                  ? "bg-grey-200 text-grey-700"
                  : "text-grey-400 hover:bg-grey-100 hover:text-grey-600"
              )}
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </button>

            <button
              className="flex h-8 w-8 items-center justify-center rounded-lg text-grey-400 transition-all hover:bg-grey-100 hover:text-grey-600"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
