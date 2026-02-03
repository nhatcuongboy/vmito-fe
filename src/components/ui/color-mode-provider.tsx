'use client';

import { ThemeProvider, useTheme } from 'next-themes';
import { createContext, useContext, useEffect, useState } from 'react';

// Color mode context for hooks
interface ColorModeContextType {
  colorMode: 'light' | 'dark';
  toggleColorMode: () => void;
  setColorMode: (mode: 'light' | 'dark') => void;
}

const ColorModeContext = createContext<ColorModeContextType | undefined>(
  undefined
);

// Hook to access color mode
export const useColorMode = (): ColorModeContextType => {
  const context = useContext(ColorModeContext);
  if (!context) {
    // Return default values if not in provider (SSR)
    return {
      colorMode: 'light',
      toggleColorMode: () => {},
      setColorMode: () => {},
    };
  }
  return context;
};

// Hook for conditional values based on color mode
export const useColorModeValue = <TLight, TDark>(
  lightValue: TLight,
  darkValue: TDark
): TLight | TDark => {
  const { colorMode } = useColorMode();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Return light value on server and during hydration
  if (!mounted) {
    return lightValue;
  }

  return colorMode === 'dark' ? darkValue : lightValue;
};

// Internal component to provide color mode context
const ColorModeProvider = ({ children }: { children: React.ReactNode }) => {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const colorMode = (mounted ? resolvedTheme : 'light') as 'light' | 'dark';

  const toggleColorMode = () => {
    setTheme(colorMode === 'dark' ? 'light' : 'dark');
  };

  const setColorMode = (mode: 'light' | 'dark') => {
    setTheme(mode);
  };

  return (
    <ColorModeContext.Provider
      value={{ colorMode, toggleColorMode, setColorMode }}
    >
      {children}
    </ColorModeContext.Provider>
  );
};

// Main provider that wraps ThemeProvider
export const ThemeProviderWrapper = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange={false}
    >
      <ColorModeProvider>{children}</ColorModeProvider>
    </ThemeProvider>
  );
};

export default ThemeProviderWrapper;
