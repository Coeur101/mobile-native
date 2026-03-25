# UI & Animation Overhaul Design

## Overview

Comprehensive UI/animation upgrade for the AI Web Builder mobile app. Transform the current static, monochromatic slate-gray interface into a warm, refined, animated experience inspired by v0.dev/Bolt.new aesthetics.

**Tech Stack:** React 19 + Tailwind CSS 4 + Zustand + Capacitor (Android)
**New Dependency:** `motion` (Framer Motion v12+)

## 1. Color Theme System

### Light Theme (Warm & Soft)

Replace cold slate grays with warm tones + purple accent:

| Token | Current | New |
|---|---|---|
| `--background` | `#ffffff` | `#FBF9F7` (warm white) |
| `--foreground` | `oklch(0.145 0 0)` | `#1C1917` (warm black) |
| `--card` | `#ffffff` | `#FFFFFF` |
| `--primary` | `#030213` (near-black) | `#8B5CF6` (violet-500) |
| `--primary-foreground` | white | `#FFFFFF` |
| `--secondary` | cold gray | `#F5F0EB` (warm beige) |
| `--muted` | `#ececf0` | `#F0EDE8` |
| `--muted-foreground` | `#717182` | `#8E8C88` (warm gray) |
| `--accent` | `#e9ebef` | `#F3EEFF` (light violet) |
| `--accent-foreground` | near-black | `#6D28D9` (violet-700) |
| `--border` | `rgba(0,0,0,0.1)` | `rgba(28,25,23,0.06)` |
| `--input-background` | `#f3f3f5` | `#F5F2EE` |
| `--destructive` | `#d4183d` | `#EF4444` |
| `--ring` | gray | `#8B5CF6` |

Additional custom properties:
- `--gradient-brand`: `linear-gradient(135deg, #8B5CF6, #EC4899)` (violet→pink)
- `--gradient-subtle`: `linear-gradient(135deg, #F3EEFF, #FDF2F8)` (light violet→light pink)

### Dark Theme

| Token | New Value |
|---|---|
| `--background` | `#0C0A09` (warm dark) |
| `--foreground` | `#FAFAF9` |
| `--card` | `#1C1917` |
| `--primary` | `#A78BFA` (violet-400) |
| `--secondary` | `#292524` |
| `--muted` | `#292524` |
| `--muted-foreground` | `#A8A29E` |
| `--accent` | `#1E1533` (dark violet) |
| `--border` | `rgba(255,255,255,0.08)` |

### Theme Switching

- Add `ThemeProvider` component wrapping App
- Read `theme` from settings store (Zustand)
- Apply `.dark` class on `<html>` based on setting (`light`/`dark`/`auto`)
- `auto` uses `prefers-color-scheme` media query

## 2. Animation System

### New Dependency: `motion`

Install `motion` package for React animation primitives.

### Page Transitions

Wrap route components in `AnimatePresence` + `motion.div`:
- **Forward navigation**: slide-right-in (x: 60→0, opacity: 0→1), 350ms
- **Back navigation**: slide-left-in (x: -60→0, opacity: 0→1), 350ms
- Easing: `[0.32, 0.72, 0, 1]` (Apple-style curve)

Implementation: Create `PageTransition` wrapper component, use in router layout.

### Stagger Enter Animations

Each page's content elements animate in sequence:
- Header: immediate (0ms delay)
- Content blocks: stagger 60-80ms each
- Fixed elements (FAB, bottom bars): spring entrance with delay

### Animation Constants

```ts
// src/lib/animations.ts
export const EASE_APPLE = [0.32, 0.72, 0, 1];
export const EASE_SMOOTH = [0.22, 1, 0.36, 1];
export const SPRING_BUTTON = { type: "spring", stiffness: 400, damping: 17 };
export const SPRING_BOUNCY = { type: "spring", stiffness: 260, damping: 20 };
export const DURATION_PAGE = 0.35;
export const DURATION_ELEMENT = 0.4;
export const STAGGER_DELAY = 0.07;
```

## 3. Per-Page Improvements

### LoginPage
- Background: warm gradient (`#FBF9F7` → `#F3EEFF`)
- Decorative blobs: violet/pink gradient circles with blur
- Logo: spring scale entrance (0→1) with slight rotation
- Title/subtitle: stagger fade-in
- Login sections: stagger slide-up entrance
- Button press: spring scale (0.97) feedback
- Loading spinner: pulse animation on entire button

### HomePage
- Background: `var(--background)` (warm white / warm dark)
- Header: slide-down entrance
- Project cards: stagger entrance with `y: 20→0, opacity: 0→1`
- Card hover: `translateY(-2px)` + shadow deepening
- Empty state icon: floating breath animation (subtle y oscillation)
- FAB: spring bounce-in from bottom, hover slight scale
- Delete: card slides left + fades out (exit animation)

### EditorPage
- Sidebar (prompt section): slide-in from left
- Main content: fade-in from right
- Tab switching: content crossfade animation
- Template cards: hover scale + border color transition
- Generate button: loading state with gradient shimmer
- Message bubbles: user from right, assistant from left slide-in
- Empty states: fade-in with slight scale

### PreviewPage
- Full-screen transition: fade-in
- Mode toggle buttons: active state slides indicator background
- Code panels: stagger entrance
- Back button: hover rotate slight

### SettingsPage
- Setting cards: stagger slide-up entrance
- Theme selector: selected state spring bounce + border gradient
- Save button: success checkmark animation after save
- Inputs: focus glow effect (box-shadow transition)

## 4. Shared Components to Create

### `PageTransition`
Wraps page content with enter/exit animations based on navigation direction.

### `AnimatedCard`
Card with hover depth effect and enter/exit animations.

### `PulsingDots`
Three-dot typing indicator for loading states (replaces spinner in some places).

### Theme-aware CSS utility classes
Add to theme.css:
- `.animate-float` — subtle floating breath
- `.animate-shimmer` — gradient shimmer for loading
- `.gradient-brand` — brand gradient background

## 5. Files to Modify

1. `package.json` — add `motion` dependency
2. `src/styles/theme.css` — complete rewrite for warm colors + dark mode
3. `src/styles/tailwind.css` — add animation utilities
4. `src/App.tsx` — add ThemeProvider wrapper
5. `src/router.tsx` — add page transition layout
6. `src/lib/animations.ts` — new: animation constants
7. `src/components/ui/page-transition.tsx` — new: route transition wrapper
8. `src/components/ui/animated-card.tsx` — new: card with hover/enter effects
9. `src/components/ui/pulsing-dots.tsx` — new: typing indicator
10. `src/pages/login/LoginPage.tsx` — full UI/animation upgrade
11. `src/pages/home/HomePage.tsx` — full UI/animation upgrade
12. `src/pages/editor/EditorPage.tsx` — full UI/animation upgrade
13. `src/pages/preview/PreviewPage.tsx` — full UI/animation upgrade
14. `src/pages/settings/SettingsPage.tsx` — full UI/animation upgrade
15. `src/components/ui/input.tsx` — theme-aware focus styles
16. `src/components/ui/tabs.tsx` — animated tab indicator
17. `src/stores/use-editor-store.ts` — add theme state (or separate theme store)

## 6. Implementation Order

1. Install `motion`, update theme.css (foundation)
2. Create animation constants + shared components
3. Add ThemeProvider + page transition system
4. Upgrade pages: Login → Home → Editor → Preview → Settings
5. Polish UI components (Input, Tabs)
6. Test dark/light theme switching
7. Verify build passes
