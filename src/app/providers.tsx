'use client';

import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react';
import AuthProvider from '@/components/providers/AuthProvider';
import FeatureFlagsProvider from '@/components/providers/FeatureFlagsProvider';
import { TooltipProvider } from '@/components/primitives/tooltip';
import { ThemeProviderWrapper } from '@/components/ui/color-mode-provider';

// Custom system configuration for badminton app
const system = createSystem(defaultConfig, {
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: '#ebfaf0' },
          100: { value: '#c6f0d3' },
          200: { value: '#8fdca6' },
          300: { value: '#54c676' },
          400: { value: '#26b04e' },
          500: { value: '#179a3b' },
          600: { value: '#127b2f' },
          700: { value: '#0e5c23' },
          800: { value: '#0a3d17' },
          900: { value: '#061e0b' },
        },
        green: {
          50: { value: '#ebfaf0' },
          100: { value: '#c6f0d3' },
          200: { value: '#8fdca6' },
          300: { value: '#54c676' },
          400: { value: '#26b04e' },
          500: { value: '#179a3b' },
          600: { value: '#127b2f' },
          700: { value: '#0e5c23' },
          800: { value: '#0a3d17' },
          900: { value: '#061e0b' },
        },
        badminton: {
          green: { value: '#179a3b' },
          orange: { value: '#f97316' },
          blue: { value: '#3b82f6' },
          purple: { value: '#8b5cf6' },
        },
        teal: {
          50: { value: '#ebfaf0' },
          100: { value: '#c6f0d3' },
          200: { value: '#8fdca6' },
          300: { value: '#54c676' },
          400: { value: '#26b04e' },
          500: { value: '#179a3b' },
          600: { value: '#127b2f' },
          700: { value: '#0e5c23' },
          800: { value: '#0a3d17' },
          900: { value: '#061e0b' },
        },
        error: {
          50: { value: '#fef2f2' },
          100: { value: '#fee2e2' },
          200: { value: '#fecaca' },
          300: { value: '#fca5a5' },
          400: { value: '#f87171' },
          500: { value: '#ef4444' },
          600: { value: '#dc2626' },
          700: { value: '#b91c1c' },
          800: { value: '#991b1b' },
          900: { value: '#7f1d1d' },
        },
      },
      fonts: {
        heading: { value: 'var(--font-geist-sans)' },
        body: { value: 'var(--font-geist-sans)' },
      },
    },
    semanticTokens: {
      colors: {
        bg: {
          value: { _light: '#ffffff', _dark: '#1a202c' },
        },
        'bg.subtle': {
          value: { _light: '#f7fafc', _dark: '#2d3748' },
        },
        'bg.muted': {
          value: { _light: '#edf2f7', _dark: '#4a5568' },
        },
        'bg.panel': {
          value: { _light: '#ffffff', _dark: '#171923' },
        },
        fg: {
          value: { _light: '#1a202c', _dark: '#f7fafc' },
        },
        'fg.muted': {
          // #718096 was 4.03:1 on white — below WCAG AA (4.5:1) for body text.
          // #64748b is the closest slate that passes (4.76:1).
          value: { _light: '#64748b', _dark: '#a0aec0' },
        },
        'fg.subtle': {
          value: { _light: '#4a5568', _dark: '#cbd5e0' },
        },
        border: {
          value: { _light: '#d4d4d8', _dark: '#4a5568' },
        },
        'border.subtle': {
          value: { _light: '#edf2f7', _dark: '#2d3748' },
        },
        'border.error': {
          value: { _light: '{colors.error.500}', _dark: '{colors.error.400}' },
        },
        'fg.error': {
          value: { _light: '{colors.error.500}', _dark: '{colors.error.400}' },
        },
      },
    },
    recipes: {
      button: {
        defaultVariants: {
          colorPalette: 'green',
        },
      },
      skeleton: {
        base: {
          _light: {
            background: 'gray.200',
            borderColor: 'gray.200',
            '--start-color': 'colors.gray.200',
            '--end-color': 'colors.gray.400',
          },
          _dark: {
            background: 'gray.900',
            borderColor: 'gray.900',
            '--start-color': 'colors.gray.900',
            '--end-color': 'colors.gray.700',
          },
        },
      },
    },
  },
});

import { SocketProvider } from '@/contexts/SocketContext';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { AppSettingsProvider } from '@/contexts/AppSettingsContext';
import { TopBarSearchProvider } from '@/contexts/TopBarSearchContext';
import { Toaster } from '@/components/ui/toaster';
import { GlobalErrorModal } from '@/components/ui/GlobalErrorModal';
import GlobalCourtCallModal from '@/components/session/GlobalCourtCallModal';
import PointsCelebration from '@/components/leaderboard/PointsCelebration';
import TourController from '@/components/tour/TourController';
import GoogleOneTap from '@/components/auth/GoogleOneTap';

// Custom system configuration for badminton app
// ... (omitted for brevity in replacement search but effectively kept)

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProviderWrapper>
      <TooltipProvider>
        <ChakraProvider value={system}>
          <AppSettingsProvider>
            <SidebarProvider>
              <TopBarSearchProvider>
                <AuthProvider>
                  <FeatureFlagsProvider>
                    <SocketProvider>
                      {children}
                      <Toaster />
                      <GlobalErrorModal />
                      <GlobalCourtCallModal />
                      <PointsCelebration />
                      <TourController />
                      <GoogleOneTap />
                    </SocketProvider>
                  </FeatureFlagsProvider>
                </AuthProvider>
              </TopBarSearchProvider>
            </SidebarProvider>
          </AppSettingsProvider>
        </ChakraProvider>
      </TooltipProvider>
    </ThemeProviderWrapper>
  );
}
