"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, User, Bell, Palette, Keyboard, Shield, CreditCard } from "lucide-react";
import { cn } from "@/lib/cn";

const settingsSections = [
  {
    id: "profile",
    title: "Profile",
    description: "Manage your account information",
    icon: User,
  },
  {
    id: "notifications",
    title: "Notifications",
    description: "Configure notification preferences",
    icon: Bell,
  },
  {
    id: "appearance",
    title: "Appearance",
    description: "Customize the look and feel",
    icon: Palette,
  },
  {
    id: "shortcuts",
    title: "Keyboard Shortcuts",
    description: "View and customize shortcuts",
    icon: Keyboard,
  },
  {
    id: "privacy",
    title: "Privacy & Security",
    description: "Manage your privacy settings",
    icon: Shield,
  },
  {
    id: "billing",
    title: "Billing & Plans",
    description: "Manage your subscription",
    icon: CreditCard,
  },
];

export default function SettingsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-sage-50/50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-grey-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center gap-4 px-4 py-4">
          <button
            onClick={() => router.push("/")}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-grey-600 transition-colors hover:bg-grey-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-serif text-xl font-semibold text-grey-900">Settings</h1>
            <p className="text-sm text-grey-500">Manage your preferences</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="space-y-3">
          {settingsSections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                className="flex w-full items-center gap-4 rounded-2xl border border-grey-200 bg-white p-4 text-left transition-all hover:border-sage-200 hover:shadow-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-grey-100">
                  <Icon className="h-6 w-6 text-grey-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-grey-900">{section.title}</p>
                  <p className="text-sm text-grey-500">{section.description}</p>
                </div>
                <div className="rounded-lg bg-sage-100 px-2 py-1 text-xs font-medium text-sage-700">
                  Coming Soon
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl border border-grey-200 bg-grey-50/50 p-6 text-center">
          <p className="text-grey-600">
            Settings are coming soon. For now, you can manage basic preferences from the sidebar.
          </p>
        </div>
      </div>
    </div>
  );
}
