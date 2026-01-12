"use client";

import { useState, useMemo } from "react";
import { Search, X, Clock, Smile, Heart, Coffee, Leaf, Flag, Hash } from "lucide-react";
import { cn } from "@/lib/cn";

const EMOJI_CATEGORIES = {
  recent: {
    label: "Recently Used",
    icon: Clock,
    emojis: ["😀", "👍", "❤️", "🔥", "✅"],
  },
  smileys: {
    label: "Smileys & People",
    icon: Smile,
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂",
      "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩",
      "😘", "😗", "😚", "😙", "🥲", "😋", "😛", "😜",
      "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐",
      "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬",
      "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒",
      "🤕", "🤢", "🤮", "🤧", "🥵", "🥶", "🥴", "😵",
      "🤯", "🤠", "🥳", "🥸", "😎", "🤓", "🧐", "😕",
    ],
  },
  gestures: {
    label: "Gestures & Body",
    icon: Hash,
    emojis: [
      "👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏",
      "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆",
      "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛",
      "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "💪",
      "🦾", "🦿", "🦵", "🦶", "👂", "🦻", "👃", "🧠",
      "👀", "👁️", "👅", "👄", "💋", "🩸", "👶", "🧒",
    ],
  },
  hearts: {
    label: "Hearts & Love",
    icon: Heart,
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍",
      "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖",
      "💘", "💝", "💟", "♥️", "😍", "🥰", "😘", "💑",
      "💏", "👩‍❤️‍👨", "👨‍❤️‍👨", "👩‍❤️‍👩", "💌", "💐", "🌹", "🥀",
    ],
  },
  nature: {
    label: "Nature & Animals",
    icon: Leaf,
    emojis: [
      "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼",
      "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔",
      "🐧", "🐦", "🐤", "🦆", "🦅", "🦉", "🦇", "🐺",
      "🐗", "🐴", "🦄", "🐝", "🪱", "🐛", "🦋", "🐌",
      "🌸", "💮", "🏵️", "🌹", "🥀", "🌺", "🌻", "🌼",
      "🌷", "🌱", "🪴", "🌲", "🌳", "🌴", "🌵", "🌾",
    ],
  },
  food: {
    label: "Food & Drink",
    icon: Coffee,
    emojis: [
      "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓",
      "🫐", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝",
      "🍅", "🍆", "🥑", "🥦", "🥬", "🥒", "🌶️", "🫑",
      "🍕", "🍔", "🍟", "🌭", "🍿", "🧂", "🥓", "🍳",
      "☕", "🍵", "🧃", "🥤", "🧋", "🍶", "🍺", "🍻",
      "🥂", "🍷", "🥃", "🍸", "🍹", "🧉", "🍾", "🧊",
    ],
  },
  symbols: {
    label: "Symbols",
    icon: Flag,
    emojis: [
      "✅", "❌", "❓", "❗", "💯", "🔥", "⭐", "✨",
      "💫", "💥", "💢", "💦", "💨", "🕳️", "💣", "💬",
      "👁️‍🗨️", "🗨️", "🗯️", "💭", "💤", "🎵", "🎶", "🔔",
      "🔕", "📣", "📢", "⚡", "🔋", "🔌", "💡", "🔦",
      "➕", "➖", "➗", "✖️", "♾️", "💲", "💱", "™️",
      "©️", "®️", "〰️", "➰", "➿", "🔚", "🔙", "🔛",
    ],
  },
};

type CategoryKey = keyof typeof EMOJI_CATEGORIES;

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("smileys");

  const filteredEmojis = useMemo(() => {
    if (!searchQuery.trim()) {
      return EMOJI_CATEGORIES[activeCategory].emojis;
    }

    // Search across all categories
    const allEmojis = Object.values(EMOJI_CATEGORIES).flatMap((cat) => cat.emojis);
    const uniqueEmojis = [...new Set(allEmojis)];
    return uniqueEmojis;
  }, [searchQuery, activeCategory]);

  return (
    <div className="w-80 rounded-2xl border border-grey-200 bg-white shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-grey-100 px-3 py-2">
        <span className="text-sm font-semibold text-grey-700">Emojis</span>
        <button
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded-lg text-grey-400 transition-all hover:bg-grey-100 hover:text-grey-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Search */}
      <div className="border-b border-grey-100 px-3 py-2">
        <div className="flex items-center gap-2 rounded-xl bg-grey-50 px-3 py-2">
          <Search className="h-4 w-4 text-grey-400" />
          <input
            type="text"
            placeholder="Search emojis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-grey-700 placeholder:text-grey-400 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-grey-400 hover:text-grey-600"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      {!searchQuery && (
        <div className="flex items-center gap-1 border-b border-grey-100 px-2 py-1.5">
          {(Object.keys(EMOJI_CATEGORIES) as CategoryKey[]).map((key) => {
            const category = EMOJI_CATEGORIES[key];
            const Icon = category.icon;
            const isActive = activeCategory === key;

            return (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg transition-all",
                  isActive
                    ? "bg-sage-100 text-sage-600"
                    : "text-grey-400 hover:bg-grey-100 hover:text-grey-600"
                )}
                title={category.label}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>
      )}

      {/* Category Label */}
      <div className="px-3 py-2">
        <span className="text-xs font-medium text-grey-400">
          {searchQuery ? "Search Results" : EMOJI_CATEGORIES[activeCategory].label}
        </span>
      </div>

      {/* Emoji Grid */}
      <div className="h-48 overflow-y-auto px-2 pb-3">
        <div className="grid grid-cols-8 gap-0.5">
          {filteredEmojis.map((emoji, index) => (
            <button
              key={`${emoji}-${index}`}
              onClick={() => onSelect(emoji)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-xl transition-all hover:bg-grey-100 hover:scale-110 active:scale-95"
            >
              {emoji}
            </button>
          ))}
        </div>
        {filteredEmojis.length === 0 && (
          <div className="flex h-32 items-center justify-center text-sm text-grey-400">
            No emojis found
          </div>
        )}
      </div>
    </div>
  );
}
