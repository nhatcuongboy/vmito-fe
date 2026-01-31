'use client';

import { NextLinkButton } from '@/components/ui/NextLinkButton';
import { Box, Flex, IconButton, Text, Stack, Button } from '@chakra-ui/react';
import { Home, Info, X, LogIn, Search, Receipt, CreditCard, LayoutDashboard, Calendar, Ticket, Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Suspense } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import LanguageSwitcher from './LanguageSwitcher';
import { UserRole } from '@/lib/api/types';
import { TOP_BAR_HEIGHT_MOBILE, TOP_BAR_HEIGHT_DESKTOP } from '@/constants';
import { useColorMode } from './color-mode-provider';

interface SlideOutMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SlideOutMenu({
  isOpen,
  onClose,
}: SlideOutMenuProps) {
  const common = useTranslations('common');
  const nav = useTranslations('navigation');
  const { user, isAuthenticated, isLoading, isHydrated } = useAuthStore();
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="blackAlpha.600"
          zIndex={1500}
          onClick={onClose}
        />
      )}

      {/* Slide-out Menu */}
      <Box
        position="fixed"
        top={0}
        left={0}
        bottom={0}
        width="320px"
        bg="bg"
        shadow="xl"
        zIndex={1600}
        transform={isOpen ? 'translateX(0)' : 'translateX(-100%)'}
        transition="transform 0.3s ease"
        overflowY="auto"
      >
        {/* Header */}
        <Flex
          justify="space-between"
          align="center"
          px={4}
          paddingTop="env(safe-area-inset-top)"
          borderBottomWidth="1px"
          borderColor="border"
          height={{
            base: `calc(${TOP_BAR_HEIGHT_MOBILE}px + env(safe-area-inset-top))`,
            md: `calc(${TOP_BAR_HEIGHT_DESKTOP}px + env(safe-area-inset-top))`,
          }}
          minHeight={{ base: `${TOP_BAR_HEIGHT_MOBILE}px`, md: `${TOP_BAR_HEIGHT_DESKTOP}px` }}
        >
          <Text fontSize="xl" fontWeight="bold">
            Menu
          </Text>
          <IconButton
            aria-label="Close menu"
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X size={20} />
          </IconButton>
        </Flex>

        {/* Body */}
        <Box p={4}>
          <Stack gap={6}>
            {/* Settings Section */}
            <Box>
              <Text fontSize="sm" fontWeight="semibold" color="fg.muted" mb={3}>
                Main
              </Text>
              <Stack gap={2}>
                <NextLinkButton
                  href="/"
                  variant="ghost"
                  justifyContent="flex-start"
                  onClick={onClose}
                  w="full"
                >
                  <Flex align="center" gap={3} w="full">
                    <Home size={18} />
                    <Text>{nav('home')}</Text>
                  </Flex>
                </NextLinkButton>
                {isAuthenticated && user?.role !== UserRole.PLAYER && (
                  <NextLinkButton
                    href={
                      user?.role === UserRole.HOST ||
                        user?.role === UserRole.ADMIN
                        ? '/host/dashboard'
                        : '/'
                    }
                    variant="ghost"
                    justifyContent="flex-start"
                    onClick={onClose}
                    w="full"
                  >
                    <Flex align="center" gap={3} w="full">
                      <LayoutDashboard size={18} />
                      <Text>{nav('browse')}</Text>
                    </Flex>
                  </NextLinkButton>
                )}

                {isAuthenticated && (
                  <>
                    <NextLinkButton
                      href={
                        user?.role === UserRole.HOST || user?.role === UserRole.ADMIN
                          ? '/host/sessions'
                          : '/player/host'
                      }
                      variant="ghost"
                      justifyContent="flex-start"
                      onClick={onClose}
                      w="full"
                    >
                      <Flex align="center" gap={3} w="full">
                        <Calendar size={18} />
                        <Text>{nav('host')}</Text>
                      </Flex>
                    </NextLinkButton>

                    <NextLinkButton
                      href="/player/sessions"
                      variant="ghost"
                      justifyContent="flex-start"
                      onClick={onClose}
                      w="full"
                    >
                      <Flex align="center" gap={3} w="full">
                        <Ticket size={18} />
                        <Text>{nav('joined')}</Text>
                      </Flex>
                    </NextLinkButton>

                    <NextLinkButton
                      href={
                        user?.role === UserRole.HOST || user?.role === UserRole.ADMIN
                          ? '/host/transactions'
                          : '/player/transactions'
                      }
                      variant="ghost"
                      justifyContent="flex-start"
                      onClick={onClose}
                      w="full"
                    >
                      <Flex align="center" gap={3} w="full">
                        <Receipt size={18} />
                        <Text>{nav('transactions')}</Text>
                      </Flex>
                    </NextLinkButton>
                  </>
                )}
                {isAuthenticated && (user?.role === UserRole.HOST || user?.role === UserRole.ADMIN) && (
                  <NextLinkButton
                    href="/host/payment-settings"
                    variant="ghost"
                    justifyContent="flex-start"
                    onClick={onClose}
                    w="full"
                  >
                    <Flex align="center" gap={3} w="full">
                      <CreditCard size={18} />
                      <Text>{nav('paymentSettings')}</Text>
                    </Flex>
                  </NextLinkButton>
                )}
                {/* <NextLinkButton
                  href="/settings"
                  variant="ghost"
                  justifyContent="flex-start"
                  onClick={onClose}
                  w="full"
                >
                  <Flex align="center" gap={3} w="full">
                    <Settings size={18} />
                    <Text>{common('settings')}</Text>
                  </Flex>
                </NextLinkButton> */}
                <NextLinkButton
                  href="/about"
                  variant="ghost"
                  justifyContent="flex-start"
                  onClick={onClose}
                  w="full"
                >
                  <Flex align="center" gap={3} w="full">
                    <Info size={18} />
                    <Text>{common('about')}</Text>
                  </Flex>
                </NextLinkButton>
                {/* <NextLinkButton
                  href="/browse/tournaments"
                  variant="ghost"
                  justifyContent="flex-start"
                  onClick={onClose}
                  w="full"
                >
                  <Flex align="center" gap={3} w="full">
                    <Trophy size={18} />
                    <Text>{nav('tournaments')}</Text>
                  </Flex>
                </NextLinkButton> */}
              </Stack>
            </Box>

            {/* Language Switcher */}
            <Box>
              <Text fontSize="sm" fontWeight="semibold" color="fg.muted" mb={3}>
                {common('language')}
              </Text>
              <Suspense fallback={<Text fontSize="sm">Loading...</Text>}>
                <LanguageSwitcher keepDrawerOpen={false} />
              </Suspense>
            </Box>

            {/* Theme Toggle */}
            <Box>
              <Text fontSize="sm" fontWeight="semibold" color="fg.muted" mb={3}>
                {common('theme')}
              </Text>
              <Button
                variant="ghost"
                justifyContent="flex-start"
                w="full"
                onClick={toggleColorMode}
              >
                <Flex align="center" gap={3} w="full">
                  {colorMode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                  <Text>{colorMode === 'dark' ? common('lightMode') : common('darkMode')}</Text>
                </Flex>
              </Button>
            </Box>

            {/* Footer */}
            <Box pt={4}>
              {/* Login Button - Only show when NOT logged in and finished loading */}
              {isHydrated && !isLoading && !isAuthenticated && (
                <Box mb={4}>
                  <NextLinkButton
                    href="/auth/signin"
                    variant="outline"
                    colorPalette="blue"
                    w="full"
                    onClick={onClose}
                  >
                    <Flex align="center" gap={2}>
                      <LogIn size={16} />
                      <Text>Login</Text>
                    </Flex>
                  </NextLinkButton>
                </Box>
              )}

              <Text fontSize="xs" color="gray.500" textAlign="center">
                {common('appName')}
              </Text>
              <Text fontSize="xs" color="gray.400" textAlign="center">
                © {new Date().getFullYear()}
              </Text>
            </Box>
          </Stack>
        </Box>
      </Box>
    </>
  );
}
