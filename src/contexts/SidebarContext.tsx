'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  SIDEBAR_COOKIE,
  parseSidebarPreference,
  writeSidebarPreference,
} from '@/lib/sidebar-preference';

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
  initialCollapsed?: boolean;
}

export function SidebarProvider({
  children,
  defaultCollapsed = false,
  persistPreference = true,
  initialCollapsed,
}: SidebarProviderProps) {
  const [isCollapsed, setIsCollapsed] = useState(
    initialCollapsed ?? defaultCollapsed
  );

  // Migrate legacy storage for the NEXT navigation. The current render must
  // retain the server's width, including when storage is unavailable.
  useEffect(() => {
    if (!persistPreference) return;
    if (
      document.cookie
        .split('; ')
        .some((entry) => entry.startsWith(`${SIDEBAR_COOKIE}=`))
    )
      return;
    try {
      const stored = parseSidebarPreference(
        localStorage.getItem(STORAGE_KEY) ?? undefined
      );
      writeSidebarPreference(stored ?? initialCollapsed ?? defaultCollapsed);
    } catch {
      writeSidebarPreference(initialCollapsed ?? defaultCollapsed);
    }
  }, [persistPreference, initialCollapsed, defaultCollapsed]);

  const toggleCollapse = () => {
    const next = !isCollapsed;
    if (persistPreference) {
      writeSidebarPreference(next);
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        /* Cookie remains canonical. */
      }
    }
    setIsCollapsed(next);
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
