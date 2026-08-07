'use client';

import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import type { CSSProperties, ReactNode } from 'react';

export type ResponsiveValue<T> =
  | T
  | Partial<Record<'base' | 'sm' | 'md' | 'lg' | 'xl', T>>;

interface AppEmptyStateProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  minH?: ResponsiveValue<string | number>;
  maxW?: ResponsiveValue<string | number>;
  /** Override the default grey wash — e.g. on a tinted page background. */
  bg?: ResponsiveValue<string>;
  /** Override the default grey dashed border to match the surrounding page. */
  borderColor?: ResponsiveValue<string>;
  className?: string;
}

type ResponsiveStyles = CSSProperties & Record<`--empty-${string}`, string>;

const chakraColorFallbacks: Record<string, string> = {
  bg: 'hsl(var(--background))',
  'gray.200': '#e2e8f0',
  'green.100': '#dcfce7',
};

function toCssValue(value: string | number) {
  if (typeof value === 'number') return `${value}px`;
  return chakraColorFallbacks[value] ?? value;
}

function responsiveStyles(
  name: string,
  value: ResponsiveValue<string | number> | undefined
) {
  if (value === undefined) return {};
  const breakpoints = ['base', 'sm', 'md', 'lg', 'xl'] as const;
  const values =
    typeof value === 'object'
      ? value
      : ({ base: value } satisfies Partial<
          Record<(typeof breakpoints)[number], string | number>
        >);
  const styles: ResponsiveStyles = {};
  let inheritedValue: string | number | undefined;

  // Chakra's responsive props inherit the most recent smaller-breakpoint
  // value. Mirror that behavior so every Tailwind breakpoint references a
  // defined custom property instead of falling back to currentColor/none.
  for (const breakpoint of breakpoints) {
    inheritedValue = values[breakpoint] ?? inheritedValue;
    if (inheritedValue !== undefined) {
      styles[`--empty-${name}-${breakpoint}`] = toCssValue(inheritedValue);
    }
  }

  return styles;
}

export default function AppEmptyState({
  title,
  description,
  icon,
  actions,
  minH,
  maxW = '100%',
  bg = 'linear-gradient(180deg, #fafafa 0%, #f5f5f5 100%)',
  borderColor = 'gray.200',
  className,
}: AppEmptyStateProps) {
  const t = useTranslations('common');
  const resolvedDescription =
    description === undefined ? t('emptyFilterHint') : description;
  const style = {
    ...responsiveStyles('min-h', minH),
    ...responsiveStyles('max-w', maxW),
    ...responsiveStyles('background', bg),
    ...responsiveStyles('border', borderColor),
  };

  return (
    <section
      data-slot="app-empty-state"
      className={cn(
        'mx-auto w-full max-w-[var(--empty-max-w-base)] border-2 border-dashed border-[var(--empty-border-base)] [background:var(--empty-background-base)]',
        'sm:max-w-[var(--empty-max-w-sm)] sm:border-[var(--empty-border-sm)] sm:[background:var(--empty-background-sm)]',
        'md:max-w-[var(--empty-max-w-md)] md:border-[var(--empty-border-md)] md:[background:var(--empty-background-md)]',
        'lg:max-w-[var(--empty-max-w-lg)] lg:border-[var(--empty-border-lg)] lg:[background:var(--empty-background-lg)]',
        'xl:max-w-[var(--empty-max-w-xl)] xl:border-[var(--empty-border-xl)] xl:[background:var(--empty-background-xl)]',
        'rounded-2xl dark:border-gray-800 dark:[background:linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.01)_100%)]',
        className
      )}
      style={style}
    >
      <div
        className={cn(
          'flex min-h-[var(--empty-min-h-base)] items-center justify-center p-8',
          'sm:min-h-[var(--empty-min-h-sm)] md:min-h-[var(--empty-min-h-md)] md:p-12',
          'lg:min-h-[var(--empty-min-h-lg)] xl:min-h-[var(--empty-min-h-xl)]'
        )}
      >
        <div className="flex w-full flex-col items-center gap-6 text-center">
          {icon && (
            <div className="flex size-20 items-center justify-center rounded-2xl border border-gray-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:border-gray-700 dark:bg-gray-800 dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
              {icon}
            </div>
          )}

          <div className="flex w-full flex-col items-center gap-2">
            <h2 className="text-center text-xl! font-bold! tracking-[-0.01em] text-gray-800 md:text-2xl! dark:text-white">
              {title}
            </h2>
            {resolvedDescription && (
              <p className="max-w-[520px] text-center text-sm leading-[1.6] text-gray-500 md:text-base dark:text-gray-300">
                {resolvedDescription}
              </p>
            )}
          </div>

          {actions && (
            <div className="flex w-full justify-center">{actions}</div>
          )}
        </div>
      </div>
    </section>
  );
}
