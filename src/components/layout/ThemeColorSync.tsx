'use client';

import { useEffect } from 'react';
import { useColorMode } from '@/components/ui/color-mode-provider';

// Must match the semantic bg tokens in providers.tsx
const THEME_COLORS = {
  light: '#ffffff',
  dark: '#1a202c',
} as const;

/**
 * Dynamically syncs the <meta name="theme-color"> tag with the app's
 * current color mode so the browser chrome / mobile status bar matches
 * the app background.
 */
export default function ThemeColorSync() {
  const { colorMode } = useColorMode();

  useEffect(() => {
    const color = THEME_COLORS[colorMode];

    // Update all theme-color meta tags (there may be multiple)
    const metas = document.querySelectorAll('meta[name="theme-color"]');
    if (metas.length > 0) {
      metas.forEach((meta) => meta.setAttribute('content', color));
    } else {
      // Create one if it doesn't exist yet
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = color;
      document.head.appendChild(meta);
    }
  }, [colorMode]);

  return null;
}
