import { create } from "zustand";

type ThemeMode = "light" | "dark" | "auto";

interface ThemeStore {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  mode: (localStorage.getItem("theme") as ThemeMode) || "auto",
  setMode: (mode) => {
    localStorage.setItem("theme", mode);
    set({ mode });
  },
}));

/** 根据主题模式应用/移除 .dark class */
export const applyTheme = (mode: ThemeMode) => {
  const root = document.documentElement;
  if (mode === "dark") {
    root.classList.add("dark");
  } else if (mode === "light") {
    root.classList.remove("dark");
  } else {
    // auto: 跟随系统
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", prefersDark);
  }
};
