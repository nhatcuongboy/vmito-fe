'use client';

import {
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ReactNode,
  Suspense,
} from 'react';
import PageWrapper, {
  type PageWrapperProps,
  type ResponsiveStyleValue,
} from './PageWrapper';
import {
  getResponsiveStyleParts,
  resolveCssMaxWidth,
  resolveCssSize,
} from './shell-theme';
import TopBar from '../ui/TopBar';
import CityOnboardingModal from '../ui/CityOnboardingModal';
import { DiscoveryTabNav } from '../navigation/DiscoveryTabNav';
import { usePathname } from '@/i18n/config';
import { ROUTES } from '@/constants';
import {
  CONTAINER_PX,
  CONTENT_PT_OFFSET,
  TOP_BAR_HEIGHT_DESKTOP,
  TOP_BAR_HEIGHT_MOBILE,
} from '@/constants';
import { useIsMainPage } from '@/hooks/useBottomNavVisibility';
import { cn } from '@/lib/utils';

interface PageLayoutProps
  extends Omit<ComponentPropsWithoutRef<'main'>, 'children' | 'title'> {
  title?: React.ReactNode;
  icon?: ReactNode;
  mobileIcon?: ReactNode;
  rightContent?: ReactNode;
  showBackButton?: boolean;
  backHref?: string;
  onBack?: () => void;
  maxW?: string | number;
  children?: ReactNode;
  isLoading?: boolean;
  loadingComponent?: ReactNode;
  bg?: ResponsiveStyleValue;
  background?: ResponsiveStyleValue;
  bgColor?: ResponsiveStyleValue;
  backgroundColor?: ResponsiveStyleValue;
  _dark?: PageWrapperProps['_dark'];
  minH?: ResponsiveStyleValue;
  px?: ResponsiveStyleValue;
  pt?: ResponsiveStyleValue;
  pb?: ResponsiveStyleValue;
  scrollPaddingBottom?: ResponsiveStyleValue;
  overflowX?: CSSProperties['overflowX'];
  /** Override top bar variant. Auto-detected from pathname if not provided. */
  topBarVariant?: 'main' | 'secondary';
  subHeader?: ReactNode;
  /** Mobile offset height for subHeader content. Defaults to '44px'. */
  mobileSubHeaderOffset?: string;
  /** Hide the TopBar bottom border on mobile (for pages with search + sub menu) */
  hideTopBarBorder?: boolean;
  /** Force title to be centered on mobile regardless of path */
  centerTitle?: boolean;
  showTopBarMenuButton?: boolean;
  showTopBarLogo?: boolean;
  topBarLogoHref?: string;
  showTopBarLogoDesktopOnly?: boolean;
  showTopBarAuthActions?: boolean;
  showTopBarAiAssistantButton?: boolean;
  /** Disable the left margin offset normally applied for the global sidebar */
  disableSidebarOffset?: boolean;
  /**
   * Vertical gap between the top bar and the page content. Defaults to
   * CONTENT_PT_OFFSET; pass '0px' to butt the content right up against the bar
   * (e.g. the tournament shell, whose bordered container needs no extra gap).
   */
  contentTopOffset?: string;
  rootClassName?: string;
  topBarClassName?: string;
  /** On desktop, render this content centered in the top bar (search bar) instead of the title */
  topBarSearchContent?: ReactNode;
}

type PageContentStyle = CSSProperties & Record<`--${string}`, string | number>;

