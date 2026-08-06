import { create } from 'zustand';

/**
 * Tracks how many `BottomNavigationBar` instances with `alwaysVisible` are
 * currently mounted (shown on desktop too, e.g. session detail pages). Used
 * to hide the floating contact buttons so they don't overlap that bar.
 */
interface AlwaysVisibleBottomNavState {
  count: number;
  register: () => void;
  unregister: () => void;
}

export const useAlwaysVisibleBottomNavStore =
  create<AlwaysVisibleBottomNavState>((set) => ({
    count: 0,
    register: () => set((state) => ({ count: state.count + 1 })),
    unregister: () => set((state) => ({ count: Math.max(0, state.count - 1) })),
  }));
