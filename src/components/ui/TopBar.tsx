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
  Image,
  Text,
} from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { LogIn, Menu, ChevronLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import NotificationBell from './NotificationBell';
import SlideOutMenu from './SlideOutMenu';
import UserMenu from './UserMenu';
import SubNavigation, { NavItem } from './SubNavigation';

interface TopBarProps {
  showBackButton?: boolean;
  backHref?: string;
  onBack?: () => void;
  title?: string;
  icon?: React.ReactNode;
  rightContent?: React.ReactNode;
  navItems?: NavItem[];
  /** 'secondary' hides menu/logo/notification/profile on mobile, shows back button */
  variant?: 'main' | 'secondary';
  hideBottomBorder?: boolean;
}

export default function TopBar({
  title,
  icon,
  rightContent,
  showBackButton = false,
  backHref = '/',
  onBack,
  navItems,
  variant = 'main',
  hideBottomBorder = false,
}: TopBarProps) {
  const common = useTranslations('common');
  const appName = common('appName');
  const { isAuthenticated, isLoading, isHydrated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const { toggleCollapse } = useSidebar();

  const normalizedPath =
    pathname.replace(/^\/[a-z]{2}(\/|$)/, '/').replace(/\/$/, '') || '/';
  const isLeftAlignedTitle =
    /^\/(player\/|host\/)?(sessions|venues|clubs|tournaments?)\/(?!(new|create|joined|pending|edit)$)[^/]+$/.test(
      normalizedPath
    );

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
        borderColor={{ base: '#d4d4d8', md: 'border' }}
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

              <Box
                display={
                  variant === 'secondary'
                    ? { base: 'none', md: 'flex' }
                    : 'flex'
                }
                alignItems="center"
              >
                <Link
                  href="/"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {icon || (
                    <Image
                      src="/icons/app-logo.png"
                      h="32px"
                      w="auto"
                      alt={appName}
                    />
                  )}
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
                      size="md"
                      onClick={onBack}
                    >
                      <ChevronLeft size={24} strokeWidth={2.5} />
                    </IconButton>
                  ) : (
                    <Link href={backHref}>
                      <IconButton
                        aria-label={common('back')}
                        variant="ghost"
                        color="fg"
                        _hover={{ bg: 'bg.muted' }}
                        borderRadius="full"
                        size="md"
                      >
                        <ChevronLeft size={24} strokeWidth={2.5} />
                      </IconButton>
                    </Link>
                  )}
                </Box>
              )}

              {/* App title */}
              {title && (
                <Heading
                  size={{ base: 'md', md: 'lg' }}
                  color="fg"
                  fontWeight="bold"
                  maxWidth={
                    isLeftAlignedTitle
                      ? { base: 'calc(100vw - 120px)', md: '600px' }
                      : { base: '50vw', md: '500px' }
                  }
                  whiteSpace="nowrap"
                  overflow="hidden"
                  textOverflow="ellipsis"
                  height="100%"
                  display="flex"
                  alignItems="center"
                  position={{
                    base: isLeftAlignedTitle ? 'static' : 'absolute',
                    md: isLeftAlignedTitle ? 'static' : 'absolute',
                  }}
                  left={{
                    base: isLeftAlignedTitle ? 'auto' : '50%',
                    md: isLeftAlignedTitle ? 'auto' : '50%',
                  }}
                  transform={{
                    base: isLeftAlignedTitle ? 'none' : 'translateX(-50%)',
                    md: isLeftAlignedTitle ? 'none' : 'translateX(-50%)',
                  }}
                  textAlign="left"
                  px={isLeftAlignedTitle ? 1 : 0}
                  pointerEvents={isLeftAlignedTitle ? 'auto' : 'none'}
                >
                  {title}
                </Heading>
              )}
            </Flex>

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

              {!isHydrated || isLoading ? null : isAuthenticated ? (
                <>
                  <Box display="flex" alignItems="center" gap={2}>
                    <NotificationBell color="fg" _hover={{ bg: 'bg.muted' }} />
                    <UserMenu onLogout={handleLogout} />
                  </Box>
                </>
              ) : (
                <Button
                  onClick={() => router.push('/auth/signin')}
                  colorPalette="green"
                  size="sm"
                  fontWeight="600"
                  boxShadow="0 2px 8px rgba(23, 154, 59, 0.25)"
                  _hover={{
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(23, 154, 59, 0.35)',
                  }}
                  transition="all 0.2s"
                >
                  <LogIn size={16} />
                  {common('login')}
                </Button>
              )}
            </Box>
          </Flex>
          {navItems && <SubNavigation items={navItems} />}
        </Container>
      </Box>

      <SlideOutMenu isOpen={isMenuOpen} onClose={onMenuClose} />
    </>
  );
}
