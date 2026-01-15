'use client';

import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react';
import AuthProvider from '@/components/providers/AuthProvider';

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
      },
      fonts: {
        heading: { value: 'var(--font-geist-sans)' },
        body: { value: 'var(--font-geist-sans)' },
      },
    },
  },
});

import { SocketProvider } from '@/contexts/SocketContext';
import { Toaster } from '@/components/ui/toaster';
import { GlobalErrorModal } from '@/components/ui/GlobalErrorModal';

// Custom system configuration for badminton app
// ... (omitted for brevity in replacement search but effectively kept)

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider value={system}>
      <AuthProvider>
        <SocketProvider>
          {children}
          <Toaster />
          <GlobalErrorModal />
        </SocketProvider>
      </AuthProvider>
    </ChakraProvider>
  );
}
