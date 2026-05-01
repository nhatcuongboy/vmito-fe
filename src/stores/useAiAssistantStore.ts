import { create } from 'zustand';

interface AiAssistantState {
  isOpen: boolean;
  pageContext?: string;
  pendingMessage?: string;
  open: (pageContext?: string) => void;
  close: () => void;
  toggle: (pageContext?: string) => void;
  openWithMessage: (message: string, pageContext?: string) => void;
  clearPendingMessage: () => void;
}

export const useAiAssistantStore = create<AiAssistantState>((set) => ({
  isOpen: false,
  pageContext: undefined,
  pendingMessage: undefined,
  open: (pageContext) => set({ isOpen: true, pageContext }),
  close: () => set({ isOpen: false }),
  toggle: (pageContext) =>
    set((state) => ({
      isOpen: !state.isOpen,
      pageContext: !state.isOpen ? pageContext : state.pageContext,
    })),
  openWithMessage: (message, pageContext) =>
    set({ isOpen: true, pendingMessage: message, pageContext }),
  clearPendingMessage: () => set({ pendingMessage: undefined }),
}));
