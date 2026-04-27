'use client';

import { ReactNode } from 'react';
import { Box, Container, ContainerProps } from '@chakra-ui/react';
import PageWrapper from './PageWrapper';
import TopBar from '../ui/TopBar';
import { DiscoveryTabNav } from '../navigation/DiscoveryTabNav';
import { useRouter, usePathname } from '@/i18n/config';
import { ROUTES } from '@/constants';
import {
  CONTAINER_PX,
  CONTENT_PT_OFFSET,
  TOP_BAR_HEIGHT_DESKTOP,
  TOP_BAR_HEIGHT_MOBILE,
} from '@/constants';
import { useIsMainPage } from '@/hooks/useBottomNavVisibility';

interface PageLayoutProps extends Omit<ContainerProps, 'title'> {
  title?: string;
  icon?: ReactNode;
  rightContent?: ReactNode;
  showBackButton?: boolean;
  backHref?: string;
  maxW?: string;
  children?: ReactNode;
  isLoading?: boolean;
  loadingComponent?: ReactNode;
  /** Override top bar variant. Auto-detected from pathname if not provided. */
  topBarVariant?: 'main' | 'secondary';
  subHeader?: ReactNode;
}

export default function PageLayout({
  title,
  icon,
  rightContent,
  showBackButton,
  backHref,
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
    >
      <TopBar
        title={title}
        icon={icon}
        rightContent={rightContent}
        showBackButton={showBackButton ?? variant === 'secondary'}
        backHref={backHref}
        variant={variant}
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
            ? `calc(${TOP_BAR_HEIGHT_MOBILE}px + env(safe-area-inset-top) + 44px)`
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
