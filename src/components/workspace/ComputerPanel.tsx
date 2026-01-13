"use client";

import { useAgentStore } from "@/stores/agentStore";
import { Monitor, Search, Globe, ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export function ComputerPanel() {
  const { isExecuting, latestSearchResults, actions } = useAgentStore();

  // Get the most recent search action
  const recentSearchAction = [...actions].reverse().find(
    (a) => a.type === "searching" || a.type === "search_complete"
  );
  const isSearching = recentSearchAction?.status === "running";
  const searchQuery = recentSearchAction?.label?.replace('Searching "', '').replace('"', '').replace('...', '');

  // No activity state
  if (!isExecuting && latestSearchResults.length === 0) {
    return (
      <div className="relative flex h-full flex-col overflow-hidden bg-gradient-to-br from-grey-50 via-white to-grey-50">
        {/* Decorative background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-sage-100/30 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-sage-100/30 blur-3xl" />
        </div>

        {/* Empty state */}
        <div className="relative flex flex-1 items-center justify-center p-8">
          <div className="flex flex-col items-center text-center">
            <div className="group relative mb-6">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-sage-200/50 to-sage-300/30 opacity-0 blur-xl transition-all duration-700 group-hover:opacity-100" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-sage-500 to-sage-600 shadow-2xl shadow-sage-500/25 transition-all duration-500 group-hover:scale-105">
                <Monitor className="h-12 w-12 text-white" />
              </div>
            </div>

            <h3 className="font-serif text-2xl font-semibold text-grey-900">
              Agent Desktop
            </h3>
            <p className="mt-2 max-w-xs text-sm text-grey-500">
              Search results and web findings will appear here when the agent is working.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              {["Live search", "Web results", "Sources"].map((feature) => (
                <span
                  key={feature}
                  className="rounded-full border border-grey-200 bg-white px-3 py-1.5 text-xs font-medium text-grey-500 shadow-sm"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Taskbar */}
        <div className="relative flex h-12 items-center justify-between border-t border-grey-200 bg-white px-4">
          <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-sage-200 to-transparent" />
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-grey-300" />
            <span className="text-xs font-medium text-grey-500">Idle</span>
          </div>
          <span className="rounded-full bg-sage-50 px-2.5 py-1 text-xs font-medium text-sage-700">
            sage-ai
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-grey-100 bg-gradient-to-r from-sage-50 to-white px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sage-500 to-sage-600 shadow-md shadow-sage-500/20">
          <Search className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-medium text-grey-900">Web Search</h2>
          {searchQuery && (
            <p className="text-xs text-grey-500 truncate">
              {isSearching ? "Searching: " : "Results for: "}{searchQuery}
            </p>
          )}
        </div>
        {isSearching && (
          <div className="flex items-center gap-2 rounded-full bg-sage-100 px-3 py-1 text-xs font-medium text-sage-700">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Searching...
          </div>
        )}
      </div>

      {/* Search Results */}
      <div className="flex-1 overflow-y-auto p-4">
        {latestSearchResults.length === 0 && isSearching ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Loader2 className="h-8 w-8 animate-spin text-sage-500 mb-4" />
            <p className="text-sm text-grey-500">Searching the web...</p>
          </div>
        ) : latestSearchResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Globe className="h-8 w-8 text-grey-300 mb-4" />
            <p className="text-sm text-grey-500">No results found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {latestSearchResults.map((result, index) => (
              <div
                key={index}
                className="group rounded-lg border border-grey-200 bg-white p-3 transition-all hover:border-sage-200 hover:shadow-sm"
              >
                <div className="flex items-start gap-3">
                  {/* Favicon */}
                  <div className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded overflow-hidden bg-grey-100">
                    {result.favicon ? (
                      <img
                        src={result.favicon}
                        alt=""
                        className="h-5 w-5"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <Globe className={`h-4 w-4 text-grey-400 ${result.favicon ? 'hidden' : ''}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-grey-900 text-sm line-clamp-1">
                      {result.title}
                    </h3>
                    <p className="text-xs text-grey-600 line-clamp-2 mt-1">
                      {result.content}
                    </p>
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-sage-600 hover:text-sage-700 mt-1"
                    >
                      Read more
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="relative flex h-12 items-center justify-between border-t border-grey-200 bg-grey-50/50 px-4">
        <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-sage-200 to-transparent" />
        <div className="flex items-center gap-2">
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
        <span className="text-xs text-grey-500">
          {latestSearchResults.length} result{latestSearchResults.length !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}
