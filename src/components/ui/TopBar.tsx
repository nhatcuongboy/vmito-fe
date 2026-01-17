'use client';

import { NextLinkButton } from '@/components/ui/NextLinkButton';
import { Box, Container, Flex, Heading, IconButton } from '@chakra-ui/react';
import { ArrowLeft, Menu } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { AuthService } from '@/lib/api/auth.service';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import SlideOutMenu from './SlideOutMenu';
import NotificationBell from './NotificationBell';
import { UserRole } from '@/lib/api/types';

interface TopBarProps {
  showBackButton?: boolean;
  backHref?: string;
  title?: string;
}

export default function TopBar({
  showBackButton = false,
  backHref = '/',
  title,
}: TopBarProps) {
  const common = useTranslations('common');
  const appName = '🏸';
  const { user, isAuthenticated } = useAuthStore();
  const locale = useLocale();
  const router = useRouter();

  // Menu drawer state
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const onMenuOpen = () => setIsMenuOpen(true);
  const onMenuClose = () => setIsMenuOpen(false);

  const handleLogout = () => {
    const userRole = user?.role;

    const callbackUrl =
      userRole === UserRole.HOST || userRole === UserRole.ADMIN
        ? `/${locale}/auth/signin`
        : `/${locale}/join-by-code`;

    // Clear auth state
    AuthService.logout();
    onMenuClose();

    // Redirect
    router.push(callbackUrl);
  };

  return (
    <>
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        zIndex={999}
        bg="#0068FF"
        backdropFilter="blur(10px)"
        borderBottom="1px solid"
        borderColor="whiteAlpha.300"
        height={{
          base: 'calc(44px + env(safe-area-inset-top))',
          md: 'calc(56px + env(safe-area-inset-top))',
        }}
        minHeight={{ base: '44px', md: '56px' }}
        paddingTop="env(safe-area-inset-top)"
        color="white"
        _dark={{
          bg: '#0068FF',
          borderColor: 'whiteAlpha.300',
        }}
      >
        <Container maxW="container.xl" height="100%">
          <Flex justify="space-between" align="center" height="100%" py={0}>
            {/* Left side - Back button or spacer */}
            <Box minW="120px" height="100%" display="flex" alignItems="center">
              {showBackButton ? (
                <NextLinkButton
                  href={backHref}
                  variant="ghost"
                  size="sm"
                  color="white"
                  _hover={{ bg: 'whiteAlpha.200' }}
                >
                  <ArrowLeft size={16} />
                  {/* {common('back')} */}
                </NextLinkButton>
              ) : (
                <Box />
              )}
            </Box>

            {/* Center - App title */}
            <Heading
              size="lg"
              color="white"
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
              {title || appName}
            </Heading>

            {/* Right side - Menu button */}
            <Box
              minW="120px"
              height="100%"
              display="flex"
              alignItems="center"
              justifyContent="flex-end"
              gap={2}
            >
              {isAuthenticated && (
                <NotificationBell
                  color="white"
                  _hover={{ bg: 'whiteAlpha.200' }}
                />
              )}

              <IconButton
                aria-label="Open menu"
                onClick={onMenuOpen}
                variant="ghost"
                color="white"
                _hover={{ bg: 'whiteAlpha.200' }}
                borderRadius="full"
                size="md"
              >
                <Menu size={20} />
              </IconButton>
            </Box>
          </Flex>
        </Container>
      </Box>

      <SlideOutMenu
        isOpen={isMenuOpen}
        onClose={onMenuClose}
        onLogout={handleLogout}
      />
    </>
  );
}
