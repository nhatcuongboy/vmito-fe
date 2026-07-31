'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import {
  Category,
  CategoryMatch,
  TournamentCourt,
  ITimeSlotConfig,
  ICourtTimeSlotConfig,
  ICourtConstraint,
  IMatchDurations,
  IGenerateScheduleResponse,
  IPreviewMatch,
  IScheduleConflict,
  IGenerateScheduleRequest,
} from '@/lib/api/types';
import { ScheduleGeneratorService } from '@/lib/api/schedule-generator.service';
import { toaster } from '@/components/ui/toaster';
import { getToastMessage } from '@/lib/i18n/toastMessages';

// ===== Local time slot with client-side ID =====
export interface ILocalTimeSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  timeBuffer: number;
  courts: ILocalCourtSlot[];
}

export interface ILocalCourtSlot {
  courtId: string;
  constraints?: ICourtConstraint;
}

type Step = 'configure' | 'preview' | 'confirm';

interface ScheduleGenerationState {
  // Configuration
  categoryPriorities: string[];
  matchDurations: IMatchDurations;
  timeSlots: ILocalTimeSlot[];
  keepScheduledMatches: boolean;

  // Generated schedule
  scheduleId: string | null;
  generationResponse: IGenerateScheduleResponse | null;
  previewMatches: IPreviewMatch[];
  conflicts: IScheduleConflict[];

  // UI state
  currentStep: Step;
  isGenerating: boolean;
  isSaving: boolean;
  isLoadingPreview: boolean;
  errors: string[];

  // Data
  categories: Category[];
  allMatches: CategoryMatch[];
  courts: TournamentCourt[];
  tournamentId: string;
}

interface ScheduleGenerationActions {
  // Config
  setCategoryPriorities: (priorities: string[]) => void;
  setMatchDurations: (durations: IMatchDurations) => void;
  setKeepScheduledMatches: (keep: boolean) => void;

  // Time slots
  addTimeSlot: (slot: Omit<ILocalTimeSlot, 'id'>) => void;
  updateTimeSlot: (slotId: string, updates: Partial<ILocalTimeSlot>) => void;
  removeTimeSlot: (slotId: string) => void;

  // Court management within time slots
  setCourtsForTimeSlot: (slotId: string, courts: ILocalCourtSlot[]) => void;
  updateCourtConstraint: (
    slotId: string,
    courtId: string,
    constraints: ICourtConstraint | undefined
  ) => void;
  removeCourtFromTimeSlot: (slotId: string, courtId: string) => void;

  // Actions
  generateSchedule: () => Promise<void>;
  loadPreview: () => Promise<void>;
  updateMatchAssignment: (
    matchId: string,
    courtId: string,
    startTime: string,
    duration: number
  ) => Promise<{ success: boolean; conflicts?: IScheduleConflict[] }>;
  saveSchedule: () => Promise<boolean>;
  cancel: () => void;

  // Navigation
  setStep: (step: Step) => void;

  // Reset
  reset: () => void;
}

type ScheduleGenerationContextType = ScheduleGenerationState &
  ScheduleGenerationActions;

const ScheduleGenerationContext =
  createContext<ScheduleGenerationContextType | null>(null);

export const useScheduleGeneration = () => {
  const ctx = useContext(ScheduleGenerationContext);
  if (!ctx) {
    throw new Error(
      'useScheduleGeneration must be used within ScheduleGenerationProvider'
    );
  }
  return ctx;
};

interface ScheduleGenerationProviderProps {
  children: ReactNode;
  tournamentId: string;
  categories: Category[];
  allMatches: CategoryMatch[];
  courts: TournamentCourt[];
}

