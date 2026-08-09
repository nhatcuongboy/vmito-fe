'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface SidebarContextType {
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const STORAGE_KEY = 'sidebar-collapsed';

interface SidebarProviderProps {
  children: React.ReactNode;
  defaultCollapsed?: boolean;
  persistPreference?: boolean;
}

export function SidebarProvider({
  children,
  defaultCollapsed = false,
  persistPreference = true,
}: SidebarProviderProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isHydrated, setIsHydrated] = useState(!persistPreference);

  // Load initial state from localStorage after hydration
  useEffect(() => {
    if (!persistPreference) return;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setIsCollapsed(stored === 'true');
    }
    setIsHydrated(true);
  }, [persistPreference]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (persistPreference && isHydrated) {
      localStorage.setItem(STORAGE_KEY, String(isCollapsed));
    }
  }, [isCollapsed, isHydrated, persistPreference]);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleCollapse }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
