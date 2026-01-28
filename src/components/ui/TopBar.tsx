'use client';

import { NextLinkButton } from '@/components/ui/NextLinkButton';
import { Box, Container, Flex, Heading, IconButton, Image } from '@chakra-ui/react';
import { ArrowLeft, Menu } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { AuthService } from '@/lib/api/auth.service';
import SlideOutMenu from './SlideOutMenu';
import NotificationBell from './NotificationBell';
import Link from 'next/link';
import { useRouter } from '@/i18n/config';


interface TopBarProps {
  showBackButton?: boolean;
  backHref?: string;
  title?: string;
  icon?: React.ReactNode;
  rightContent?: React.ReactNode;
}

export default function TopBar({
  showBackButton = false,
  backHref = '/',
  title,
  icon,
  rightContent,
}: TopBarProps) {
  const common = useTranslations('common');
  const appName = common('appName');
  const { isAuthenticated } = useAuthStore();
  const locale = useLocale();
  const router = useRouter();

  // Menu drawer state
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const onMenuOpen = () => setIsMenuOpen(true);
  const onMenuClose = () => setIsMenuOpen(false);

  const handleLogout = () => {
    // Clear auth state
    AuthService.logout();
    onMenuClose();

    // Redirect
    router.push(`/auth/signin`);
  };

  return (
    <>
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        zIndex={999}
        bg="white"
        backdropFilter="blur(10px)"
        borderBottom="1px solid"
        borderColor="gray.200"
        height={{
          base: 'calc(44px + env(safe-area-inset-top))',
          md: 'calc(56px + env(safe-area-inset-top))',
        }}
        minHeight={{ base: '44px', md: '56px' }}
        paddingTop="env(safe-area-inset-top)"
        color="black"
        _dark={{
          bg: 'gray.800',
          borderColor: 'gray.700',
        }}
      >
        <Container maxW="container.xl" height="100%">
          <Flex justify="space-between" align="center" height="100%" py={0}>
            {/* Left side - Logo & Back button */}
            <Flex minW="120px" height="100%" alignItems="center" gap={2}>
              <Link href={`/${locale}`} style={{ display: 'flex', alignItems: 'center' }}>
                {icon || <Image src="/icons/app-logo.png" h="32px" w="auto" alt={appName} />}
              </Link>

              {showBackButton && (
                <NextLinkButton
                  href={backHref}
                  variant="ghost"
                  size="sm"
                  color="black"
                  _hover={{ bg: 'gray.100' }}
                  aria-label={common('back')}
                >
                  <ArrowLeft size={20} />
                </NextLinkButton>
              )}
            </Flex>

            {/* Center - App title */}
            <Heading
              size="lg"
              color="black"
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
              {rightContent}

              {isAuthenticated && (
                <NotificationBell color="black" _hover={{ bg: 'gray.100' }} />
              )}

              <IconButton
                aria-label="Open menu"
                onClick={onMenuOpen}
                variant="ghost"
                color="black"
                _hover={{ bg: 'gray.100' }}
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
