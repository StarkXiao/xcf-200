import { create } from 'zustand';
import type { ToastMessage } from '@/types';
import { generateToastId } from '@/utils/helpers';

interface UIState {
  isLoading: boolean;
  toast: ToastMessage | null;
  toasts: ToastMessage[];
  setLoading: (loading: boolean) => void;
  showToast: (message: Omit<ToastMessage, 'id'>) => void;
  hideToast: (id: string) => void;
  clearAllToasts: () => void;
}

const useUIStore = create<UIState>((set) => ({
  isLoading: false,
  toast: null,
  toasts: [],
  setLoading: (loading) => set({ isLoading: loading }),
  showToast: (message) => {
    const id = generateToastId();
    const duration = message.duration || 3000;
    const newToast: ToastMessage = { ...message, id, duration };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
  },
  hideToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  clearAllToasts: () => set({ toasts: [] }),
}));

export default useUIStore;
