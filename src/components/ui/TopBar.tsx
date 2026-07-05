'use client';

import {
  TOP_BAR_HEIGHT_DESKTOP,
  TOP_BAR_HEIGHT_MOBILE,
  ROUTES,
} from '@/constants';
import { Link, useRouter, usePathname } from '@/i18n/config';
import { AuthService } from '@/lib/api/auth.service';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSidebar } from '@/contexts/SidebarContext';
import {
  Box,
  Container,
  Flex,
  Heading,
  IconButton,
  Text,
} from '@chakra-ui/react';
import { Button, Image } from '@/components/ui/chakra-compat';
import { LogIn, Menu, ChevronLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import SubNavigation, { NavItem } from './SubNavigation';
// SlideOutMenu doubles as the persistent desktop sidebar (translateX(0) at
// the md breakpoint, see SlideOutMenu.tsx) — PageWrapper reserves margin for
// it on first paint, so it must render immediately. Lazy-loading it left a
// blank gap where the sidebar should be until the chunk loaded.
import SlideOutMenu from './SlideOutMenu';

// These are genuinely interaction/auth-gated (only matter post-hydration),
// so keep them out of the initial bundle. Fixed-size placeholders prevent
// layout shift while their chunks load.
const NotificationBell = dynamic(() => import('./NotificationBell'), {
  ssr: false,
  loading: () => <Box w="40px" h="40px" />,
});
const UserMenu = dynamic(() => import('./UserMenu'), {
  ssr: false,
  loading: () => <Box w="40px" h="40px" />,
});
import AiAssistantTopBarButton from './AiAssistantTopBarButton';
import { useAiAssistantVisibility } from '@/hooks/useAiAssistantVisibility';
import CitySelector from './CitySelector';
import { useTopBarSearch } from '@/contexts/TopBarSearchContext';
import { DebouncedAppSearchBar } from '@/components/common/DebouncedAppSearchBar';

interface TopBarProps {
  showBackButton?: boolean;
  backHref?: string;
  onBack?: () => void;
  title?: React.ReactNode;
  icon?: React.ReactNode;
  mobileIcon?: React.ReactNode;
  rightContent?: React.ReactNode;
  navItems?: NavItem[];
  /** 'secondary' hides menu/logo/notification/profile on mobile, shows back button */
  variant?: 'main' | 'secondary';
  hideBottomBorder?: boolean;
  /** Force title to be centered on mobile regardless of path */
  centerTitle?: boolean;
  showMenuButton?: boolean;
  showLogo?: boolean;
  logoHref?: string;
  showLogoDesktopOnly?: boolean;
  showAuthActions?: boolean;
  showAiAssistantButton?: boolean;
  showCitySelector?: boolean;
  className?: string;
  /** On desktop, render this content centered in the top bar instead of the title */
  desktopSearchContent?: React.ReactNode;
}

export default function TopBar({
  title,
  icon,
  mobileIcon,
  rightContent,
  showBackButton = false,
  backHref = '/',
  onBack,
  navItems,
  variant = 'main',
  hideBottomBorder = false,
  centerTitle = false,
  showMenuButton = true,
  showLogo = true,
  logoHref = '/',
  showLogoDesktopOnly = false,
  showAuthActions = true,
  showAiAssistantButton = true,
  showCitySelector = false,
  className,
  desktopSearchContent,
}: TopBarProps) {
  const common = useTranslations('common');
  const appName = common('appName');
  const { isAuthenticated, isLoading, isHydrated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const { toggleCollapse } = useSidebar();
  const showAiAssistant = useAiAssistantVisibility();
  const { searchConfig, callbacksRef } = useTopBarSearch();

  // Context search config takes priority; construct the search bar. Fall back to
  // prop. Uses the debounced variant so typing stays snappy and doesn't lose
  // characters while the onChange side effect (URL navigation) is in flight.
  const resolvedDesktopSearch = searchConfig ? (
    <DebouncedAppSearchBar
      value={searchConfig.value}
      onChange={(val) => callbacksRef.current?.onChange(val)}
      placeholder={searchConfig.placeholder}
      onFilterClick={
        searchConfig.hasFilterClick
          ? () => callbacksRef.current?.onFilterClick?.()
          : undefined
      }
      activeFilterCount={searchConfig.activeFilterCount}
      showFilter={searchConfig.showFilter}
    />
  ) : (
    desktopSearchContent
  );

  const normalizedPath =
    pathname.replace(/^\/[a-z]{2}(\/|$)/, '/').replace(/\/$/, '') || '/';
  const isLeftAlignedTitle =
    !centerTitle &&
    /^\/(player\/|host\/)?(sessions|venues|clubs|tournaments?)\/(?!(new|create|joined|pending|edit)$)[^/]+$/.test(
      normalizedPath
    );
  const isCenteredTitle = !isLeftAlignedTitle;

  // Menu drawer state
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const onMenuOpen = () => setIsMenuOpen(true);
  const onMenuClose = () => setIsMenuOpen(false);

  const handleLogout = () => {
    // Clear auth state
    AuthService.logout();
    onMenuClose();

    // Redirect
    router.push(ROUTES.AUTH.SIGNIN);
  };

  return (
    <>
      <Box
        className={className}
        position="fixed"
        top={0}
        left={0}
        right={0}
        zIndex={1100}
        bg="bg"
        backdropFilter="blur(10px)"
        borderBottom={
          hideBottomBorder ? { base: 'none', md: '1px solid' } : '1px solid'
        }
        // borderBottom="1px solid"
        borderColor={{ base: 'gray.200', md: 'border', _dark: 'gray.700' }}
        height={
          navItems
            ? {
                base: `calc(${TOP_BAR_HEIGHT_MOBILE + 40}px + env(safe-area-inset-top))`,
                md: `calc(${TOP_BAR_HEIGHT_DESKTOP + 40}px + env(safe-area-inset-top))`,
              }
            : {
                base: `calc(${TOP_BAR_HEIGHT_MOBILE}px + env(safe-area-inset-top))`,
                md: `calc(${TOP_BAR_HEIGHT_DESKTOP}px + env(safe-area-inset-top))`,
              }
        }
        minHeight={
          navItems
            ? {
                base: `${TOP_BAR_HEIGHT_MOBILE + 40}px`,
                md: `${TOP_BAR_HEIGHT_DESKTOP + 40}px`,
              }
            : {
                base: `${TOP_BAR_HEIGHT_MOBILE}px`,
                md: `${TOP_BAR_HEIGHT_DESKTOP}px`,
              }
        }
        paddingTop="env(safe-area-inset-top)"
        color="fg"
        transition="all 0.3s ease"
      >
        <Container maxW="full" height="auto" px="0">
          <Flex
            justify="space-between"
            align="center"
            height={{
              base: `${TOP_BAR_HEIGHT_MOBILE}px`,
              md: `${TOP_BAR_HEIGHT_DESKTOP}px`,
            }}
            px="16px"
            position="relative"
          >
            {/* Left side - Menu, Logo & Back button */}
            <Flex
              height="100%"
              alignItems="center"
              gap={2}
              zIndex={1}
              flex={isLeftAlignedTitle ? 1 : 'none'}
              minW={0}
            >
              {showMenuButton && (
                <IconButton
                  aria-label="Open menu"
                  onClick={() => {
                    const isMobile = window.innerWidth < 768;
                    if (isMobile) {
                      onMenuOpen();
                    } else {
                      toggleCollapse();
                    }
                  }}
                  variant="ghost"
                  color="fg"
                  _hover={{ bg: 'bg.muted' }}
                  borderRadius="full"
                  size="md"
                  display={
                    variant === 'secondary'
                      ? { base: 'none', md: 'flex' }
                      : 'flex'
                  }
                >
                  <Menu size={20} />
                </IconButton>
              )}

              {showLogo && (
                <Box
                  display={
                    variant === 'secondary' || showLogoDesktopOnly
                      ? { base: 'none', md: 'flex' }
                      : 'flex'
                  }
                  alignItems="center"
                >
                  <Link
                    href={logoHref}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <Box display={{ base: 'flex', md: 'none' }}>
                      {mobileIcon || icon || (
                        <Image
                          src="/icons/app-logo-96.png"
                          h="32px"
                          w="32px"
                          alt={appName}
                          loading="eager"
                          fetchPriority="high"
                        />
                      )}
                    </Box>
                    <Box display={{ base: 'none', md: 'flex' }}>
                      {icon || (
                        <Image
                          src="/icons/app-logo-96.png"
                          h="32px"
                          w="32px"
                          alt={appName}
                          loading="eager"
                          fetchPriority="high"
                        />
                      )}
                    </Box>
                    <Text
                      display={{ base: 'none', md: 'block' }}
                      fontSize={{ base: 'md', md: 'lg' }}
                      fontWeight="bold"
                      color="green.600"
                    >
                      Vmito
                    </Text>
                  </Link>
                </Box>
              )}

              {showCitySelector && variant !== 'secondary' && (
                <Box
                  display={{ base: 'none', md: 'block' }}
                  ml={{ base: 0, md: 3 }}
                >
                  <CitySelector />
                </Box>
              )}

              {/* Back button logic */}
              {(showBackButton || variant === 'secondary') && (
                <Box
                  display={
                    variant === 'secondary'
                      ? { base: 'flex', md: 'none' }
                      : 'flex'
                  }
                  alignItems="center"
                >
                  {onBack ? (
                    <IconButton
                      aria-label={common('back')}
                      variant="ghost"
                      color="fg"
                      _hover={{ bg: 'bg.muted' }}
                      borderRadius="full"
                      onClick={onBack}
                      css={{
                        width: '48px !important',
                        height: '48px !important',
                        minWidth: '48px !important',
                      }}
                    >
                      <ChevronLeft size={28} strokeWidth={2.5} />
                    </IconButton>
                  ) : (
                    <Link href={backHref}>
                      <IconButton
                        aria-label={common('back')}
                        variant="ghost"
                        color="fg"
                        _hover={{ bg: 'bg.muted' }}
                        borderRadius="full"
                        css={{
                          width: '48px !important',
                          height: '48px !important',
                          minWidth: '48px !important',
                        }}
                      >
                        <ChevronLeft size={28} strokeWidth={2.5} />
                      </IconButton>
                    </Link>
                  )}
                </Box>
              )}

              {/* App title - left aligned detail pages on mobile */}
              {title && isLeftAlignedTitle && (
                <Heading
                  size={{ md: 'lg' }}
                  fontSize={{ base: '18px', md: undefined }}
                  color="fg"
                  fontWeight="bold"
                  maxWidth={{ base: '100%', md: '600px' }}
                  minW={0}
                  whiteSpace="nowrap"
                  overflow="hidden"
                  textOverflow="ellipsis"
                  height="100%"
                  display="flex"
                  alignItems="center"
                  position={{ base: 'static', md: 'absolute' }}
                  left={{ md: '50%' }}
                  transform={{ md: 'translateX(-50%)' }}
                  textAlign={{ base: 'left', md: 'center' }}
                  px={1}
                  pointerEvents="auto"
                >
                  {title}
                </Heading>
              )}
            </Flex>

            {/* Desktop search content - shown only on desktop, centered */}
            {resolvedDesktopSearch && (
              <Flex
                flex={1}
                minW={0}
                mx={2}
                height="100%"
                align="center"
                justify="center"
                display={{ base: 'none', md: 'flex' }}
              >
                <Box w="100%" maxW="500px">
                  {resolvedDesktopSearch}
                </Box>
              </Flex>
            )}

            {/* App title - centered in the space between the side actions.
                Kept in normal flow (not absolutely positioned) so it can never
                sit underneath the action buttons, and truncates with a single
                trailing ellipsis instead of clipping both ends. */}
            {title && isCenteredTitle && (
              <Flex
                flex={1}
                minW={0}
                mx={2}
                height="100%"
                align="center"
                justify="center"
                display={
                  resolvedDesktopSearch ? { base: 'flex', md: 'none' } : 'flex'
                }
              >
                <Heading
                  size={{ base: 'md', md: 'lg' }}
                  color="fg"
                  fontWeight="bold"
                  minW={0}
                  maxWidth="100%"
                  whiteSpace="nowrap"
                  overflow="hidden"
                  textOverflow="ellipsis"
                >
                  {title}
                </Heading>
              </Flex>
            )}

            {/* Right side - Actions */}
            <Box
              height="100%"
              display="flex"
              alignItems="center"
              justifyContent="flex-end"
              gap={2}
              zIndex={1}
            >
              {rightContent}

              {!showAuthActions ||
              !isHydrated ||
              isLoading ? null : isAuthenticated ? (
                <>
                  <Box display="flex" alignItems="center" gap={2}>
                    {showAiAssistant && showAiAssistantButton && (
                      <AiAssistantTopBarButton />
                    )}
                    <NotificationBell color="fg" _hover={{ bg: 'bg.muted' }} />
                    <UserMenu onLogout={handleLogout} />
                  </Box>
                </>
              ) : !pathname.includes('/auth/signin') &&
                !pathname.includes('/auth/signup') ? (
                <Button
                  aria-label={common('login')}
                  onClick={() => router.push('/auth/signin')}
                  colorPalette="green"
                  variant="outline"
                  size="xs"
                  h={{ base: '40px', md: '38px' }}
                  w={{ base: '40px', md: 'auto' }}
                  minW={{ base: '40px', md: 'auto' }}
                  px={{ base: 0, md: 4 }}
                  gap={{ base: 0, md: 1.5 }}
                  fontSize={{ base: 'sm', md: 'sm' }}
                  fontWeight="700"
                  borderRadius="md"
                  bg={{ base: 'white', _dark: 'gray.900' }}
                  borderColor="green.500"
                  color="green.700"
                  boxShadow="0 1px 4px rgba(23, 154, 59, 0.12)"
                  _hover={{
                    bg: 'green.50',
                    borderColor: 'green.600',
                    color: 'green.800',
                    boxShadow: '0 2px 8px rgba(23, 154, 59, 0.18)',
                    _dark: {
                      bg: 'green.950',
                      color: 'green.200',
                    },
                  }}
                  _dark={{
                    bg: 'gray.900',
                    borderColor: 'green.400',
                    color: 'green.200',
                  }}
                  transition="background-color 0.2s, border-color 0.2s, color 0.2s, box-shadow 0.2s"
                >
                  <LogIn size={17} />
                  <Box as="span" display={{ base: 'none', md: 'inline' }}>
                    {common('login')}
                  </Box>
                </Button>
              ) : null}
            </Box>
          </Flex>
          {navItems && <SubNavigation items={navItems} />}
        </Container>
      </Box>

      {showMenuButton && (
        <SlideOutMenu isOpen={isMenuOpen} onClose={onMenuClose} />
      )}
    </>
  );
}
