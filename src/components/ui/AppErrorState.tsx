'use client';

import { Box, Button, Icon, type ConditionalValue } from '@chakra-ui/react';
import { AlertTriangle, RotateCcw, WifiOff } from 'lucide-react';
import type { ReactNode } from 'react';
import AppEmptyState from './AppEmptyState';

interface AppErrorStateProps {
  /** Picks the warning icon: WifiOff for network errors, AlertTriangle otherwise */
  type?: 'network' | 'server' | 'generic';
  title: ReactNode;
  description?: ReactNode;
  onRetry?: () => void;
  retryLabel?: ReactNode;
  minH?: ConditionalValue<string | number>;
}

/**
 * Friendly inline error state for a content area that failed to load.
 * Shows a warning icon, human-readable copy, and a retry button so users
 * can re-trigger the fetch without reloading the page.
 */
export default function AppErrorState({
  type = 'generic',
  title,
  description,
  onRetry,
  retryLabel,
  minH,
}: AppErrorStateProps) {
  const IconComponent = type === 'network' ? WifiOff : AlertTriangle;

  return (
    <Box role="alert" aria-live="polite" width="100%">
      <AppEmptyState
        minH={minH}
        icon={<Icon as={IconComponent} boxSize={10} color="orange.400" />}
        title={title}
        description={description ?? null}
        actions={
          onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm">
              <Icon as={RotateCcw} boxSize={4} mr={1.5} />
              {retryLabel}
            </Button>
          )
        }
      />
    </Box>
  );
}
