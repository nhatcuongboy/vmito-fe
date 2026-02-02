'use client';

import { NextLinkButton } from '@/components/ui/NextLinkButton';
import { Box, Flex, IconButton, Text, Stack, Button } from '@chakra-ui/react';
import {
  Home,
  Info,
  X,
  LogIn,
  Receipt,
  CreditCard,
  LayoutDashboard,
  Calendar,
  Ticket,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Suspense } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import LanguageSwitcher from './LanguageSwitcher';
import { UserRole } from '@/lib/api/types';
import {
  TOP_BAR_HEIGHT_MOBILE,
  TOP_BAR_HEIGHT_DESKTOP,
  SIDEBAR_WIDTH_EXPANDED,
  SIDEBAR_WIDTH_COLLAPSED,
} from '@/constants';
import { useColorMode } from './color-mode-provider';
import { useSidebar } from '@/contexts/SidebarContext';
import { Tooltip } from './tooltip';

interface SlideOutMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SlideOutMenu({ isOpen, onClose }: SlideOutMenuProps) {
  const common = useTranslations('common');
  const nav = useTranslations('navigation');
  const { user, isAuthenticated, isLoading, isHydrated } = useAuthStore();
  const { colorMode, toggleColorMode } = useColorMode();
  const { isCollapsed, toggleCollapse } = useSidebar();

