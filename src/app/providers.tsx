'use client';

import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react';
import AuthProvider from '@/components/providers/AuthProvider';
import { ThemeProviderWrapper } from '@/components/ui/color-mode-provider';

// Custom system configuration for badminton app
const system = createSystem(defaultConfig, {
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: '#e6fffa' },
          100: { value: '#b2f5ea' },
          200: { value: '#81e6d9' },
          300: { value: '#4fd1c7' },
          400: { value: '#38b2ac' },
          500: { value: '#319795' },
          600: { value: '#2c7a7b' },
          700: { value: '#285e61' },
          800: { value: '#234e52' },
          900: { value: '#1d4044' },
        },
        badminton: {
          green: { value: '#22c55e' },
          orange: { value: '#f97316' },
          blue: { value: '#3b82f6' },
          purple: { value: '#8b5cf6' },
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
        fg: {
          value: { _light: '#1a202c', _dark: '#f7fafc' },
        },
        'fg.muted': {
          value: { _light: '#718096', _dark: '#a0aec0' },
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
import { Toaster } from '@/components/ui/toaster';
import { GlobalErrorModal } from '@/components/ui/GlobalErrorModal';

// Custom system configuration for badminton app
// ... (omitted for brevity in replacement search but effectively kept)

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProviderWrapper>
      <ChakraProvider value={system}>
        <SidebarProvider>
          <AuthProvider>
            <SocketProvider>
              {children}
              <Toaster />
              <GlobalErrorModal />
            </SocketProvider>
          </AuthProvider>
        </SidebarProvider>
      </ChakraProvider>
    </ThemeProviderWrapper>
  );
}
