"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useTerminalStore } from "@/stores/terminalStore";
import { getWebContainer, spawnShell, initialFiles } from "@/lib/webcontainer";
import { cn } from "@/lib/cn";
import { Terminal as TerminalIcon, Circle, RotateCcw, Loader2 } from "lucide-react";

export function TerminalView() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<any>(null);
  const fitAddonRef = useRef<any>(null);
  const shellRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);

  const { isBooting, isReady, error, setBooting, setReady, setError, setWebContainer } =
    useTerminalStore();

  const initTerminal = useCallback(async () => {
    if (!terminalRef.current || xtermRef.current) return;

    setBooting(true);
    setError(null);

    try {
      // Dynamically import xterm to avoid SSR issues
      const { Terminal } = await import("@xterm/xterm");
      const { FitAddon } = await import("@xterm/addon-fit");

      // Create terminal instance
      const terminal = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: '"JetBrains Mono", monospace',
        theme: {
          background: "#fafafa",
          foreground: "#374151",
          cursor: "#6b9b76",
          cursorAccent: "#ffffff",
          selectionBackground: "#6b9b7640",
          black: "#374151",
          red: "#9b6b6b",
          green: "#6b9b76",
          yellow: "#9b966b",
          blue: "#6b7d9b",
          magenta: "#8b6b9b",
          cyan: "#6b959b",
          white: "#9ca3af",
          brightBlack: "#6b7280",
          brightRed: "#b08080",
          brightGreen: "#80b08a",
          brightYellow: "#b0ab80",
          brightBlue: "#8090b0",
          brightMagenta: "#a080b0",
          brightCyan: "#80a8b0",
          brightWhite: "#d1d5db",
        },
        allowProposedApi: true,
      });

      const fitAddon = new FitAddon();
      terminal.loadAddon(fitAddon);
      terminal.open(terminalRef.current);
      fitAddon.fit();

      xtermRef.current = terminal;
      fitAddonRef.current = fitAddon;

      // Write welcome message
      terminal.writeln("\x1b[32m╭─────────────────────────────────────────╮\x1b[0m");
      terminal.writeln("\x1b[32m│\x1b[0m   \x1b[1mSage Terminal\x1b[0m - Linux Environment    \x1b[32m│\x1b[0m");
      terminal.writeln("\x1b[32m╰─────────────────────────────────────────╯\x1b[0m");
      terminal.writeln("");
      terminal.writeln("\x1b[33mBooting WebContainer...\x1b[0m");

      // Boot WebContainer
      const webcontainer = await getWebContainer();
      setWebContainer(webcontainer);

      // Mount initial files
      await webcontainer.mount(initialFiles);

      terminal.writeln("\x1b[32m✓ WebContainer ready!\x1b[0m");
      terminal.writeln("");

      // Spawn shell
      const shell = await spawnShell(webcontainer, (data) => {
        terminal.write(data);
      });

      shellRef.current = shell;

      // Handle terminal input
      terminal.onData((data) => {
        shell.write(data);
      });

      // Handle resize
      terminal.onResize(({ cols, rows }) => {
        shell.resize(cols, rows);
      });

      setReady(true);
    } catch (err) {
      console.error("Terminal initialization error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to initialize terminal";
      setError(errorMessage);

      if (xtermRef.current) {
        xtermRef.current.writeln(`\x1b[31m✗ Error: ${errorMessage}\x1b[0m`);
        xtermRef.current.writeln("\x1b[33mNote: WebContainers require specific browser headers.\x1b[0m");
        xtermRef.current.writeln("\x1b[33mThis feature works in development but may need\x1b[0m");
        xtermRef.current.writeln("\x1b[33mspecial configuration for production deployment.\x1b[0m");
      }
    } finally {
      setBooting(false);
    }
  }, [setBooting, setReady, setError, setWebContainer]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Initialize on mount
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && terminalRef.current && !xtermRef.current) {
      initTerminal();
    }
  }, [mounted, initTerminal]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (shellRef.current) {
        shellRef.current.kill();
      }
      if (xtermRef.current) {
        xtermRef.current.dispose();
      }
    };
  }, []);

  const handleRestart = () => {
    if (shellRef.current) {
      shellRef.current.kill();
    }
    if (xtermRef.current) {
      xtermRef.current.dispose();
      xtermRef.current = null;
    }
    shellRef.current = null;
    fitAddonRef.current = null;
    setReady(false);
    initTerminal();
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      {/* Header */}
      <div className="relative flex h-11 items-center justify-between border-b border-grey-100 bg-grey-50/50 px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-grey-100">
            <TerminalIcon className="h-4 w-4 text-grey-600" />
          </div>
          <span className="text-sm font-medium text-grey-700">Terminal</span>
          <span className="rounded-full bg-sage-100 px-2 py-0.5 text-xs font-medium text-sage-700">
            jsh
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleRestart}
            disabled={isBooting}
            className="flex h-7 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-grey-400 transition-all hover:bg-grey-100 hover:text-grey-600 disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restart
          </button>
        </div>
      </div>

      {/* Terminal */}
      <div className="relative flex-1 overflow-hidden bg-grey-50">
        <div
          ref={terminalRef}
          className="h-full w-full p-2"
          style={{ minHeight: "200px" }}
        />

        {/* Loading overlay */}
        {isBooting && !xtermRef.current && (
          <div className="absolute inset-0 flex items-center justify-center bg-grey-50">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-sage-500" />
              <span className="text-sm text-grey-500">Booting Linux environment...</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex h-8 items-center justify-between border-t border-grey-200 bg-white px-4">
        <div className="flex items-center gap-2">
          <Circle
            className={cn(
              "h-2 w-2",
              isReady
                ? "fill-sage-500 text-sage-500"
                : error
                ? "fill-grey-400 text-grey-400"
                : "fill-sage-300 text-sage-300 animate-pulse"
            )}
          />
          <span className="text-xs text-grey-500">
            {isBooting ? "Booting..." : isReady ? "Connected" : error ? "Error" : "Initializing..."}
          </span>
        </div>
        <span className="font-mono text-xs text-grey-400">WebContainer</span>
      </div>
    </div>
  );
}
