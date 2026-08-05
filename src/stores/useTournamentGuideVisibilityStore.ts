import { create } from 'zustand';

/**
 * Tracks whether the tournament setup guide widget is currently rendered on
 * screen (not dismissed/cancelled). Used by the slide-out menu to hide its own
 * "Hướng dẫn thiết lập giải đấu" footer entry point while the widget is
 * already visible, avoiding a duplicate entry point in the corner.
 */
interface TournamentGuideVisibilityState {
  isVisible: boolean;
  setVisible: (isVisible: boolean) => void;
}

export const useTournamentGuideVisibilityStore =
  create<TournamentGuideVisibilityState>((set) => ({
    isVisible: false,
    setVisible: (isVisible) => set({ isVisible }),
  }));
