"use client";

import { useCallback, useState, useEffect } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useAuthStore } from "@/stores/authStore";
import { ResizeHandle, SearchModal } from "@/components/ui";
import { ChatPanel } from "@/components/chat";
import { WorkspacePanel } from "@/components/workspace";
import { AuthModal } from "@/components/auth";
import { Sidebar } from "./Sidebar";
import { useKeyboardShortcuts } from "@/hooks";
import { useSearchStore } from "@/stores/searchStore";

export function MainLayout() {
  // Enable global keyboard shortcuts
  useKeyboardShortcuts();
  const { leftPanelWidth, setLeftPanelWidth } = useUIStore();
  const { isAuthenticated, isLoading } = useAuthStore();
  const { isOpen: isSearchOpen, closeSearch } = useSearchStore();
  const [mounted, setMounted] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show auth modal if not authenticated after loading
  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) {
      setShowAuthModal(true);
    } else if (isAuthenticated) {
      setShowAuthModal(false);
    }
  }, [mounted, isLoading, isAuthenticated]);

  const handleResize = useCallback(
    (delta: number) => {
      setLeftPanelWidth(leftPanelWidth + delta);
    },
    [leftPanelWidth, setLeftPanelWidth]
  );

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-sage-200 border-t-sage-500" />
      </div>
    );
  }

  return (
    <>
      <div className="flex h-screen w-screen overflow-hidden bg-white">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Chat */}
          <aside
            className="flex-shrink-0 overflow-hidden border-r border-grey-200"
            style={{ width: `${leftPanelWidth}%` }}
          >
            <ChatPanel />
          </aside>

          {/* Resize Handle */}
          <ResizeHandle orientation="vertical" onResize={handleResize} />

          {/* Right Panel - Workspace */}
          <main className="flex flex-1 flex-col overflow-hidden bg-grey-50">
            <WorkspacePanel />
          </main>
        </div>
      </div>

      {/* Auth Modal - cannot be closed, must sign in */}
      <AuthModal isOpen={showAuthModal} />

      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={closeSearch} />
    </>
  );
}