export const ScheduleGenerationProvider = ({
  children,
  tournamentId,
  categories,
  allMatches,
  courts,
}: ScheduleGenerationProviderProps) => {
  // Config state
  const [categoryPriorities, setCategoryPriorities] = useState<string[]>(
    categories.map((c) => c.id)
  );
  const [matchDurations, setMatchDurations] = useState<IMatchDurations>({
    POOL_PLAY: 60,
    PLAYOFFS: 60,
  });
  const [timeSlots, setTimeSlots] = useState<ILocalTimeSlot[]>([]);
  const [keepScheduledMatches, setKeepScheduledMatches] = useState(false);

  // Generated schedule state
  const [scheduleId, setScheduleId] = useState<string | null>(null);
  const [generationResponse, setGenerationResponse] =
    useState<IGenerateScheduleResponse | null>(null);
  const [previewMatches, setPreviewMatches] = useState<IPreviewMatch[]>([]);
  const [conflicts, setConflicts] = useState<IScheduleConflict[]>([]);

  // UI state
  const [currentStep, setCurrentStep] = useState<Step>('configure');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Time slot actions
  const addTimeSlot = useCallback((slot: Omit<ILocalTimeSlot, 'id'>) => {
    const newSlot: ILocalTimeSlot = {
      ...slot,
      id: Date.now().toString(),
    };
    setTimeSlots((prev) => [...prev, newSlot]);
  }, []);

  const updateTimeSlot = useCallback(
    (slotId: string, updates: Partial<ILocalTimeSlot>) => {
      setTimeSlots((prev) =>
        prev.map((s) => (s.id === slotId ? { ...s, ...updates } : s))
      );
    },
    []
  );

  const removeTimeSlot = useCallback((slotId: string) => {
    setTimeSlots((prev) => prev.filter((s) => s.id !== slotId));
  }, []);

  const setCourtsForTimeSlot = useCallback(
    (slotId: string, newCourts: ILocalCourtSlot[]) => {
      setTimeSlots((prev) =>
        prev.map((s) => (s.id === slotId ? { ...s, courts: newCourts } : s))
      );
    },
    []
  );

  const updateCourtConstraint = useCallback(
    (
      slotId: string,
      courtId: string,
      constraints: ICourtConstraint | undefined
    ) => {
      setTimeSlots((prev) =>
        prev.map((s) => {
          if (s.id !== slotId) return s;
          return {
            ...s,
            courts: s.courts.map((c) =>
              c.courtId === courtId ? { ...c, constraints } : c
            ),
          };
        })
      );
    },
    []
  );

  const removeCourtFromTimeSlot = useCallback(
    (slotId: string, courtId: string) => {
      setTimeSlots((prev) =>
        prev.map((s) => {
          if (s.id !== slotId) return s;
          return {
            ...s,
            courts: s.courts.filter((c) => c.courtId !== courtId),
          };
        })
      );
    },
    []
  );

  // Build request from local state
  const buildRequest = useCallback((): IGenerateScheduleRequest => {
    return {
      categoryPriorities,
      matchDurations,
      timeSlots: timeSlots.map((ts) => ({
        date: ts.date,
        startTime: ts.startTime,
        endTime: ts.endTime,
        timeBuffer: ts.timeBuffer,
        courts: ts.courts.map((c) => ({
          courtId: c.courtId,
          constraints: c.constraints,
        })),
      })),
      keepScheduledMatches,
    };
  }, [categoryPriorities, matchDurations, timeSlots, keepScheduledMatches]);

  const generateSchedule = useCallback(async () => {
    setIsGenerating(true);
    setErrors([]);
    try {
      const request = buildRequest();

      // Validate first
      const validation = await ScheduleGeneratorService.validateConfig(
        tournamentId,
        request
      );

      if (!validation.valid) {
        setErrors(validation.errors.map((e) => e.message));
        return;
      }

      const result = await ScheduleGeneratorService.generate(
        tournamentId,
        request
      );

      setScheduleId(result.scheduleId);
      setGenerationResponse(result);
      setConflicts(result.conflicts);
      setCurrentStep('preview');

      // Auto-load preview
      const preview = await ScheduleGeneratorService.getPreview(
        tournamentId,
        result.scheduleId
      );
      setPreviewMatches(preview.matches);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Generation failed';
      toaster.error({ title: message });
    } finally {
      setIsGenerating(false);
    }
  }, [buildRequest, tournamentId]);

  const loadPreview = useCallback(async () => {
    if (!scheduleId) return;
    setIsLoadingPreview(true);
    try {
      const preview = await ScheduleGeneratorService.getPreview(
        tournamentId,
        scheduleId
      );
      setPreviewMatches(preview.matches);
    } catch (error) {
      toaster.error({ title: getToastMessage('previewLoadFailed') });
    } finally {
      setIsLoadingPreview(false);
    }
  }, [scheduleId, tournamentId]);

  const updateMatchAssignment = useCallback(
    async (
      matchId: string,
      courtId: string,
      startTime: string,
      duration: number
    ) => {
      if (!scheduleId) return { success: false };

      try {
        const result = await ScheduleGeneratorService.updateMatchAssignment(
          tournamentId,
          scheduleId,
          matchId,
          { courtId, startTime, duration }
        );

        if (result.success) {
          // Reload preview
          await loadPreview();
        }

        return result;
      } catch (error) {
        toaster.error({ title: getToastMessage('matchUpdateFailed') });
        return { success: false };
      }
    },
    [scheduleId, tournamentId, loadPreview]
  );

  const saveSchedule = useCallback(async (): Promise<boolean> => {
    if (!scheduleId) return false;
    setIsSaving(true);
    try {
      const result = await ScheduleGeneratorService.saveSchedule(
        tournamentId,
        scheduleId
      );

      if (result.success) {
        toaster.success({
          title: `Schedule saved: ${result.scheduledCount} matches scheduled`,
        });
        return true;
      }
      return false;
    } catch (error) {
      toaster.error({ title: getToastMessage('scheduleSaveFailed') });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [scheduleId, tournamentId]);

  const cancel = useCallback(() => {
    setScheduleId(null);
    setGenerationResponse(null);
    setPreviewMatches([]);
    setConflicts([]);
    setCurrentStep('configure');
    setErrors([]);
  }, []);

  const reset = useCallback(() => {
    cancel();
    setCategoryPriorities(categories.map((c) => c.id));
    setMatchDurations({ POOL_PLAY: 60, PLAYOFFS: 60 });
    setTimeSlots([]);
    setKeepScheduledMatches(false);
  }, [cancel, categories]);

  const setStep = useCallback((step: Step) => {
    setCurrentStep(step);
  }, []);

  const value: ScheduleGenerationContextType = {
    // State
    categoryPriorities,
    matchDurations,
    timeSlots,
    keepScheduledMatches,
    scheduleId,
    generationResponse,
    previewMatches,
    conflicts,
    currentStep,
    isGenerating,
    isSaving,
    isLoadingPreview,
    errors,
    categories,
    allMatches,
    courts,
    tournamentId,

    // Actions
    setCategoryPriorities,
    setMatchDurations,
    setKeepScheduledMatches,
    addTimeSlot,
    updateTimeSlot,
    removeTimeSlot,
    setCourtsForTimeSlot,
    updateCourtConstraint,
    removeCourtFromTimeSlot,
    generateSchedule,
    loadPreview,
    updateMatchAssignment,
    saveSchedule,
    cancel,
    setStep,
    reset,
  };

  return (
    <ScheduleGenerationContext.Provider value={value}>
      {children}
    </ScheduleGenerationContext.Provider>
  );
};
