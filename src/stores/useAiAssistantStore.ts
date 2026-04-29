import { create } from 'zustand';

interface AiAssistantState {
  isOpen: boolean;
  pageContext?: string;
  open: (pageContext?: string) => void;
  close: () => void;
  toggle: (pageContext?: string) => void;
}

export const useAiAssistantStore = create<AiAssistantState>((set) => ({
  isOpen: false,
  pageContext: undefined,
  open: (pageContext) => set({ isOpen: true, pageContext }),
  close: () => set({ isOpen: false }),
  toggle: (pageContext) =>
    set((state) => ({
      isOpen: !state.isOpen,
      pageContext: !state.isOpen ? pageContext : state.pageContext,
    })),
}));