export default function PageLayout({
  title,
  icon,
  mobileIcon,
  rightContent,
  showBackButton,
  backHref,
  onBack,
  maxW = 'container.xl',
  children,
  isLoading = false,
  loadingComponent,
  bg,
  background,
  bgColor,
  backgroundColor,
  _dark,
  minH,
  topBarVariant,
  subHeader,
  mobileSubHeaderOffset = '44px',
  hideTopBarBorder = false,
  centerTitle = false,
  showTopBarMenuButton = true,
  showTopBarLogo = true,
  topBarLogoHref = '/',
  showTopBarLogoDesktopOnly = false,
  showTopBarAuthActions = true,
  showTopBarAiAssistantButton = true,
  disableSidebarOffset = false,
  contentTopOffset = CONTENT_PT_OFFSET,
  rootClassName,
  topBarClassName,
  topBarSearchContent,
  px = CONTAINER_PX,
  pt,
  pb = 'calc(64px + env(safe-area-inset-bottom) + 24px)',
  scrollPaddingBottom = 0,
  overflowX = 'visible',
  className,
  style,
  ...mainProps
}: PageLayoutProps) {
  const isMainPage = useIsMainPage();
  const variant = topBarVariant ?? (isMainPage ? 'main' : 'secondary');
  const pathname = usePathname();

  const isDiscoveryPage = [
    '/',
    ROUTES.BROWSE.VENUES.LIST,
    ROUTES.CLUBS.BROWSE,
    ROUTES.BROWSE.TOURNAMENTS.LIST,
  ].some((path) => {
    const normalized =
      pathname.replace(/^\/[a-z]{2}(\/|$)/, '/').replace(/\/$/, '') || '/';
    return normalized === path;
  });

  const hasSubHeader = isDiscoveryPage || !!subHeader;
  const defaultPaddingTop: ResponsiveStyleValue = {
    base: hasSubHeader
      ? isDiscoveryPage
        ? `calc(${TOP_BAR_HEIGHT_MOBILE}px + env(safe-area-inset-top) + 112px)`
        : `calc(${TOP_BAR_HEIGHT_MOBILE}px + env(safe-area-inset-top) + ${mobileSubHeaderOffset})`
      : `calc(${TOP_BAR_HEIGHT_MOBILE}px + env(safe-area-inset-top) + ${contentTopOffset})`,
    md: subHeader
      ? contentTopOffset
      : `calc(${TOP_BAR_HEIGHT_DESKTOP}px + env(safe-area-inset-top) + ${contentTopOffset})`,
  };
  const contentPaddingX = getResponsiveStyleParts(px);
  const contentPaddingTop = getResponsiveStyleParts(pt ?? defaultPaddingTop);
  const contentPaddingBottom = getResponsiveStyleParts(pb);
  const contentScrollPaddingBottom =
    getResponsiveStyleParts(scrollPaddingBottom);
  const contentMinHeight = getResponsiveStyleParts(minH ?? '100vh');
  const contentStyle: PageContentStyle = {
    '--page-content-max-width': resolveCssMaxWidth(maxW) ?? '80rem',
    '--page-content-px-mobile': resolveCssSize(contentPaddingX.base) ?? '0px',
    '--page-content-px-desktop':
      resolveCssSize(contentPaddingX.md ?? contentPaddingX.base) ?? '0px',
    '--page-content-pt-mobile': resolveCssSize(contentPaddingTop.base) ?? '0px',
    '--page-content-pt-desktop':
      resolveCssSize(contentPaddingTop.md ?? contentPaddingTop.base) ?? '0px',
    '--page-content-pb-mobile':
      resolveCssSize(contentPaddingBottom.base) ?? '0px',
    '--page-content-pb-desktop':
      resolveCssSize(contentPaddingBottom.md ?? contentPaddingBottom.base) ??
      '0px',
    '--page-content-scroll-pb-mobile':
      resolveCssSize(contentScrollPaddingBottom.base) ?? '0px',
    '--page-content-scroll-pb-desktop':
      resolveCssSize(
        contentScrollPaddingBottom.md ?? contentScrollPaddingBottom.base
      ) ?? '0px',
    '--page-content-min-height-mobile':
      resolveCssSize(contentMinHeight.base) ?? '100vh',
    '--page-content-min-height-desktop':
      resolveCssSize(contentMinHeight.md ?? contentMinHeight.base) ?? '100vh',
    '--page-content-overflow-x': overflowX,
    ...style,
  };

  return (
    <PageWrapper
      className={rootClassName}
      bg={bg as ResponsiveStyleValue}
      background={background as ResponsiveStyleValue}
      bgColor={bgColor as ResponsiveStyleValue}
      backgroundColor={backgroundColor as ResponsiveStyleValue}
      _dark={_dark as PageWrapperProps['_dark']}
      minH={(minH ?? '100vh') as ResponsiveStyleValue}
      {...(disableSidebarOffset ? { ml: 0 } : {})}
    >
      <TopBar
        title={title}
        icon={icon}
        mobileIcon={mobileIcon}
        rightContent={rightContent}
        showBackButton={showBackButton ?? variant === 'secondary'}
        backHref={backHref}
        onBack={onBack}
        variant={variant}
        hideBottomBorder={isDiscoveryPage || hideTopBarBorder}
        centerTitle={centerTitle}
        showMenuButton={showTopBarMenuButton}
        showLogo={showTopBarLogo}
        logoHref={topBarLogoHref}
        showLogoDesktopOnly={showTopBarLogoDesktopOnly}
        showAuthActions={showTopBarAuthActions}
        showAiAssistantButton={showTopBarAiAssistantButton}
        showCitySelector={isDiscoveryPage}
        className={topBarClassName}
        desktopSearchContent={topBarSearchContent}
      />
      {isDiscoveryPage && <CityOnboardingModal />}
      {isDiscoveryPage && (
        <Suspense fallback={null}>
          <DiscoveryTabNav />
        </Suspense>
      )}
      {!isDiscoveryPage && subHeader && (
        <div className="page-layout-subheader">{subHeader}</div>
      )}
      <main
        className={cn('page-layout-content', className)}
        style={contentStyle}
        {...mainProps}
      >
        {isLoading ? loadingComponent || null : children}
      </main>
    </PageWrapper>
  );
}
