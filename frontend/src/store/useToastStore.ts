import { create } from "zustand";

export type ToastType = "success" | "error" | "info";

interface ToastState {
  message: string;
  type: ToastType;
  visible: boolean;
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;
}

let timeoutId: ReturnType<typeof setTimeout> | null = null;

export const useToastStore = create<ToastState>((set) => ({
  message: "",
  type: "success",
  visible: false,
  showToast: (message, type = "success") => {
    if (timeoutId) clearTimeout(timeoutId);
    set({ message, type, visible: true });
    timeoutId = setTimeout(() => set({ visible: false }), 4000);
  },
  hideToast: () => {
    if (timeoutId) clearTimeout(timeoutId);
    set({ visible: false });
  },
}));
