'use client';

import TopBar from '@/components/ui/TopBar';
import {
  SIDEBAR_WIDTH_COLLAPSED,
  SIDEBAR_WIDTH_EXPANDED,
  TOP_BAR_HEIGHT_DESKTOP,
  TOP_BAR_HEIGHT_MOBILE,
} from '@/constants';
import { useSidebar } from '@/contexts/SidebarContext';
import type { CSSProperties, ReactNode } from 'react';
import {
  resolveCssColor,
  resolveCssSize,
  type ResponsiveStyleValue,
} from './shell-theme';

interface MainLayoutProps {
  children: ReactNode;
  title: string;
  showBackButton?: boolean;
  backHref?: string;
  backgroundColor?: ResponsiveStyleValue;
  contentPadding?: number | string;
  centerTitle?: boolean;
}

type LayoutStyle = CSSProperties & Record<`--${string}`, string | number>;

export default function MainLayout({
  children,
  title,
  showBackButton = false,
  backHref = '/',
  backgroundColor = { base: 'green.50', _dark: 'gray.950' },
  contentPadding = 0,
  centerTitle = false,
}: MainLayoutProps) {
  const { isCollapsed } = useSidebar();
  const responsiveBackground =
    typeof backgroundColor === 'object'
      ? backgroundColor
      : { base: backgroundColor, md: backgroundColor };
  const lightBackground =
    responsiveBackground.base ?? responsiveBackground.md ?? 'green.50';
  const layoutStyle: LayoutStyle = {
    '--main-layout-sidebar-offset': `${
      isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED
    }px`,
    '--main-layout-top-mobile': `${TOP_BAR_HEIGHT_MOBILE}px`,
    '--main-layout-top-desktop': `${TOP_BAR_HEIGHT_DESKTOP}px`,
    '--main-layout-bg-mobile': resolveCssColor(lightBackground)!,
    '--main-layout-bg-desktop': resolveCssColor(
      responsiveBackground.md ?? lightBackground
    )!,
    '--main-layout-bg-dark': resolveCssColor(
      responsiveBackground._dark ?? lightBackground
    )!,
    '--main-layout-padding': resolveCssSize(contentPadding)!,
  };

  return (
    <div
      data-slot="main-layout"
      className="main-layout-shell"
      style={layoutStyle}
    >
      <TopBar
        title={title}
        showBackButton={showBackButton}
        backHref={backHref}
        centerTitle={centerTitle}
      />
      <div data-slot="main-layout-scroll" className="main-layout-scroll">
        <div className="main-layout-column">
          <div className="main-layout-content">{children}</div>
        </div>
      </div>
    </div>
  );
}
