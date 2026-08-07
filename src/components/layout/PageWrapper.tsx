'use client';

import { useSidebar } from '@/contexts/SidebarContext';
import { SIDEBAR_WIDTH_COLLAPSED, SIDEBAR_WIDTH_EXPANDED } from '@/constants';
import { cn } from '@/lib/utils';
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from 'react';
import {
  getResponsiveStyleParts,
  resolveCssColor,
  resolveCssSize,
  type ResponsiveStyleValue,
} from './shell-theme';

export type { ResponsiveStyleValue } from './shell-theme';

type DarkModeStyles = {
  bg?: ResponsiveStyleValue;
  background?: ResponsiveStyleValue;
  bgColor?: ResponsiveStyleValue;
  backgroundColor?: ResponsiveStyleValue;
};

export interface PageWrapperProps
  extends Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'color'> {
  children: ReactNode;
  bg?: ResponsiveStyleValue;
  background?: ResponsiveStyleValue;
  bgColor?: ResponsiveStyleValue;
  backgroundColor?: ResponsiveStyleValue;
  _dark?: DarkModeStyles;
  minH?: ResponsiveStyleValue;
  ml?: ResponsiveStyleValue;
}

type ShellStyle = CSSProperties & Record<`--${string}`, string | number>;

/**
 * Framework-neutral page boundary that preserves the small subset of Chakra
 * style props still supplied by PageLayout during the incremental migration.
 */
export default function PageWrapper({
  children,
  className,
  style,
  bg,
  background,
  bgColor,
  backgroundColor,
  _dark,
  minH = '100vh',
  ml,
  ...props
}: PageWrapperProps) {
  const { isCollapsed } = useSidebar();
  const lightBackground = getResponsiveStyleParts(
    background ?? backgroundColor ?? bgColor ?? bg
  );
  const explicitDarkBackground = getResponsiveStyleParts(
    _dark?.background ?? _dark?.backgroundColor ?? _dark?.bgColor ?? _dark?.bg
  );
  const minHeight = getResponsiveStyleParts(minH);
  const hasBackground = lightBackground.base !== undefined;
  const sidebarOffset =
    ml === 0 || ml === '0' || ml === '0px'
      ? '0px'
      : `${isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED}px`;

  const shellStyle: ShellStyle = {
    '--page-sidebar-offset': sidebarOffset,
    '--page-min-height-mobile': resolveCssSize(minHeight.base) ?? '100vh',
    '--page-min-height-desktop':
      resolveCssSize(minHeight.md ?? minHeight.base) ?? '100vh',
    ...(hasBackground
      ? {
          '--page-bg-mobile': resolveCssColor(lightBackground.base)!,
          '--page-bg-desktop': resolveCssColor(
            lightBackground.md ?? lightBackground.base
          )!,
          '--page-bg-dark-mobile': resolveCssColor(
            explicitDarkBackground.base ??
              lightBackground.dark ??
              lightBackground.base
          )!,
          '--page-bg-dark-desktop': resolveCssColor(
            explicitDarkBackground.md ??
              explicitDarkBackground.base ??
              lightBackground.dark ??
              lightBackground.md ??
              lightBackground.base
          )!,
        }
      : {}),
    ...style,
  };

  return (
    <div
      data-slot="page-wrapper"
      data-has-background={hasBackground ? 'true' : undefined}
      className={cn('page-wrapper-shell', className)}
      style={shellStyle}
      {...props}
    >
      {children}
    </div>
  );
}
