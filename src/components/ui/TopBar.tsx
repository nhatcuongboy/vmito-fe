'use client';

import { NextLinkButton } from '@/components/ui/NextLinkButton';
import { Box, Container, Flex, Heading, IconButton } from '@chakra-ui/react';
import { ArrowLeft, Menu } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useLocale } from 'next-intl';
import SlideOutMenu from './SlideOutMenu';

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
  const { data: session } = useSession();
  const locale = useLocale();

  // Menu drawer state
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const onMenuOpen = () => setIsMenuOpen(true);
  const onMenuClose = () => setIsMenuOpen(false);

  const handleLogout = async () => {
    const userRole = session?.user?.role;
    const callbackUrl =
      userRole === 'HOST'
        ? `/${locale}/auth/signin`
        : `/${locale}/join-by-code`;
    await signOut({ callbackUrl });
    onMenuClose();
  };

  return (
    <>
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        zIndex={999}
        bg="rgba(255, 255, 255, 0.95)"
        backdropFilter="blur(10px)"
        borderBottom="1px solid"
        borderColor="gray.200"
        height="64px"
        minHeight="64px"
        _dark={{
          bg: 'rgba(26, 32, 44, 0.95)',
          borderColor: 'gray.600',
        }}
      >
        <Container maxW="container.xl" height="100%">
          <Flex justify="space-between" align="center" height="64px" py={0}>
            {/* Left side - Back button or spacer */}
            <Box minW="120px" height="100%" display="flex" alignItems="center">
              {showBackButton ? (
                <NextLinkButton
                  href={backHref}
                  variant="ghost"
                  size="sm"
                  color="gray.600"
                  _hover={{ color: 'blue.500' }}
                >
                  <ArrowLeft size={16} />
                  {common('back')}
                </NextLinkButton>
              ) : (
                <Box />
              )}
            </Box>

            {/* Center - App title */}
            <Heading
              size="lg"
              color="blue.600"
              fontWeight="bold"
              textAlign="center"
              _dark={{ color: 'blue.400' }}
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
            >
              <IconButton
                aria-label="Open menu"
                onClick={onMenuOpen}
                bg="white"
                _dark={{ bg: 'gray.800' }}
                shadow="md"
                borderRadius="full"
                size="md"
                variant="outline"
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
