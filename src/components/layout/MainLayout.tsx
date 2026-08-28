'use client';

import TopBar from '@/components/ui/TopBar';
import {
  SIDEBAR_WIDTH_COLLAPSED,
  SIDEBAR_WIDTH_EXPANDED,
  TOP_BAR_HEIGHT_DESKTOP,
  TOP_BAR_HEIGHT_MOBILE,
} from '@/constants';
import { useSidebar } from '@/contexts/SidebarContext';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
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
  showLogoDesktopOnly?: boolean;
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
  showLogoDesktopOnly = true,
}: MainLayoutProps) {
  const { isCollapsed } = useSidebar();
  const searchParams = useSearchParams();
  const [isEmbedded, setIsEmbedded] = useState(
    () =>
      searchParams.get('embedded') === '1' ||
      (typeof window !== 'undefined' &&
        window.sessionStorage.getItem('vmito.embedded') === '1')
  );
  useEffect(() => {
    const storageKey = 'vmito.embedded';
    const embedded =
      searchParams.get('embedded') === '1' ||
      window.sessionStorage.getItem(storageKey) === '1';
    if (embedded) window.sessionStorage.setItem(storageKey, '1');
    setIsEmbedded(embedded);
  }, [searchParams]);
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
    '--main-layout-top-mobile': `${isEmbedded ? 0 : TOP_BAR_HEIGHT_MOBILE}px`,
    '--main-layout-top-desktop': `${isEmbedded ? 0 : TOP_BAR_HEIGHT_DESKTOP}px`,
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
      {isEmbedded ? null : (
        <TopBar
          title={title}
          showBackButton={showBackButton}
          backHref={backHref}
          centerTitle={centerTitle}
          showLogoDesktopOnly={showLogoDesktopOnly}
        />
      )}
      <div data-slot="main-layout-scroll" className="main-layout-scroll">
        <div className="main-layout-column">
          <div className="main-layout-content">{children}</div>
        </div>
      </div>
    </div>
  );
}
