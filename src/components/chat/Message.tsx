"use client";

import { memo, useState, useCallback, useMemo } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/cn";
import type { Message as MessageType } from "@/types";
import { useChatStore } from "@/stores/chatStore";
import {
  User,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Code,
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Play,
  Terminal,
  Maximize2,
} from "lucide-react";
import Image from "next/image";

interface MessageProps {
  message: MessageType;
  isFirst?: boolean;
  isLast?: boolean;
}

// Language display names and icons
const languageConfig: Record<string, { name: string; color: string }> = {
  javascript: { name: "JavaScript", color: "bg-yellow-100 text-yellow-700" },
  typescript: { name: "TypeScript", color: "bg-blue-100 text-blue-700" },
  python: { name: "Python", color: "bg-green-100 text-green-700" },
  jsx: { name: "JSX", color: "bg-cyan-100 text-cyan-700" },
  tsx: { name: "TSX", color: "bg-blue-100 text-blue-700" },
  html: { name: "HTML", color: "bg-orange-100 text-orange-700" },
  css: { name: "CSS", color: "bg-pink-100 text-pink-700" },
  json: { name: "JSON", color: "bg-grey-100 text-grey-700" },
  bash: { name: "Bash", color: "bg-grey-100 text-grey-700" },
  shell: { name: "Shell", color: "bg-grey-100 text-grey-700" },
  sql: { name: "SQL", color: "bg-purple-100 text-purple-700" },
  markdown: { name: "Markdown", color: "bg-grey-100 text-grey-700" },
  yaml: { name: "YAML", color: "bg-red-100 text-red-700" },
  go: { name: "Go", color: "bg-cyan-100 text-cyan-700" },
  rust: { name: "Rust", color: "bg-orange-100 text-orange-700" },
  java: { name: "Java", color: "bg-red-100 text-red-700" },
};

// Code block component with syntax highlighting simulation
function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  const lines = code.split("\n");
  const isLong = lines.length > 15;
  const displayedCode = !expanded && isLong ? lines.slice(0, 10).join("\n") : code;

  const langConfig = language ? languageConfig[language.toLowerCase()] : null;

  return (
    <div className="group/code relative my-3 overflow-hidden rounded-xl border border-grey-200 bg-grey-900 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-grey-700 bg-grey-800 px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-grey-600" />
            <div className="h-3 w-3 rounded-full bg-grey-600" />
            <div className="h-3 w-3 rounded-full bg-grey-600" />
          </div>
          {langConfig && (
            <span className={cn("ml-2 rounded px-2 py-0.5 text-xs font-medium", langConfig.color)}>
              {langConfig.name}
            </span>
          )}
          {!langConfig && language && (
            <span className="ml-2 text-xs font-medium text-grey-400">{language}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex h-7 items-center gap-1 rounded-lg px-2 text-xs text-grey-400 transition-colors hover:bg-grey-700 hover:text-grey-200"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" />
                  Collapse
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" />
                  Expand ({lines.length} lines)
                </>
              )}
            </button>
          )}
          <button
            onClick={handleCopy}
            className={cn(
              "flex h-7 items-center gap-1 rounded-lg px-2 text-xs transition-colors",
              copied
                ? "bg-sage-600 text-white"
                : "text-grey-400 hover:bg-grey-700 hover:text-grey-200"
            )}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code content */}
      <div className="overflow-x-auto">
        <pre className="p-4">
          <code className="text-sm leading-relaxed text-grey-100 font-mono">
            {displayedCode.split("\n").map((line, i) => (
              <div key={i} className="flex">
                <span className="mr-4 select-none text-grey-600 w-8 text-right">
                  {i + 1}
                </span>
                <span className="flex-1">{line || " "}</span>
              </div>
            ))}
          </code>
        </pre>
      </div>

      {/* Collapse indicator */}
      {!expanded && isLong && (
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-grey-900 to-transparent pointer-events-none" />
      )}
    </div>
  );
}

// Inline code component
function InlineCode({ children }: { children: string }) {
  return (
    <code className="rounded-md bg-grey-100 px-1.5 py-0.5 text-sm font-mono text-sage-700">
      {children}
    </code>
  );
}

// Parse and render markdown content
function MarkdownContent({ content }: { content: string }) {
  const elements = useMemo(() => {
    const parts: React.ReactNode[] = [];
    let currentIndex = 0;

    // Find code blocks
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > currentIndex) {
        const textBefore = content.slice(currentIndex, match.index);
        parts.push(<TextContent key={`text-${currentIndex}`} text={textBefore} />);
      }

      // Add code block
      parts.push(
        <CodeBlock
          key={`code-${match.index}`}
          language={match[1]}
          code={match[2].trim()}
        />
      );

      currentIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (currentIndex < content.length) {
      parts.push(
        <TextContent key={`text-${currentIndex}`} text={content.slice(currentIndex)} />
      );
    }

    return parts.length > 0 ? parts : <TextContent text={content} />;
  }, [content]);

  return <div className="space-y-1">{elements}</div>;
}

