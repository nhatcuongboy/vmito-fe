'use client';

import { Spinner } from '@/components/primitives/spinner';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import type { CSSProperties, HTMLAttributes } from 'react';

type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface LoadingSpinnerProps extends HTMLAttributes<HTMLDivElement> {
  minH?: string | number;
  py?: string | number;
  spinnerProps?: Omit<React.ComponentProps<typeof Spinner>, 'size'> & {
    size?: SpinnerSize;
  };
}

const spinnerSizes: Record<SpinnerSize, string> = {
  xs: 'size-3',
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-6',
  xl: 'size-8',
};

function spacingValue(value: string | number) {
  return typeof value === 'number' ? `${value * 0.25}rem` : value;
}

export default function LoadingSpinner({
  spinnerProps,
  minH,
  py = 10,
  className,
  style,
  ...props
}: LoadingSpinnerProps) {
  const t = useTranslations('common');
  const {
    size = 'xl',
    className: spinnerClassName,
    ...iconProps
  } = spinnerProps ?? {};
  const layoutStyle: CSSProperties = {
    minHeight: minH === undefined ? undefined : spacingValue(minH),
    paddingBlock: spacingValue(py),
    ...style,
  };

  return (
    <div
      className={cn('flex items-center justify-center', className)}
      style={layoutStyle}
      {...props}
    >
      <Spinner
        aria-label={t('loading')}
        className={cn('text-green-500', spinnerSizes[size], spinnerClassName)}
        {...iconProps}
      />
    </div>
  );
}
