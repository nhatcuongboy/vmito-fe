'use client';

import { ReactNode } from 'react';
import { Box, Container, ContainerProps } from '@chakra-ui/react';
import PageWrapper from './PageWrapper';
import TopBar from '../ui/TopBar';
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

interface PageLayoutProps extends Omit<ContainerProps, 'title'> {
  title?: React.ReactNode;
  icon?: ReactNode;
  mobileIcon?: ReactNode;
  rightContent?: ReactNode;
  showBackButton?: boolean;
  backHref?: string;
  onBack?: () => void;
  maxW?: string;
  children?: ReactNode;
  isLoading?: boolean;
  loadingComponent?: ReactNode;
  /** Override top bar variant. Auto-detected from pathname if not provided. */
  topBarVariant?: 'main' | 'secondary';
  subHeader?: ReactNode;
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
}

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
  hideTopBarBorder = false,
  centerTitle = false,
  showTopBarMenuButton = true,
  showTopBarLogo = true,
  topBarLogoHref = '/',
  showTopBarLogoDesktopOnly = false,
  showTopBarAuthActions = true,
  showTopBarAiAssistantButton = true,
  disableSidebarOffset = false,
  ...containerProps
}: PageLayoutProps) {
  const isMainPage = useIsMainPage();
  const variant = topBarVariant ?? (isMainPage ? 'main' : 'secondary');
  const pathname = usePathname();

  const isDiscoveryPage = [
    '/',
    ROUTES.BROWSE.VENUES.LIST,
    ROUTES.CLUBS.BROWSE,
  ].some((path) => {
    const normalized =
      pathname.replace(/^\/[a-z]{2}(\/|$)/, '/').replace(/\/$/, '') || '/';
    return normalized === path;
  });

  const hasSubHeader = isDiscoveryPage || !!subHeader;

  return (
    <PageWrapper
      bg={bg}
      background={background}
      bgColor={bgColor}
      backgroundColor={backgroundColor}
      _dark={_dark}
      minH={minH ?? '100vh'}
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
      />
      {isDiscoveryPage && <DiscoveryTabNav />}
      {!isDiscoveryPage && subHeader && (
        <Box
          pt={{
            md: `calc(${TOP_BAR_HEIGHT_DESKTOP}px + env(safe-area-inset-top))`,
          }}
          w="100%"
        >
          {subHeader}
        </Box>
      )}
      <Container
        maxW={maxW}
        px={CONTAINER_PX}
        minH={minH ?? '100vh'}
        pt={{
          base: hasSubHeader
            ? isDiscoveryPage
              ? `calc(${TOP_BAR_HEIGHT_MOBILE}px + env(safe-area-inset-top) + 112px)`
              : `calc(${TOP_BAR_HEIGHT_MOBILE}px + env(safe-area-inset-top) + 44px)`
            : `calc(${TOP_BAR_HEIGHT_MOBILE}px + env(safe-area-inset-top) + ${CONTENT_PT_OFFSET})`,
          md: subHeader
            ? CONTENT_PT_OFFSET
            : `calc(${TOP_BAR_HEIGHT_DESKTOP}px + env(safe-area-inset-top) + ${CONTENT_PT_OFFSET})`,
        }}
        pb="calc(64px + env(safe-area-inset-bottom) + 24px)"
        {...containerProps}
      >
        {isLoading ? loadingComponent || null : children}
      </Container>
    </PageWrapper>
  );
}