// Text content with inline formatting
function TextContent({ text }: { text: string }) {
  const elements = useMemo(() => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    // Match inline code, bold, italic, links
    const inlineRegex = /`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)]+)\)/g;
    let match;

    while ((match = inlineRegex.exec(text)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      if (match[1]) {
        // Inline code
        parts.push(<InlineCode key={match.index}>{match[1]}</InlineCode>);
      } else if (match[2]) {
        // Bold
        parts.push(
          <strong key={match.index} className="font-semibold">
            {match[2]}
          </strong>
        );
      } else if (match[3]) {
        // Italic
        parts.push(
          <em key={match.index} className="italic">
            {match[3]}
          </em>
        );
      } else if (match[4] && match[5]) {
        // Link
        parts.push(
          <a
            key={match.index}
            href={match[5]}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sage-600 hover:text-sage-700 underline decoration-sage-300 underline-offset-2 transition-colors"
          >
            {match[4]}
            <ExternalLink className="h-3 w-3" />
          </a>
        );
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  }, [text]);

  // Split by paragraphs
  if (typeof elements === "string") {
    return (
      <div className="space-y-2">
        {elements.split("\n\n").map((para, i) => (
          <p key={i} className="whitespace-pre-wrap text-[15px] leading-relaxed">
            {para}
          </p>
        ))}
      </div>
    );
  }

  return (
    <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{elements}</p>
  );
}

// Image lightbox
function ImageLightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: { id: string; url: string; name: string }[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-grey-900/90 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[currentIndex].url}
          alt={images[currentIndex].name}
          className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
        />
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 h-10 w-10 rounded-full bg-white shadow-lg flex items-center justify-center text-grey-600 hover:bg-grey-100 transition-colors"
        >
          ×
        </button>
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={cn(
                  "h-2 w-2 rounded-full transition-colors",
                  i === currentIndex ? "bg-white" : "bg-white/50"
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export const Message = memo(function Message({
  message,
  isFirst = true,
  isLast = true,
}: MessageProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [reaction, setReaction] = useState<"up" | "down" | null>(null);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const { addMessage, setTyping } = useChatStore();

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [message.content]);

  const handleRegenerate = useCallback(() => {
    // Simulate regeneration - in production, this would call the API
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      addMessage({
        role: "assistant",
        content: "Here's an alternative response to your question. Let me know if this helps!",
        status: "sent",
      });
    }, 1500);
  }, [setTyping, addMessage]);

  const handleImageClick = useCallback((index: number) => {
    setLightboxIndex(index);
    setShowLightbox(true);
  }, []);

  const handleReaction = useCallback((type: "up" | "down") => {
    setReaction((prev) => (prev === type ? null : type));
  }, []);

  return (
    <>
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
            "flex max-w-[80%] flex-col",
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
              {!isUser && (
                <span className="flex items-center gap-1 text-xs text-sage-600 bg-sage-50 px-2 py-0.5 rounded-full">
                  <Sparkles className="h-3 w-3" />
                  AI
                </span>
              )}
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
                message.images.length === 1
                  ? "grid-cols-1"
                  : message.images.length === 2
                  ? "grid-cols-2"
                  : "grid-cols-2"
              )}
            >
              {message.images.map((img, index) => (
                <button
                  key={img.id}
                  onClick={() => handleImageClick(index)}
                  className="group/img relative aspect-square overflow-hidden rounded-xl border border-grey-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.name}
                    className="h-full w-full object-cover transition-transform group-hover/img:scale-105"
                  />
                  <div className="absolute inset-0 bg-grey-900/0 group-hover/img:bg-grey-900/20 transition-colors flex items-center justify-center">
                    <Maximize2 className="h-6 w-6 text-white opacity-0 group-hover/img:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Bubble */}
          {message.content && (
            <div
              className={cn(
                "relative rounded-2xl px-4 py-3 transition-all duration-200",
                message.status === "error"
                  ? "bg-grey-100 text-grey-600 ring-1 ring-grey-200"
                  : isUser
                  ? "bg-gradient-to-br from-sage-500 to-sage-600 text-white shadow-md shadow-sage-500/20"
                  : "bg-white text-grey-800 shadow-md shadow-grey-200/50 ring-1 ring-grey-100",
                isFirst && isUser && "rounded-tr-lg",
                isFirst && !isUser && "rounded-tl-lg",
                isLast && isUser && "rounded-br-lg",
                isLast && !isUser && "rounded-bl-lg",
                "group-hover:shadow-lg"
              )}
            >
              {message.status === "error" && (
                <div className="flex items-center gap-2 mb-2 text-grey-500">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-xs font-medium">Failed to send</span>
                </div>
              )}

              {/* Render content with markdown support for assistant messages */}
              {isUser ? (
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
                  {message.content}
                </p>
              ) : (
                <MarkdownContent content={message.content} />
              )}

              {message.status === "error" && (
                <button className="mt-2 flex items-center gap-1.5 text-xs font-medium text-sage-600 hover:text-sage-700 transition-colors">
                  <RefreshCw className="h-3 w-3" />
                  Retry
                </button>
              )}
              {message.status === "sending" && (
                <div className="mt-1.5 flex items-center gap-1 text-xs text-white/70">
                  <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/70" />
                  Sending...
                </div>
              )}
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
                onClick={() => handleReaction("up")}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg transition-all",
                  reaction === "up"
                    ? "bg-sage-100 text-sage-600"
                    : "text-grey-400 hover:bg-grey-100 hover:text-grey-600"
                )}
                title="Good response"
              >
                <ThumbsUp className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={() => handleReaction("down")}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg transition-all",
                  reaction === "down"
                    ? "bg-grey-200 text-grey-700"
                    : "text-grey-400 hover:bg-grey-100 hover:text-grey-600"
                )}
                title="Poor response"
              >
                <ThumbsDown className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={handleRegenerate}
                className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-grey-400 transition-all hover:bg-grey-100 hover:text-grey-600"
                title="Regenerate response"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Regenerate
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Image lightbox */}
      {showLightbox && message.images && (
        <ImageLightbox
          images={message.images}
          initialIndex={lightboxIndex}
          onClose={() => setShowLightbox(false)}
        />
      )}
    </>
  );
});

Message.displayName = "Message";
