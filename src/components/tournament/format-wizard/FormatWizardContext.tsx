'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
} from 'react';
import {
  FormatWizardState,
  WizardAction,
  TournamentFormatType,
  FormatConfig,
  FilterCategory,
  getTotalSteps,
} from './types';
import { getDefaultConfig } from './constants';

const initialState: FormatWizardState = {
  currentStep: 1,
  selectedFormat: null,
  config: null,
  filterCategory: null,
};

function wizardReducer(
  state: FormatWizardState,
  action: WizardAction
): FormatWizardState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.step };
    case 'SELECT_FORMAT':
      return {
        ...state,
        selectedFormat: action.format,
        config: getDefaultConfig(action.format),
      };
    case 'UPDATE_CONFIG':
      return { ...state, config: action.config };
    case 'SET_FILTER':
      return { ...state, filterCategory: action.category };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface FormatWizardContextValue {
  state: FormatWizardState;
  totalSteps: number;
  selectFormat: (format: TournamentFormatType) => void;
  updateConfig: (config: FormatConfig) => void;
  setFilter: (category: FilterCategory) => void;
  goNext: () => void;
  goBack: () => void;
  reset: () => void;
}

const FormatWizardContext = createContext<FormatWizardContextValue | null>(
  null
);

export function FormatWizardProvider({
  children,
  initialState: customInitialState,
}: {
  children: React.ReactNode;
  initialState?: Partial<FormatWizardState>;
}) {
  const [state, dispatch] = useReducer(wizardReducer, {
    ...initialState,
    ...customInitialState,
  });

  const selectFormat = useCallback((format: TournamentFormatType) => {
    dispatch({ type: 'SELECT_FORMAT', format });
  }, []);

  const updateConfig = useCallback((config: FormatConfig) => {
    dispatch({ type: 'UPDATE_CONFIG', config });
  }, []);

  const setFilter = useCallback((category: FilterCategory) => {
    dispatch({ type: 'SET_FILTER', category });
  }, []);

  const totalSteps = getTotalSteps(state.selectedFormat);

  const goNext = useCallback(() => {
    if (state.currentStep < totalSteps) {
      dispatch({
        type: 'SET_STEP',
        step: (state.currentStep + 1) as 1 | 2 | 3 | 4,
      });
    }
  }, [state.currentStep, totalSteps]);

  const goBack = useCallback(() => {
    if (state.currentStep > 1) {
      dispatch({
        type: 'SET_STEP',
        step: (state.currentStep - 1) as 1 | 2 | 3 | 4,
      });
    }
  }, [state.currentStep]);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return (
    <FormatWizardContext.Provider
      value={{
        state,
        totalSteps,
        selectFormat,
        updateConfig,
        setFilter,
        goNext,
        goBack,
        reset,
      }}
    >
      {children}
    </FormatWizardContext.Provider>
  );
}

export function useFormatWizard(): FormatWizardContextValue {
  const context = useContext(FormatWizardContext);
  if (!context) {
    throw new Error('useFormatWizard must be used within FormatWizardProvider');
  }
  return context;
}
