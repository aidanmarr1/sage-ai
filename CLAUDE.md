# Sage AI - Project Instructions

## About Sage

Sage is a **general-purpose AI agent** (not just a coding assistant). It can help with:
- Research and information gathering
- Writing and content creation
- Analysis and problem-solving
- Task automation
- And much more

Keep this in mind when writing UI copy, suggestions, and features.

## Color Scheme

**IMPORTANT: Stick to these colors only. Do not introduce new colors.**

### Primary Palette
- **Sage**: Use `sage-50` through `sage-950` for primary accents, buttons, highlights
- **Grey**: Use `grey-50` through `grey-950` for text, backgrounds, borders
- **White**: Use `white` or `bg-white` for backgrounds and cards

### Forbidden Colors
Do NOT use:
- Red, blue, green, yellow, orange, purple, pink, etc.
- Tailwind colors like `emerald`, `amber`, `indigo`, `rose`, etc.
- Any color outside the sage/grey/white palette

### Color Usage Examples
```
✅ Correct:
- bg-sage-500, text-sage-600, border-sage-200
- bg-grey-100, text-grey-700, border-grey-300
- bg-white, text-white

❌ Incorrect:
- bg-emerald-500, text-red-600, border-blue-200
- bg-green-100, text-amber-500
```

## Typography

- **Headers**: EB Garamond (font-serif)
- **Body**: Nunito Sans (font-sans)
- **Code**: JetBrains Mono (font-mono)

## Tech Stack

- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS v4 (with `@theme inline` for custom colors)
- Zustand (state management)
- Lucide React (icons)

## Design Principles

1. Light mode only (for now)
2. Clean, minimal aesthetic
3. Subtle shadows and gradients
4. Smooth transitions and micro-interactions
5. Consistent rounded corners (rounded-xl, rounded-2xl)
