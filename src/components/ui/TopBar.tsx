'use client';

import { TOP_BAR_HEIGHT_DESKTOP, TOP_BAR_HEIGHT_MOBILE } from '@/constants';
import { useRouter } from '@/i18n/config';
import { AuthService } from '@/lib/api/auth.service';
import { useAuthStore } from '@/stores/useAuthStore';
import { Box, Button, Container, Flex, Heading, IconButton, Image, Text } from '@chakra-ui/react';
import { Menu } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState } from 'react';
import NotificationBell from './NotificationBell';
import SlideOutMenu from './SlideOutMenu';
import UserMenu from './UserMenu';


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
          base: `calc(${TOP_BAR_HEIGHT_MOBILE}px + env(safe-area-inset-top))`,
          md: `calc(${TOP_BAR_HEIGHT_DESKTOP}px + env(safe-area-inset-top))`,
        }}
        minHeight={{ base: `${TOP_BAR_HEIGHT_MOBILE}px`, md: `${TOP_BAR_HEIGHT_DESKTOP}px` }}
        paddingTop="env(safe-area-inset-top)"
        color="black"
        _dark={{
          bg: 'gray.800',
          borderColor: 'gray.700',
        }}
      >
        <Container maxW="container.xl" height="100%" px="16px">
          <Flex justify="space-between" align="center" height="100%" py={0}>
            {/* Left side - Menu, Logo & Back button */}
            <Flex height="100%" alignItems="center" gap={2}>
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

              <Link href={`/${locale}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {icon || <Image src="/icons/app-logo.png" h="32px" w="auto" alt={appName} />}
                <Text fontSize={{ base: "md", md: "lg" }} fontWeight="bold" color="blue.600">Vmito</Text>
              </Link>

              {/* {showBackButton && (
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
              )} */}
            </Flex>

            {/* Center - App title */}
            {title && (<Heading
              size={{ base: "md", md: "lg" }}
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
              {title}
            </Heading>)}

            {/* Right side - Actions */}
            <Box
              height="100%"
              display="flex"
              alignItems="center"
              justifyContent="flex-end"
              gap={2}
            >
              {rightContent}

              {isAuthenticated ? (
                <>
                  <NotificationBell color="black" _hover={{ bg: 'gray.100' }} />
                  <UserMenu onLogout={handleLogout} />
                </>
              ) : (
                <Button
                  onClick={() => router.push('/auth/signin')}
                  // variant="ghost"
                  colorPalette="blue"
                  size="sm"
                  fontWeight="bold"
                >
                  {common('login')}
                </Button>
              )}
            </Box>
          </Flex>
        </Container>
      </Box>

      <SlideOutMenu
        isOpen={isMenuOpen}
        onClose={onMenuClose}
      />
    </>
  );
}
