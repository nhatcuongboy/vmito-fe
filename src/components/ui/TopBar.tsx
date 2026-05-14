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
import NotificationBell from './NotificationBell';
import SlideOutMenu from './SlideOutMenu';
import UserMenu from './UserMenu';
import SubNavigation, { NavItem } from './SubNavigation';
import AiAssistantTopBarButton from './AiAssistantTopBarButton';
import { useAiAssistantVisibility } from '@/hooks/useAiAssistantVisibility';

interface TopBarProps {
  showBackButton?: boolean;
  backHref?: string;
  onBack?: () => void;
  title?: React.ReactNode;
  icon?: React.ReactNode;
  rightContent?: React.ReactNode;
  navItems?: NavItem[];
  /** 'secondary' hides menu/logo/notification/profile on mobile, shows back button */
  variant?: 'main' | 'secondary';
  hideBottomBorder?: boolean;
  /** Force title to be centered on mobile regardless of path */
  centerTitle?: boolean;
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
  centerTitle = false,
}: TopBarProps) {
  const common = useTranslations('common');
  const appName = common('appName');
  const { isAuthenticated, isLoading, isHydrated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const { toggleCollapse } = useSidebar();
  const showAiAssistant = useAiAssistantVisibility();

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

              {/* App title - left aligned detail pages on mobile */}
              {title && isLeftAlignedTitle && (
                <Heading
                  size={{ base: 'md', md: 'lg' }}
                  color="fg"
                  fontWeight="bold"
                  maxWidth={{ base: 'calc(100vw - 168px)', md: '600px' }}
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

            {/* App title - centered independently from left/right actions */}
            {title && isCenteredTitle && (
              <Heading
                size={{ base: 'md', md: 'lg' }}
                color="fg"
                fontWeight="bold"
                maxWidth={{ base: '50vw', md: '500px' }}
                whiteSpace="nowrap"
                overflow="hidden"
                textOverflow="ellipsis"
                height="100%"
                display="flex"
                alignItems="center"
                justifyContent="center"
                position="absolute"
                left="50%"
                transform="translateX(-50%)"
                textAlign="center"
                pointerEvents="none"
              >
                {title}
              </Heading>
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

              {!isHydrated || isLoading ? null : isAuthenticated ? (
                <>
                  <Box display="flex" alignItems="center" gap={2}>
                    {showAiAssistant && <AiAssistantTopBarButton />}
                    <NotificationBell color="fg" _hover={{ bg: 'bg.muted' }} />
                    <UserMenu onLogout={handleLogout} />
                  </Box>
                </>
              ) : !pathname.includes('/auth/signin') &&
                !pathname.includes('/auth/signup') ? (
                <Button
                  onClick={() => router.push('/auth/signin')}
                  colorPalette="green"
                  variant="outline"
                  size="xs"
                  h={{ base: '36px', md: '38px' }}
                  minW="auto"
                  px={{ base: 3, md: 4 }}
                  gap={1.5}
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
                  <LogIn size={15} />
                  {common('login')}
                </Button>
              ) : null}
            </Box>
          </Flex>
          {navItems && <SubNavigation items={navItems} />}
        </Container>
      </Box>

      <SlideOutMenu isOpen={isMenuOpen} onClose={onMenuClose} />
    </>
  );
}
