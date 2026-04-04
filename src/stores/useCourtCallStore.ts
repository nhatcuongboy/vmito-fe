import { create } from 'zustand';

interface CourtCallState {
  isOpen: boolean;
  courtName: string;
  showCourtCall: (courtName: string) => void;
  hideCourtCall: () => void;
}

export const useCourtCallStore = create<CourtCallState>()((set) => ({
  isOpen: false,
  courtName: '',
  showCourtCall: (courtName) => set({ isOpen: true, courtName }),
  hideCourtCall: () => set({ isOpen: false }),
}));
