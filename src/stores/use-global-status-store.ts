import { create } from "zustand";

export type StatusSeverity = "info" | "success" | "warning" | "error";

export interface StatusItem {
  id: string;
  severity: StatusSeverity;
  message: string;
  dismissable: boolean;
  autoDismissMs: number | null;
  createdAt: number;
  actionLabel?: string;
  actionTo?: string;
}

export type StatusInput = Omit<StatusItem, "createdAt"> & {
  createdAt?: number;
};

interface GlobalStatusStore {
  items: StatusItem[];
  push: (input: StatusInput) => void;
  dismiss: (id: string) => void;
  clear: () => void;
}

export const useGlobalStatusStore = create<GlobalStatusStore>((set) => ({
  items: [],
  push: (input) => {
    const item: StatusItem = {
      ...input,
      createdAt: input.createdAt ?? Date.now(),
    };
    set((state) => ({
      items: [...state.items.filter((existing) => existing.id !== item.id), item],
    }));
  },
  dismiss: (id) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    }));
  },
  clear: () => set({ items: [] }),
}));
