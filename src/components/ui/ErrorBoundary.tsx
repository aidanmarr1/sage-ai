"use client";

import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex h-full min-h-[400px] flex-col items-center justify-center p-8 bg-gradient-to-br from-grey-50 via-white to-grey-50">
          <div className="flex flex-col items-center text-center max-w-md">
            {/* Icon */}
            <div className="relative mb-6">
              <div className="absolute -inset-4 rounded-full bg-grey-200/50 blur-xl" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-grey-100 shadow-inner">
                <AlertTriangle className="h-10 w-10 text-grey-400" />
              </div>
            </div>

            {/* Message */}
            <h3 className="font-serif text-2xl font-semibold text-grey-900">
              Something went wrong
            </h3>
            <p className="mt-2 text-sm text-grey-500">
              We encountered an unexpected error. This has been logged for review.
            </p>

            {/* Error details - collapsible */}
            {this.state.error && (
              <details className="mt-4 w-full rounded-xl border border-grey-200 bg-grey-50/50">
                <summary className="cursor-pointer px-4 py-2 text-xs font-medium text-grey-500 hover:text-grey-700">
                  View error details
                </summary>
                <div className="border-t border-grey-200 px-4 py-3">
                  <code className="block text-xs text-grey-600 font-mono break-all">
                    {this.state.error.message}
                  </code>
                </div>
              </details>
            )}

            {/* Actions */}
            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={this.handleRetry}
                className="flex items-center gap-2 rounded-full bg-sage-500 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-sage-500/20 transition-all hover:bg-sage-600 hover:shadow-lg active:scale-95"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex items-center gap-2 rounded-full border border-grey-200 bg-white px-5 py-2.5 text-sm font-medium text-grey-700 shadow-sm transition-all hover:bg-grey-50 hover:border-grey-300"
              >
                <Home className="h-4 w-4" />
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Inline error display for smaller areas
export function InlineError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-grey-200 bg-grey-50 px-4 py-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-grey-200">
        <AlertTriangle className="h-4 w-4 text-grey-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-grey-700 truncate">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-grey-500 transition-colors hover:bg-grey-200 hover:text-grey-700"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
