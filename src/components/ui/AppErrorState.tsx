'use client';

import { Button } from '@/components/primitives/button';
import { AlertTriangle, RotateCcw, WifiOff } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import AppEmptyState, { type ResponsiveValue } from './AppEmptyState';

interface AppErrorStateProps {
  /** Picks the warning icon: WifiOff for network errors, AlertTriangle otherwise. */
  type?: 'network' | 'server' | 'generic';
  title: ReactNode;
  description?: ReactNode;
  onRetry?: () => void;
  retryLabel?: ReactNode;
  minH?: ResponsiveValue<string | number>;
}

export default function AppErrorState({
  type = 'generic',
  title,
  description,
  onRetry,
  retryLabel,
  minH,
}: AppErrorStateProps) {
  const t = useTranslations('common');
  const IconComponent = type === 'network' ? WifiOff : AlertTriangle;

  return (
    <div role="alert" aria-live="polite" className="w-full">
      <AppEmptyState
        minH={minH}
        icon={<IconComponent aria-hidden className="size-10 text-orange-400" />}
        title={title}
        description={description ?? null}
        actions={
          onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm">
              <RotateCcw aria-hidden className="size-4" />
              {retryLabel ?? t('retry')}
            </Button>
          )
        }
      />
    </div>
  );
}