  return (
    <>
      {/* Overlay - Mobile only */}
      {isOpen && (
        <Box
          display={{ base: 'block', md: 'none' }}
          position="fixed"
          top={{
            base: `calc(${TOP_BAR_HEIGHT_MOBILE}px + env(safe-area-inset-top))`,
            md: `calc(${TOP_BAR_HEIGHT_DESKTOP}px + env(safe-area-inset-top))`,
          }}
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
        top={{
          base: `calc(${TOP_BAR_HEIGHT_MOBILE}px + env(safe-area-inset-top))`,
          md: `calc(${TOP_BAR_HEIGHT_DESKTOP}px + env(safe-area-inset-top))`,
        }}
        left={0}
        bottom={0}
        width={{
          base: '240px',
          md: isCollapsed
            ? `${SIDEBAR_WIDTH_COLLAPSED}px`
            : `${SIDEBAR_WIDTH_EXPANDED}px`,
        }}
        bg="bg"
        shadow="xl"
        zIndex={1600}
        transform={{
          base: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          md: 'translateX(0)',
        }}
        transition="width 0.3s ease, transform 0.3s ease"
        borderRight="1px solid"
        borderColor="border"
        overflowY="auto"
      >
        {/* Body */}
        <Box p={{ base: 4, md: isCollapsed ? 2 : 4 }}>
          <Stack gap={6}>
            {/* Main Navigation Section */}
            <Box>
              {!isCollapsed && (
                <Text
                  fontSize="sm"
                  fontWeight="semibold"
                  color="fg.muted"
                  mb={3}
                  display={{ base: 'block', md: 'block' }}
                >
                  Main
                </Text>
              )}
              <Stack gap={2}>
                <Tooltip
                  content={nav('home')}
                  positioning={{ placement: 'right' }}
                  disabled={!isCollapsed}
                  openDelay={200}
                >
                  <NextLinkButton
                    href="/"
                    variant="ghost"
                    justifyContent={{
                      base: 'flex-start',
                      md: isCollapsed ? 'center' : 'flex-start',
                    }}
                    onClick={onClose}
                    w="full"
                    px={{ base: 4, md: isCollapsed ? 0 : 4 }}
                  >
                    <Flex
                      align="center"
                      gap={3}
                      w="full"
                      justifyContent={{
                        base: 'flex-start',
                        md: isCollapsed ? 'center' : 'flex-start',
                      }}
                    >
                      <Home size={18} />
                      {!isCollapsed && (
                        <Text display={{ base: 'block', md: 'block' }}>
                          {nav('home')}
                        </Text>
                      )}
                    </Flex>
                  </NextLinkButton>
                </Tooltip>

                {isAuthenticated && user?.role !== UserRole.PLAYER && (
                  <Tooltip
                    content={nav('browse')}
                    positioning={{ placement: 'right' }}
                    disabled={!isCollapsed}
                    openDelay={200}
                  >
                    <NextLinkButton
                      href={
                        user?.role === UserRole.HOST ||
                        user?.role === UserRole.ADMIN
                          ? '/host/dashboard'
                          : '/'
                      }
                      variant="ghost"
                      justifyContent={{
                        base: 'flex-start',
                        md: isCollapsed ? 'center' : 'flex-start',
                      }}
                      onClick={onClose}
                      w="full"
                      px={{ base: 4, md: isCollapsed ? 0 : 4 }}
                    >
                      <Flex
                        align="center"
                        gap={3}
                        w="full"
                        justifyContent={{
                          base: 'flex-start',
                          md: isCollapsed ? 'center' : 'flex-start',
                        }}
                      >
                        <LayoutDashboard size={18} />
                        {!isCollapsed && (
                          <Text display={{ base: 'block', md: 'block' }}>
                            {nav('browse')}
                          </Text>
                        )}
                      </Flex>
                    </NextLinkButton>
                  </Tooltip>
                )}

                {isAuthenticated && (
                  <>
                    <Tooltip
                      content={nav('host')}
                      positioning={{ placement: 'right' }}
                      disabled={!isCollapsed}
                      openDelay={200}
                    >
                      <NextLinkButton
                        href={
                          user?.role === UserRole.HOST ||
                          user?.role === UserRole.ADMIN
                            ? '/host/sessions'
                            : '/player/host'
                        }
                        variant="ghost"
                        justifyContent={{
                          base: 'flex-start',
                          md: isCollapsed ? 'center' : 'flex-start',
                        }}
                        onClick={onClose}
                        w="full"
                        px={{ base: 4, md: isCollapsed ? 0 : 4 }}
                      >
                        <Flex
                          align="center"
                          gap={3}
                          w="full"
                          justifyContent={{
                            base: 'flex-start',
                            md: isCollapsed ? 'center' : 'flex-start',
                          }}
                        >
                          <Calendar size={18} />
                          {!isCollapsed && (
                            <Text display={{ base: 'block', md: 'block' }}>
                              {nav('host')}
                            </Text>
                          )}
                        </Flex>
                      </NextLinkButton>
                    </Tooltip>

                    <Tooltip
                      content={nav('joined')}
                      positioning={{ placement: 'right' }}
                      disabled={!isCollapsed}
                      openDelay={200}
                    >
                      <NextLinkButton
                        href="/player/sessions"
                        variant="ghost"
                        justifyContent={{
                          base: 'flex-start',
                          md: isCollapsed ? 'center' : 'flex-start',
                        }}
                        onClick={onClose}
                        w="full"
                        px={{ base: 4, md: isCollapsed ? 0 : 4 }}
                      >
                        <Flex
                          align="center"
                          gap={3}
                          w="full"
                          justifyContent={{
                            base: 'flex-start',
                            md: isCollapsed ? 'center' : 'flex-start',
                          }}
                        >
                          <Ticket size={18} />
                          {!isCollapsed && (
                            <Text display={{ base: 'block', md: 'block' }}>
                              {nav('joined')}
                            </Text>
                          )}
                        </Flex>
                      </NextLinkButton>
                    </Tooltip>

                    <Tooltip
                      content={nav('transactions')}
                      positioning={{ placement: 'right' }}
                      disabled={!isCollapsed}
                      openDelay={200}
                    >
                      <NextLinkButton
                        href={
                          user?.role === UserRole.HOST ||
                          user?.role === UserRole.ADMIN
                            ? '/host/transactions'
                            : '/player/transactions'
                        }
                        variant="ghost"
                        justifyContent={{
                          base: 'flex-start',
                          md: isCollapsed ? 'center' : 'flex-start',
                        }}
                        onClick={onClose}
                        w="full"
                        px={{ base: 4, md: isCollapsed ? 0 : 4 }}
                      >
                        <Flex
                          align="center"
                          gap={3}
                          w="full"
                          justifyContent={{
                            base: 'flex-start',
                            md: isCollapsed ? 'center' : 'flex-start',
                          }}
                        >
                          <Receipt size={18} />
                          {!isCollapsed && (
                            <Text display={{ base: 'block', md: 'block' }}>
                              {nav('transactions')}
                            </Text>
                          )}
                        </Flex>
                      </NextLinkButton>
                    </Tooltip>
                  </>
                )}

                {isAuthenticated &&
                  (user?.role === UserRole.HOST ||
                    user?.role === UserRole.ADMIN) && (
                    <Tooltip
                      content={nav('paymentSettings')}
                      positioning={{ placement: 'right' }}
                      disabled={!isCollapsed}
                      openDelay={200}
                    >
                      <NextLinkButton
                        href="/host/payment-settings"
                        variant="ghost"
                        justifyContent={{
                          base: 'flex-start',
                          md: isCollapsed ? 'center' : 'flex-start',
                        }}
                        onClick={onClose}
                        w="full"
                        px={{ base: 4, md: isCollapsed ? 0 : 4 }}
                      >
                        <Flex
                          align="center"
                          gap={3}
                          w="full"
                          justifyContent={{
                            base: 'flex-start',
                            md: isCollapsed ? 'center' : 'flex-start',
                          }}
                        >
                          <CreditCard size={18} />
                          {!isCollapsed && (
                            <Text display={{ base: 'block', md: 'block' }}>
                              {nav('paymentSettings')}
                            </Text>
                          )}
                        </Flex>
                      </NextLinkButton>
                    </Tooltip>
                  )}

                <Tooltip
                  content={common('about')}
                  positioning={{ placement: 'right' }}
                  disabled={!isCollapsed}
                  openDelay={200}
                >
                  <NextLinkButton
                    href="/about"
                    variant="ghost"
                    justifyContent={{
                      base: 'flex-start',
                      md: isCollapsed ? 'center' : 'flex-start',
                    }}
                    onClick={onClose}
                    w="full"
                    px={{ base: 4, md: isCollapsed ? 0 : 4 }}
                  >
                    <Flex
                      align="center"
                      gap={3}
                      w="full"
                      justifyContent={{
                        base: 'flex-start',
                        md: isCollapsed ? 'center' : 'flex-start',
                      }}
                    >
                      <Info size={18} />
                      {!isCollapsed && (
                        <Text display={{ base: 'block', md: 'block' }}>
                          {common('about')}
                        </Text>
                      )}
                    </Flex>
                  </NextLinkButton>
                </Tooltip>
              </Stack>
            </Box>

            {/* Language Switcher */}
            {!isCollapsed && (
              <Box display={{ base: 'block', md: 'block' }}>
                <Text
                  fontSize="sm"
                  fontWeight="semibold"
                  color="fg.muted"
                  mb={3}
                >
                  {common('language')}
                </Text>
                <Suspense fallback={<Text fontSize="sm">Loading...</Text>}>
                  <LanguageSwitcher keepDrawerOpen={false} />
                </Suspense>
              </Box>
            )}

            {/* Theme Toggle */}
            <Box>
              {!isCollapsed && (
                <Text
                  fontSize="sm"
                  fontWeight="semibold"
                  color="fg.muted"
                  mb={3}
                  display={{ base: 'block', md: 'block' }}
                >
                  {common('theme')}
                </Text>
              )}
              <Tooltip
                content={
                  colorMode === 'dark'
                    ? common('lightMode')
                    : common('darkMode')
                }
                positioning={{ placement: 'right' }}
                disabled={!isCollapsed}
                openDelay={200}
              >
                <Button
                  variant="ghost"
                  justifyContent={{
                    base: 'flex-start',
                    md: isCollapsed ? 'center' : 'flex-start',
                  }}
                  w="full"
                  onClick={toggleColorMode}
                  px={{ base: 4, md: isCollapsed ? 0 : 4 }}
                >
                  <Flex
                    align="center"
                    gap={3}
                    w="full"
                    justifyContent={{
                      base: 'flex-start',
                      md: isCollapsed ? 'center' : 'flex-start',
                    }}
                  >
                    {colorMode === 'dark' ? (
                      <Sun size={18} />
                    ) : (
                      <Moon size={18} />
                    )}
                    {!isCollapsed && (
                      <Text display={{ base: 'block', md: 'block' }}>
                        {colorMode === 'dark'
                          ? common('lightMode')
                          : common('darkMode')}
                      </Text>
                    )}
                  </Flex>
                </Button>
              </Tooltip>
            </Box>

            {/* Footer */}
            <Box pt={4}>
              {/* Login Button - Only show when NOT logged in and finished loading */}
              {isHydrated && !isLoading && !isAuthenticated && (
                <Box mb={4}>
                  <Tooltip
                    content="Login"
                    positioning={{ placement: 'right' }}
                    disabled={!isCollapsed}
                    openDelay={200}
                  >
                    <NextLinkButton
                      href="/auth/signin"
                      variant="outline"
                      colorPalette="blue"
                      w="full"
                      onClick={onClose}
                      justifyContent={{
                        base: 'flex-start',
                        md: isCollapsed ? 'center' : 'flex-start',
                      }}
                      px={{ base: 4, md: isCollapsed ? 0 : 4 }}
                    >
                      <Flex
                        align="center"
                        gap={2}
                        justifyContent={{
                          base: 'flex-start',
                          md: isCollapsed ? 'center' : 'flex-start',
                        }}
                      >
                        <LogIn size={16} />
                        {!isCollapsed && (
                          <Text display={{ base: 'block', md: 'block' }}>
                            Login
                          </Text>
                        )}
                      </Flex>
                    </NextLinkButton>
                  </Tooltip>
                </Box>
              )}

              {!isCollapsed && (
                <>
                  <Text
                    fontSize="xs"
                    color="gray.500"
                    textAlign="center"
                    display={{ base: 'block', md: 'block' }}
                  >
                    {common('appName')}
                  </Text>
                  <Text
                    fontSize="xs"
                    color="gray.400"
                    textAlign="center"
                    display={{ base: 'block', md: 'block' }}
                  >
                    © {new Date().getFullYear()}
                  </Text>
                </>
              )}
            </Box>
          </Stack>
        </Box>
      </Box>
    </>
  );
}
