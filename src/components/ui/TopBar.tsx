'use client';

import {
  TOP_BAR_HEIGHT_DESKTOP,
  TOP_BAR_HEIGHT_MOBILE,
  ROUTES,
} from '@/constants';
import { Link, useRouter } from '@/i18n/config';
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
import { LogIn, Menu, ArrowLeft } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import NotificationBell from './NotificationBell';
import SlideOutMenu from './SlideOutMenu';
import UserMenu from './UserMenu';
import SubNavigation, { NavItem } from './SubNavigation';

interface TopBarProps {
  showBackButton?: boolean;
  backHref?: string;
  title?: string;
  icon?: React.ReactNode;
  rightContent?: React.ReactNode;
  navItems?: NavItem[];
}

export default function TopBar({
  title,
  icon,
  rightContent,
  showBackButton = false,
  backHref = '/',
  navItems,
}: TopBarProps) {
  const common = useTranslations('common');
  const appName = common('appName');
  const { isAuthenticated, isLoading, isHydrated } = useAuthStore();
  const locale = useLocale();
  const router = useRouter();
  const { toggleCollapse } = useSidebar();

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
        borderBottom="1px solid"
        borderColor="border"
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
          >
            {/* Left side - Menu, Logo & Back button */}
            <Flex height="100%" alignItems="center" gap={2}>
              {showBackButton && (
                <Link href={backHref}>
                  <IconButton
                    aria-label={common('back')}
                    variant="ghost"
                    color="fg"
                    _hover={{ bg: 'bg.muted' }}
                    borderRadius="full"
                    size="md"
                  >
                    <ArrowLeft size={20} />
                  </IconButton>
                </Link>
              )}

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
              >
                <Menu size={20} />
              </IconButton>

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
            </Flex>

            {/* Center - App title */}
            {title && (
              <Heading
                size={{ base: 'md', md: 'lg' }}
                color="fg"
                fontWeight="bold"
                textAlign="center"
                maxWidth={{ base: '60vw', md: '500px' }}
                whiteSpace="nowrap"
                overflow="hidden"
                textOverflow="ellipsis"
                px={2}
                height="100%"
                display="flex"
                alignItems="center"
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
            >
              {rightContent}

              {!isHydrated || isLoading ? null : isAuthenticated ? (
                <>
                  <NotificationBell color="fg" _hover={{ bg: 'bg.muted' }} />
                  <UserMenu onLogout={handleLogout} />
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
