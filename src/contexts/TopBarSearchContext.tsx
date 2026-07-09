'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from 'react';

export interface SearchBarConfig {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onFilterClick?: () => void;
  activeFilterCount?: number;
  showFilter?: boolean;
}

export interface SearchBarCallbacks {
  onChange: (value: string) => void;
  onFilterClick?: () => void;
}

export interface PrimitiveSearchConfig {
  value: string;
  placeholder?: string;
  activeFilterCount?: number;
  showFilter?: boolean;
  hasFilterClick?: boolean;
}

interface TopBarSearchContextValue {
  /** The primitive configuration (value, placeholder, etc.) */
  searchConfig: PrimitiveSearchConfig | null;
  setSearchConfig: (config: PrimitiveSearchConfig | null) => void;
  /** Ref storing the latest mutable callbacks to avoid identity change rendering loops */
  callbacksRef: React.MutableRefObject<SearchBarCallbacks | null>;
}

const TopBarSearchContext = createContext<TopBarSearchContextValue>({
  searchConfig: null,
  setSearchConfig: () => {},
  callbacksRef: { current: null },
});

export function TopBarSearchProvider({ children }: { children: ReactNode }) {
  const [searchConfig, setSearchConfig] =
    useState<PrimitiveSearchConfig | null>(null);
  const callbacksRef = useRef<SearchBarCallbacks | null>(null);

  return (
    <TopBarSearchContext.Provider
      value={{
        searchConfig,
        setSearchConfig,
        callbacksRef,
      }}
    >
      {children}
    </TopBarSearchContext.Provider>
  );
}

export function useTopBarSearch() {
  return useContext(TopBarSearchContext);
}

/**
 * Hook for child components (e.g. list pages) to register their search bar
 * configuration into the top bar on desktop.
 */
export function useRegisterTopBarSearch(config: SearchBarConfig | null) {
  const { setSearchConfig, callbacksRef } = useContext(TopBarSearchContext);

  // Sync callbacks immediately on every render to ensure they are always fresh,
  // without triggering a re-render since it writes to a mutable Ref.
  useEffect(() => {
    if (config) {
      callbacksRef.current = {
        onChange: config.onChange,
        onFilterClick: config.onFilterClick,
      };
    } else {
      callbacksRef.current = null;
    }
  });

  // Update primitive configs only when their actual values change.
  useEffect(() => {
    if (!config) {
      setSearchConfig(null);
      return;
    }

    setSearchConfig({
      value: config.value,
      placeholder: config.placeholder,
      activeFilterCount: config.activeFilterCount,
      showFilter: config.showFilter,
      hasFilterClick: !!config.onFilterClick,
    });
  }, [
    config?.value,
    config?.placeholder,
    config?.activeFilterCount,
    config?.showFilter,
    config?.onFilterClick ? true : false,
    setSearchConfig,
  ]);

  // Clear search config on unmount
  useEffect(() => {
    return () => {
      setSearchConfig(null);
      callbacksRef.current = null;
    };
  }, [setSearchConfig, callbacksRef]);
}
