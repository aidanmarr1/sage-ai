"use client";

import { useAgentStore } from "@/stores/agentStore";
import { Monitor, Search, Globe, ExternalLink, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import { useState } from "react";

export function ComputerPanel() {
  const { isExecuting, latestSearchResults, actions, browserState } = useAgentStore();
  const [hoveredResult, setHoveredResult] = useState<number | null>(null);

  // Get the most recent search action
  const recentSearchAction = [...actions].reverse().find(
    (a) => a.type === "searching" || a.type === "search_complete" || a.type === "deep_searching"
  );
  const isSearching = recentSearchAction?.status === "running";
  const searchQuery = recentSearchAction?.label
    ?.replace(/^(Searching|Deep searching) "/, '')
    .replace(/".*$/, '')
    .trim();

  // Get the most recent browsing action
  const recentBrowseAction = [...actions].reverse().find(
    (a) => a.type === "browsing"
  );
  const isBrowsing = recentBrowseAction?.status === "running";

  // No activity state - beautiful empty state
  if (!isExecuting && latestSearchResults.length === 0 && !browserState.isActive) {
    return (
      <div className="relative flex h-full flex-col overflow-hidden bg-gradient-to-br from-grey-50 via-white to-grey-50">
        {/* Animated background orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-sage-100/40 blur-3xl animate-pulse" />
          <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-sage-200/30 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-sage-50/50 blur-3xl" />
        </div>

        {/* Empty state content */}
        <div className="relative flex flex-1 items-center justify-center p-8">
          <div className="flex flex-col items-center text-center max-w-sm">
            <div className="group relative mb-8">
              <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-sage-200/60 to-sage-300/40 opacity-0 blur-2xl transition-all duration-700 group-hover:opacity-100" />
              <div className="relative flex h-28 w-28 items-center justify-center rounded-[2rem] bg-gradient-to-br from-sage-500 to-sage-600 shadow-2xl shadow-sage-500/30 transition-all duration-500 group-hover:scale-105 group-hover:shadow-sage-500/40">
                <Monitor className="h-14 w-14 text-white" strokeWidth={1.5} />
              </div>
            </div>

            <h3 className="font-serif text-2xl font-semibold text-grey-900 mb-3">
              Agent Desktop
            </h3>
            <p className="text-grey-500 leading-relaxed">
              When the agent researches, search results and browsed content will appear here in real-time.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              {[
                { label: "Live Search", icon: Search },
                { label: "Web Browsing", icon: Globe },
                { label: "AI Analysis", icon: Sparkles },
              ].map(({ label, icon: Icon }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 rounded-full border border-grey-200 bg-white/80 backdrop-blur-sm px-4 py-2 text-sm text-grey-600 shadow-sm transition-all hover:border-sage-300 hover:shadow-md"
                >
                  <Icon className="h-4 w-4 text-sage-500" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div className="relative flex h-12 items-center justify-between border-t border-grey-200/80 bg-white/60 backdrop-blur-sm px-5">
          <div className="flex items-center gap-2.5">
            <div className="h-2.5 w-2.5 rounded-full bg-grey-300" />
            <span className="text-xs font-medium text-grey-500">Ready</span>
          </div>
          <span className="rounded-full bg-sage-100 px-3 py-1 text-xs font-semibold text-sage-700">
            sage
          </span>
        </div>
      </div>
    );
  }

  // Browser view - show when browsing is active
  if (browserState.isActive || browserState.status === "loading" || browserState.status === "complete" || isBrowsing) {
    return (
      <div className="flex h-full flex-col overflow-hidden bg-white">
        {/* Browser Header */}
        <div className="flex items-center gap-3 border-b border-grey-100 bg-gradient-to-r from-sage-50/80 to-white px-5 py-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sage-500 to-sage-600 shadow-lg shadow-sage-500/25">
            <Globe className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-grey-900">Live Browser</h2>
            {browserState.currentUrl && (
              <p className="text-xs text-grey-500 truncate mt-0.5">
                {browserState.currentUrl}
              </p>
            )}
          </div>
          {browserState.isActive && (
            <div className="flex items-center gap-2 rounded-full bg-sage-100 px-3.5 py-1.5 text-xs font-semibold text-sage-700">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sage-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-sage-500" />
              </span>
              Live
            </div>
          )}
        </div>

        {/* Browser Content */}
        <div className="flex-1 overflow-hidden bg-gradient-to-br from-grey-50 to-grey-100/50">
          {browserState.liveViewUrl ? (
            <div className="h-full w-full">
              <iframe
                src={browserState.liveViewUrl}
                className="h-full w-full border-0"
                allow="clipboard-read; clipboard-write"
                title="Live Browser View"
              />
            </div>
          ) : browserState.screenshot ? (
            <div className="h-full w-full p-4">
              <div className="relative h-full w-full overflow-hidden rounded-xl border border-grey-200 bg-white shadow-xl">
                {/* Screenshot browser chrome */}
                <div className="flex items-center gap-2 border-b border-grey-100 bg-grey-50 px-4 py-2.5">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-grey-300 transition-colors hover:bg-grey-400" />
                    <div className="h-3 w-3 rounded-full bg-grey-300 transition-colors hover:bg-grey-400" />
                    <div className="h-3 w-3 rounded-full bg-grey-300 transition-colors hover:bg-grey-400" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="flex items-center gap-2 rounded-lg bg-white border border-grey-200 px-3 py-1.5 text-xs text-grey-600">
                      <Globe className="h-3.5 w-3.5 text-grey-400" />
                      <span className="truncate">{browserState.currentUrl || "Loading..."}</span>
                    </div>
                  </div>
                </div>
                {/* Screenshot image */}
                <div className="relative h-[calc(100%-44px)] w-full overflow-auto">
                  <img
                    src={browserState.screenshot}
                    alt="Browser screenshot"
                    className="w-full object-contain"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center text-center px-8">
                {browserState.status === "loading" || browserState.isActive ? (
                  <>
                    <div className="relative mb-8">
                      <div className="absolute -inset-4 rounded-full bg-sage-200/50 blur-xl animate-pulse" />
                      <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-sage-500 to-sage-600 shadow-xl">
                        <Loader2 className="h-12 w-12 animate-spin text-white" strokeWidth={1.5} />
                      </div>
                    </div>
                    <h3 className="font-serif text-xl font-semibold text-grey-900">
                      Starting Browser
                    </h3>
                    <p className="mt-2 max-w-xs text-sm text-grey-500">
                      Launching cloud browser session...
                    </p>
                  </>
                ) : browserState.status === "complete" ? (
                  <>
                    <div className="relative mb-8">
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-sage-500 to-sage-600 shadow-xl">
                        <Globe className="h-12 w-12 text-white" strokeWidth={1.5} />
                      </div>
                    </div>
                    <h3 className="font-serif text-xl font-semibold text-grey-900">
                      Content Extracted
                    </h3>
                    <p className="mt-2 max-w-xs text-sm text-grey-500">
                      Successfully retrieved page content.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="relative mb-8">
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-grey-200 shadow-xl">
                        <Globe className="h-12 w-12 text-grey-400" strokeWidth={1.5} />
                      </div>
                    </div>
                    <h3 className="font-serif text-xl font-semibold text-grey-900">
                      Browse Failed
                    </h3>
                    <p className="mt-2 max-w-xs text-sm text-grey-500">
                      Could not start browser session.
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="relative flex h-12 items-center justify-between border-t border-grey-200 bg-white/80 backdrop-blur-sm px-5">
          <div className="flex items-center gap-2.5">
            {browserState.isActive || browserState.status === "loading" ? (
              <>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sage-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-sage-500" />
                </span>
                <span className="text-xs font-medium text-sage-600">
                  {browserState.liveViewUrl ? "Live" : "Starting..."}
                </span>
              </>
            ) : (
              <>
                <div className="h-2.5 w-2.5 rounded-full bg-sage-500" />
                <span className="text-xs font-medium text-grey-600">Complete</span>
              </>
            )}
          </div>
          <span className="text-xs text-grey-500">
            {browserState.liveViewUrl ? "Real-time view" : browserState.status === "loading" ? "Connecting..." : "Content ready"}
          </span>
        </div>
      </div>
    );
  }

  // Search results view
  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-grey-100 bg-gradient-to-r from-sage-50/80 to-white px-5 py-3.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sage-500 to-sage-600 shadow-lg shadow-sage-500/25">
          <Search className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-grey-900">Web Search</h2>
          {searchQuery && (
            <p className="text-xs text-grey-500 truncate mt-0.5">
              {isSearching ? `Searching: ${searchQuery}` : `Results for: ${searchQuery}`}
            </p>
          )}
        </div>
        {isSearching && (
          <div className="flex items-center gap-2 rounded-full bg-sage-100 px-3.5 py-1.5 text-xs font-semibold text-sage-700">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Searching
          </div>
        )}
      </div>

      {/* Search Results */}
      <div className="flex-1 overflow-y-auto p-4">
        {latestSearchResults.length === 0 && isSearching ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="animate-fade-in-up rounded-xl border border-grey-100 bg-white p-4"
                style={{ animationDelay: `${i * 75}ms` }}
              >
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg animate-shimmer flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded-lg animate-shimmer" />
                    <div className="h-3 w-full rounded animate-shimmer" />
                    <div className="h-3 w-2/3 rounded animate-shimmer" />
                  </div>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-center pt-6">
              <div className="flex items-center gap-3 text-sage-600 bg-sage-50 rounded-full px-5 py-2.5">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">Searching the web...</span>
              </div>
            </div>
          </div>
        ) : latestSearchResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-grey-100 mb-4">
              <Globe className="h-8 w-8 text-grey-300" />
            </div>
            <p className="text-grey-500 font-medium">No results found</p>
            <p className="text-xs text-grey-400 mt-1">Try a different search query</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {latestSearchResults.map((result, index) => (
              <div
                key={index}
                className={cn(
                  "group relative rounded-xl border bg-white p-4 transition-all duration-200 cursor-pointer",
                  hoveredResult === index
                    ? "border-sage-300 shadow-lg shadow-sage-500/10 scale-[1.01]"
                    : "border-grey-100 hover:border-grey-200 hover:shadow-md"
                )}
                style={{ animationDelay: `${index * 40}ms` }}
                onMouseEnter={() => setHoveredResult(index)}
                onMouseLeave={() => setHoveredResult(null)}
                onClick={() => window.open(result.url, '_blank')}
              >
                <div className="flex items-start gap-3">
                  {/* Favicon with fallback */}
                  <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-lg bg-grey-50 border border-grey-100 overflow-hidden group-hover:bg-sage-50 group-hover:border-sage-200 transition-colors">
                    {result.favicon ? (
                      <img
                        src={result.favicon}
                        alt=""
                        className="h-6 w-6"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <Globe className={cn("h-5 w-5 text-grey-400 group-hover:text-sage-500 transition-colors", result.favicon ? 'hidden' : '')} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-grey-900 text-sm line-clamp-1 group-hover:text-sage-700 transition-colors">
                      {result.title}
                    </h3>
                    <p className="text-xs text-grey-600 line-clamp-2 mt-1 leading-relaxed">
                      {result.content}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-grey-400 truncate">
                        {(() => {
                          try {
                            return new URL(result.url).hostname.replace('www.', '');
                          } catch {
                            return result.url.substring(0, 30);
                          }
                        })()}
                      </span>
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-sage-600 hover:text-sage-700 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-3 w-3" />
                        Open
                      </a>
                    </div>
                  </div>
                </div>

                {/* Hover indicator */}
                <div className={cn(
                  "absolute inset-y-0 left-0 w-1 rounded-l-xl bg-sage-500 transition-opacity",
                  hoveredResult === index ? "opacity-100" : "opacity-0"
                )} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="relative flex h-12 items-center justify-between border-t border-grey-100 bg-grey-50/50 px-5">
        <div className="flex items-center gap-2.5">
          {isExecuting ? (
            <>
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sage-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-sage-500" />
              </span>
              <span className="text-xs font-medium text-sage-600">Working</span>
            </>
          ) : (
            <>
              <div className="h-2.5 w-2.5 rounded-full bg-sage-500" />
              <span className="text-xs font-medium text-grey-600">Ready</span>
            </>
          )}
        </div>
        <span className="text-xs text-grey-500 font-medium">
          {latestSearchResults.length} result{latestSearchResults.length !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}
