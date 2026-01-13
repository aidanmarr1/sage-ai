"use client";

import { useCallback, useState, useEffect } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useAuthStore } from "@/stores/authStore";
import { ResizeHandle, SearchModal, CommandPalette, MobileWorkspaceSheet, MobileWorkspaceTrigger } from "@/components/ui";
import { ChatPanel } from "@/components/chat";
import { WorkspacePanel } from "@/components/workspace";
import { AuthModal } from "@/components/auth";
import { Sidebar } from "./Sidebar";
import { MobileHeader } from "./MobileHeader";
import { useKeyboardShortcuts } from "@/hooks";
import { useSearchStore } from "@/stores/searchStore";
import { useCommandPaletteStore } from "@/stores/commandPaletteStore";

export function MainLayout() {
  // Enable global keyboard shortcuts
  useKeyboardShortcuts();
  const { leftPanelWidth, setLeftPanelWidth } = useUIStore();
  const { isAuthenticated, isLoading } = useAuthStore();
  const { isOpen: isSearchOpen, closeSearch } = useSearchStore();
  const { isOpen: isPaletteOpen, closePalette } = useCommandPaletteStore();
  const [mounted, setMounted] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileWorkspaceOpen, setMobileWorkspaceOpen] = useState(false);

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
      <div className="flex h-screen w-screen flex-col md:flex-row overflow-hidden bg-white">
        {/* Mobile Header */}
        <MobileHeader
          onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          isMenuOpen={mobileMenuOpen}
        />

        {/* Mobile sidebar overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 top-14 z-40">
            <div
              className="absolute inset-0 bg-grey-900/50"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative h-full w-64 animate-slide-in-left">
              <Sidebar />
            </div>
          </div>
        )}

        {/* Sidebar - hidden on mobile */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Chat - full width on mobile */}
          <aside
            className="flex-shrink-0 overflow-hidden border-r border-grey-200 w-full md:w-auto"
            style={{ width: typeof window !== 'undefined' && window.innerWidth >= 768 ? `${leftPanelWidth}%` : '100%' }}
          >
            <ChatPanel />
          </aside>

          {/* Resize Handle - hidden on mobile */}
          <div className="hidden md:block">
            <ResizeHandle orientation="vertical" onResize={handleResize} />
          </div>

          {/* Right Panel - Workspace - hidden on mobile */}
          <main className="hidden md:flex flex-1 flex-col overflow-hidden bg-grey-50">
            <WorkspacePanel />
          </main>
        </div>
      </div>

      {/* Auth Modal - cannot be closed, must sign in */}
      <AuthModal isOpen={showAuthModal} />

      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={closeSearch} />

      {/* Command Palette */}
      <CommandPalette isOpen={isPaletteOpen} onClose={closePalette} />

      {/* Mobile Workspace Trigger */}
      <MobileWorkspaceTrigger onClick={() => setMobileWorkspaceOpen(true)} />

      {/* Mobile Workspace Sheet */}
      <MobileWorkspaceSheet
        isOpen={mobileWorkspaceOpen}
        onClose={() => setMobileWorkspaceOpen(false)}
      >
        <WorkspacePanel />
      </MobileWorkspaceSheet>
    </>
  );
}
