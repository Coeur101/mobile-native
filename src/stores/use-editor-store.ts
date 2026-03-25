import { create } from "zustand";

type EditorTab = "chat" | "files" | "preview" | "history";

interface EditorStore {
  activeTab: EditorTab;
  selectedFile: string;
  setActiveTab: (tab: EditorTab) => void;
  setSelectedFile: (file: string) => void;
}

export const useEditorStore = create<EditorStore>((set) => ({
  activeTab: "chat",
  selectedFile: "index.html",
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedFile: (file) => set({ selectedFile: file }),
}));
