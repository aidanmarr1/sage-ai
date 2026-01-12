"use client";

import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/cn";
import { X, Mail, Lock, User, Loader2, Sparkles } from "lucide-react";
import Image from "next/image";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login, signup } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      let result;
      if (mode === "login") {
        result = await login(email, password);
      } else {
        result = await signup(email, password, name);
      }

      if (result.success) {
        onClose();
        setEmail("");
        setPassword("");
        setName("");
      } else {
        setError(result.error || "Something went wrong");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-grey-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md animate-fade-in rounded-3xl bg-white p-8 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-grey-400 transition-colors hover:bg-grey-100 hover:text-grey-600"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <Image
            src="/sage-logo.png"
            alt="Sage"
            width={120}
            height={48}
            className="h-12 w-auto object-contain"
          />
        </div>

        {/* Title */}
        <h2 className="mb-2 text-center font-serif text-2xl font-semibold text-grey-900">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h2>
        <p className="mb-6 text-center text-sm text-grey-500">
          {mode === "login"
            ? "Sign in to continue to Sage"
            : "Start your journey with Sage"}
        </p>

        {/* Error message */}
        {error && (
          <div className="mb-4 rounded-xl bg-grey-100 px-4 py-3 text-sm text-grey-700">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-grey-700">
                Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-grey-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  className="w-full rounded-xl border border-grey-200 bg-white py-3 pl-11 pr-4 text-grey-900 placeholder:text-grey-400 focus:border-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-100"
                />
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-grey-700">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-grey-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-xl border border-grey-200 bg-white py-3 pl-11 pr-4 text-grey-900 placeholder:text-grey-400 focus:border-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-grey-700">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-grey-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
                required
                minLength={6}
                className="w-full rounded-xl border border-grey-200 bg-white py-3 pl-11 pr-4 text-grey-900 placeholder:text-grey-400 focus:border-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sage-500 to-sage-600 py-3 font-medium text-white shadow-lg shadow-sage-500/25 transition-all hover:shadow-xl hover:shadow-sage-500/30 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                {mode === "login" ? "Sign in" : "Create account"}
              </>
            )}
          </button>
        </form>

        {/* Toggle mode */}
        <p className="mt-6 text-center text-sm text-grey-500">
          {mode === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                onClick={() => {
                  setMode("signup");
                  setError("");
                }}
                className="font-medium text-sage-600 hover:text-sage-700"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
                className="font-medium text-sage-600 hover:text-sage-700"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
