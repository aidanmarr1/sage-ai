"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Bell,
  Palette,
  Keyboard,
  Shield,
  CreditCard,
  ChevronDown,
  ChevronRight,
  Check,
  Camera,
  Mail,
  Lock,
  Download,
  Trash2,
  Zap,
  Rocket,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useAuthStore } from "@/stores/authStore";

// ============================================================================
// COMPONENTS
// ============================================================================

function Toggle({
  enabled,
  onChange,
  disabled = false,
}: {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!enabled)}
      className={cn(
        "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-sage-500 focus:ring-offset-2",
        enabled ? "bg-sage-500" : "bg-grey-200",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
          enabled ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}

function SettingSection({
  id,
  title,
  description,
  icon: Icon,
  children,
  isOpen,
  onToggle,
}: {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-2xl border border-grey-200 bg-white overflow-hidden transition-all">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-grey-50"
      >
        <div className={cn(
          "flex h-12 w-12 items-center justify-center rounded-xl transition-colors",
          isOpen ? "bg-sage-100" : "bg-grey-100"
        )}>
          <Icon className={cn("h-6 w-6", isOpen ? "text-sage-600" : "text-grey-600")} />
        </div>
        <div className="flex-1">
          <p className="font-medium text-grey-900">{title}</p>
          <p className="text-sm text-grey-500">{description}</p>
        </div>
        <ChevronDown
          className={cn(
            "h-5 w-5 text-grey-400 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>
      <div
        className={cn(
          "grid transition-all duration-200",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-grey-100 p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

function InputField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  disabled = false,
  readOnly = false,
  hint,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-grey-700 mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        className={cn(
          "w-full rounded-xl border border-grey-200 px-4 py-2.5 text-grey-900 transition-all placeholder:text-grey-400",
          "focus:border-sage-300 focus:outline-none focus:ring-4 focus:ring-sage-100/50",
          (disabled || readOnly) && "bg-grey-50 cursor-not-allowed"
        )}
      />
      {hint && <p className="mt-1.5 text-xs text-grey-500">{hint}</p>}
    </div>
  );
}

function RadioOption({
  label,
  description,
  selected,
  onSelect,
}: {
  label: string;
  description?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all w-full",
        selected
          ? "border-sage-500 bg-sage-50"
          : "border-grey-200 hover:border-grey-300"
      )}
    >
      <div
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full border-2 flex-shrink-0 mt-0.5",
          selected ? "border-sage-500 bg-sage-500" : "border-grey-300"
        )}
      >
        {selected && <Check className="h-3 w-3 text-white" />}
      </div>
      <div>
        <p className={cn("font-medium", selected ? "text-sage-900" : "text-grey-900")}>
          {label}
        </p>
        {description && (
          <p className="text-sm text-grey-500 mt-0.5">{description}</p>
        )}
      </div>
    </button>
  );
}

// ============================================================================
// KEYBOARD SHORTCUTS DATA
// ============================================================================

const keyboardShortcuts = [
  { keys: ["⌘", "N"], action: "New Task" },
  { keys: ["⌘", "K"], action: "Search" },
  { keys: ["⌘", "B"], action: "Toggle Sidebar" },
  { keys: ["⌘", "\\"], action: "Toggle Workspace" },
  { keys: ["Enter"], action: "Send Message" },
  { keys: ["Shift", "Enter"], action: "New Line" },
  { keys: ["Esc"], action: "Cancel" },
  { keys: ["?"], action: "Open Help" },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  // Section states
  const [openSection, setOpenSection] = useState<string | null>("profile");

  // Profile state
  const [displayName, setDisplayName] = useState(user?.name || "");
  const [email] = useState(user?.email || "");

  // Notification state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [taskCompletionAlerts, setTaskCompletionAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  // Appearance state
  const [fontSize, setFontSize] = useState<"small" | "medium" | "large">("medium");
  const [messageDensity, setMessageDensity] = useState<"compact" | "default" | "spacious">("default");

  // Privacy state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? null : id);
  };

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
          {/* Profile Section */}
          <SettingSection
            id="profile"
            title="Profile"
            description="Manage your account information"
            icon={User}
            isOpen={openSection === "profile"}
            onToggle={() => toggleSection("profile")}
          >
            <div className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-sage-400 to-sage-600 text-2xl font-semibold text-white">
                    {displayName ? displayName[0].toUpperCase() : user?.email?.[0].toUpperCase() || "U"}
                  </div>
                  <button className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-white border border-grey-200 shadow-sm hover:bg-grey-50 transition-colors">
                    <Camera className="h-4 w-4 text-grey-600" />
                  </button>
                </div>
                <div>
                  <p className="font-medium text-grey-900">Profile Photo</p>
                  <p className="text-sm text-grey-500">Click the camera to upload</p>
                </div>
              </div>

              {/* Form Fields */}
              <InputField
                label="Display Name"
                value={displayName}
                onChange={setDisplayName}
                placeholder="Enter your name"
              />

              <div>
                <label className="block text-sm font-medium text-grey-700 mb-1.5">
                  Email Address
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={email}
                    readOnly
                    className="flex-1 rounded-xl border border-grey-200 bg-grey-50 px-4 py-2.5 text-grey-600 cursor-not-allowed"
                  />
                  <span className="flex items-center gap-1 rounded-full bg-sage-100 px-2.5 py-1 text-xs font-medium text-sage-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Verified
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-grey-100">
                <p className="text-xs text-grey-500">
                  Member since {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </p>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button className="rounded-xl bg-sage-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sage-600">
                  Save Changes
                </button>
              </div>
            </div>
          </SettingSection>

          {/* Notifications Section */}
          <SettingSection
            id="notifications"
            title="Notifications"
            description="Configure notification preferences"
            icon={Bell}
            isOpen={openSection === "notifications"}
            onToggle={() => toggleSection("notifications")}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-grey-900">Email Notifications</p>
                  <p className="text-sm text-grey-500">Receive notifications via email</p>
                </div>
                <Toggle enabled={emailNotifications} onChange={setEmailNotifications} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-grey-900">Task Completion Alerts</p>
                  <p className="text-sm text-grey-500">Get notified when tasks are completed</p>
                </div>
                <Toggle enabled={taskCompletionAlerts} onChange={setTaskCompletionAlerts} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-grey-900">Weekly Digest</p>
                  <p className="text-sm text-grey-500">Receive a weekly summary of your activity</p>
                </div>
                <Toggle enabled={weeklyDigest} onChange={setWeeklyDigest} />
              </div>

              <div className="rounded-xl border border-grey-200 bg-grey-50 p-4">
                <p className="text-sm text-grey-600">
                  Notification settings will be saved automatically when changed.
                </p>
              </div>
            </div>
          </SettingSection>

          {/* Appearance Section */}
          <SettingSection
            id="appearance"
            title="Appearance"
            description="Customize the look and feel"
            icon={Palette}
            isOpen={openSection === "appearance"}
            onToggle={() => toggleSection("appearance")}
          >
            <div className="space-y-6">
              {/* Font Size */}
              <div>
                <label className="block text-sm font-medium text-grey-700 mb-3">
                  Font Size
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <RadioOption
                    label="Small"
                    description="Compact text"
                    selected={fontSize === "small"}
                    onSelect={() => setFontSize("small")}
                  />
                  <RadioOption
                    label="Medium"
                    description="Default size"
                    selected={fontSize === "medium"}
                    onSelect={() => setFontSize("medium")}
                  />
                  <RadioOption
                    label="Large"
                    description="Larger text"
                    selected={fontSize === "large"}
                    onSelect={() => setFontSize("large")}
                  />
                </div>
              </div>

              {/* Message Density */}
              <div>
                <label className="block text-sm font-medium text-grey-700 mb-3">
                  Message Density
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <RadioOption
                    label="Compact"
                    selected={messageDensity === "compact"}
                    onSelect={() => setMessageDensity("compact")}
                  />
                  <RadioOption
                    label="Default"
                    selected={messageDensity === "default"}
                    onSelect={() => setMessageDensity("default")}
                  />
                  <RadioOption
                    label="Spacious"
                    selected={messageDensity === "spacious"}
                    onSelect={() => setMessageDensity("spacious")}
                  />
                </div>
              </div>

              {/* Dark Mode */}
              <div className="rounded-xl border border-sage-200 bg-sage-50 p-4 flex items-center gap-3">
                <Palette className="h-5 w-5 text-sage-600" />
                <div className="flex-1">
                  <p className="font-medium text-sage-900">Dark Mode</p>
                  <p className="text-sm text-sage-600">Coming soon</p>
                </div>
                <span className="rounded-full bg-sage-200 px-2.5 py-1 text-xs font-semibold text-sage-800">
                  Soon
                </span>
              </div>
            </div>
          </SettingSection>

          {/* Keyboard Shortcuts Section */}
          <SettingSection
            id="shortcuts"
            title="Keyboard Shortcuts"
            description="View and customize shortcuts"
            icon={Keyboard}
            isOpen={openSection === "shortcuts"}
            onToggle={() => toggleSection("shortcuts")}
          >
            <div className="space-y-4">
              <div className="rounded-xl border border-grey-200 overflow-hidden">
                <table className="w-full">
                  <tbody className="divide-y divide-grey-100">
                    {keyboardShortcuts.map((shortcut, index) => (
                      <tr key={index} className="bg-white">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {shortcut.keys.map((key, i) => (
                              <span key={i} className="flex items-center">
                                <kbd className="rounded-lg bg-grey-100 px-2 py-1 text-xs font-semibold text-grey-700 shadow-sm ring-1 ring-grey-200">
                                  {key}
                                </kbd>
                                {i < shortcut.keys.length - 1 && (
                                  <span className="mx-1 text-grey-400">+</span>
                                )}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-grey-600">{shortcut.action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <a
                href="/help"
                className="flex items-center justify-center gap-2 rounded-xl border border-grey-200 bg-grey-50 p-3 text-sm font-medium text-grey-700 transition-colors hover:bg-grey-100"
              >
                <HelpCircle className="h-4 w-4" />
                View all shortcuts in Help Center
                <ChevronRight className="h-4 w-4" />
              </a>
            </div>
          </SettingSection>

          {/* Privacy & Security Section */}
          <SettingSection
            id="privacy"
            title="Privacy & Security"
            description="Manage your privacy settings"
            icon={Shield}
            isOpen={openSection === "privacy"}
            onToggle={() => toggleSection("privacy")}
          >
            <div className="space-y-6">
              {/* Change Password */}
              <div>
                <h4 className="font-medium text-grey-900 mb-4 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-grey-600" />
                  Change Password
                </h4>
                <div className="space-y-4">
                  <InputField
                    label="Current Password"
                    type="password"
                    value={currentPassword}
                    onChange={setCurrentPassword}
                    placeholder="Enter current password"
                  />
                  <InputField
                    label="New Password"
                    type="password"
                    value={newPassword}
                    onChange={setNewPassword}
                    placeholder="Enter new password"
                  />
                  <InputField
                    label="Confirm New Password"
                    type="password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    placeholder="Confirm new password"
                  />
                  <button className="rounded-xl bg-grey-100 px-4 py-2 text-sm font-medium text-grey-700 transition-colors hover:bg-grey-200">
                    Update Password
                  </button>
                </div>
              </div>

              {/* Two-Factor Authentication */}
              <div className="border-t border-grey-100 pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-grey-900 flex items-center gap-2">
                      Two-Factor Authentication
                      <span className="rounded-full bg-sage-100 px-2 py-0.5 text-xs font-medium text-sage-700">
                        Coming Soon
                      </span>
                    </p>
                    <p className="text-sm text-grey-500">Add an extra layer of security</p>
                  </div>
                  <Toggle enabled={false} onChange={() => {}} disabled />
                </div>
              </div>

              {/* Data Management */}
              <div className="border-t border-grey-100 pt-6 space-y-4">
                <h4 className="font-medium text-grey-900">Data Management</h4>
                <button className="flex items-center gap-2 rounded-xl border border-grey-200 bg-white px-4 py-2.5 text-sm font-medium text-grey-700 transition-all hover:bg-grey-50">
                  <Download className="h-4 w-4" />
                  Download My Data
                </button>
                <p className="text-xs text-grey-500">
                  Download a copy of all your data including tasks, conversations, and account information.
                </p>
              </div>

              {/* Delete Account */}
              <div className="border-t border-grey-100 pt-6">
                <button className="flex items-center gap-2 rounded-xl border border-grey-300 bg-grey-50 px-4 py-2.5 text-sm font-medium text-grey-600 transition-all hover:bg-grey-100">
                  <Trash2 className="h-4 w-4" />
                  Delete Account
                </button>
                <p className="mt-2 text-xs text-grey-500">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
              </div>
            </div>
          </SettingSection>

          {/* Billing & Plans Section */}
          <SettingSection
            id="billing"
            title="Billing & Plans"
            description="Manage your subscription"
            icon={CreditCard}
            isOpen={openSection === "billing"}
            onToggle={() => toggleSection("billing")}
          >
            <div className="space-y-6">
              {/* Current Plan */}
              <div className="rounded-xl border border-grey-200 bg-white p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-100">
                      <Zap className="h-5 w-5 text-sage-600" />
                    </div>
                    <div>
                      <p className="font-medium text-grey-900">Free Plan</p>
                      <p className="text-sm text-grey-500">Your current plan</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-sage-100 px-3 py-1 text-xs font-semibold text-sage-700">
                    Active
                  </span>
                </div>
                <div className="rounded-xl bg-grey-50 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-grey-600">Tasks used today</span>
                    <span className="text-sm font-medium text-grey-900">23 / 50</span>
                  </div>
                  <div className="h-2 bg-grey-200 rounded-full overflow-hidden">
                    <div className="h-full bg-sage-500 rounded-full" style={{ width: "46%" }} />
                  </div>
                  <p className="mt-2 text-xs text-grey-500">Resets at midnight</p>
                </div>
              </div>

              {/* Upgrade to Pro */}
              <div className="rounded-xl border-2 border-sage-200 bg-gradient-to-br from-sage-50 to-white p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-200">
                    <Rocket className="h-5 w-5 text-sage-700" />
                  </div>
                  <div>
                    <p className="font-medium text-sage-900">Upgrade to Pro</p>
                    <p className="text-sm text-sage-600">Unlock unlimited tasks</p>
                  </div>
                  <span className="ml-auto rounded-full bg-sage-200 px-3 py-1 text-xs font-semibold text-sage-800">
                    Coming Soon
                  </span>
                </div>
                <ul className="space-y-2 mb-4">
                  {["Unlimited tasks", "Priority support", "Advanced features", "API access"].map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-sage-700">
                      <CheckCircle2 className="h-4 w-4 text-sage-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Billing Info */}
              <div className="rounded-xl border border-grey-200 bg-grey-50 p-4">
                <p className="text-sm text-grey-600">
                  Free plan users are not charged. Upgrade to Pro for unlimited access when it becomes available.
                </p>
              </div>
            </div>
          </SettingSection>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-grey-500">
            Need help? Visit our{" "}
            <a href="/help" className="text-sage-600 hover:text-sage-700 font-medium">
              Help Center
            </a>{" "}
            or{" "}
            <a href="mailto:support@sage-ai.com" className="text-sage-600 hover:text-sage-700 font-medium">
              contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
