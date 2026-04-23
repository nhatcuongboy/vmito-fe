'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface AppSettingsContextType {
  showNewAddress: boolean;
  setShowNewAddress: (value: boolean) => void;
}

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(
  undefined
);

const STORAGE_KEY = 'app-show-new-address';

export function AppSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showNewAddress, setShowNewAddressState] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setShowNewAddressState(stored === 'true');
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(STORAGE_KEY, String(showNewAddress));
    }
  }, [showNewAddress, isHydrated]);

  const setShowNewAddress = (value: boolean) => {
    setShowNewAddressState(value);
  };

  return (
    <AppSettingsContext.Provider value={{ showNewAddress, setShowNewAddress }}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext);
  if (context === undefined) {
    throw new Error(
      'useAppSettings must be used within an AppSettingsProvider'
    );
  }
  return context;
}
