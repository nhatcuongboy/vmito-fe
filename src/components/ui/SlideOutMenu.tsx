'use client';

import { NextLinkButton } from '@/components/ui/NextLinkButton';
import { Box, Flex, Text, Stack, Separator } from '@chakra-ui/react';
import {
  Home,
  Info,
  LogIn,
  Receipt,
  CreditCard,
  BarChart3,
  Calendar,
  Ticket,
  Users,
  Bell,
  MapPin,
  Monitor,
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
import { ROUTES } from '@/constants';
import ThemeSwitcher from './ThemeSwitcher';

interface SlideOutMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SlideOutMenu({ isOpen, onClose }: SlideOutMenuProps) {
  const common = useTranslations('common');
  const nav = useTranslations('navigation');
  const { user, isAuthenticated, isLoading, isHydrated } = useAuthStore();
  const { isCollapsed } = useSidebar();

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
          <Stack gap={3}>
            {/* Home - Standalone (No Group) */}
            <Box>
              <Stack gap={2}>
                <Tooltip
                  content={nav('home')}
                  positioning={{
                    placement: 'right',
                    offset: { mainAxis: 12 },
                  }}
                  disabled={!isCollapsed}
                  showArrow
                  openDelay={200}
                >
                  <NextLinkButton
                    href={ROUTES.HOME}
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
              </Stack>
            </Box>

            {/* Separator */}
            <Separator />

            {/* Sessions Section */}
            {isAuthenticated && (
              <>
                <Box>
                  {!isCollapsed && (
                    <Text
                      fontSize="sm"
                      fontWeight="semibold"
                      color="fg.muted"
                      mb={3}
                      display={{ base: 'block', md: 'block' }}
                    >
                      {common('sessions')}
                    </Text>
                  )}
                  <Stack gap={2}>
                    <Tooltip
                      content={nav('host')}
                      positioning={{
                        placement: 'right',
                        offset: { mainAxis: 12 },
                      }}
                      disabled={!isCollapsed}
                      showArrow
                      openDelay={200}
                    >
                      <NextLinkButton
                        href={
                          user?.role === UserRole.HOST ||
                          user?.role === UserRole.ADMIN
                            ? ROUTES.HOST.SESSIONS.LIST
                            : ROUTES.PLAYER.HOST_FEATURE
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
                      positioning={{
                        placement: 'right',
                        offset: { mainAxis: 12 },
                      }}
                      disabled={!isCollapsed}
                      showArrow
                      openDelay={200}
                    >
                      <NextLinkButton
                        href={ROUTES.PLAYER.SESSIONS.LIST}
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
                  </Stack>
                </Box>

                {/* Separator */}
                <Separator />
              </>
            )}

            {/* Finance Section */}
            {isAuthenticated && (
              <>
                <Box>
                  {!isCollapsed && (
                    <Text
                      fontSize="sm"
                      fontWeight="semibold"
                      color="fg.muted"
                      mb={3}
                      display={{ base: 'block', md: 'block' }}
                    >
                      {common('finance')}
                    </Text>
                  )}
                  <Stack gap={2}>
                    <Tooltip
                      content={nav('transactions')}
                      positioning={{
                        placement: 'right',
                        offset: { mainAxis: 12 },
                      }}
                      disabled={!isCollapsed}
                      showArrow
                      openDelay={200}
                    >
                      <NextLinkButton
                        href={
                          user?.role === UserRole.HOST ||
                          user?.role === UserRole.ADMIN
                            ? ROUTES.HOST.TRANSACTIONS
                            : ROUTES.PLAYER.TRANSACTIONS
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

                    {(user?.role === UserRole.HOST ||
                      user?.role === UserRole.ADMIN) && (
                      <Tooltip
                        content={nav('paymentSettings')}
                        positioning={{
                          placement: 'right',
                          offset: { mainAxis: 12 },
                        }}
                        disabled={!isCollapsed}
                        showArrow
                        openDelay={200}
                      >
                        <NextLinkButton
                          href={ROUTES.HOST.PAYMENT_SETTINGS}
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
                  </Stack>
                </Box>

                {/* Separator */}
                <Separator />
              </>
            )}

            {/* Admin Section */}
            {isAuthenticated && user?.role === UserRole.ADMIN && (
              <>
                <Box>
                  {!isCollapsed && (
                    <Text
                      fontSize="sm"
                      fontWeight="semibold"
                      color="fg.muted"
                      mb={3}
                      display={{ base: 'block', md: 'block' }}
                    >
                      {common('admin')}
                    </Text>
                  )}
                  <Stack gap={2}>
                    <Tooltip
                      content={nav('users')}
                      positioning={{
                        placement: 'right',
                        offset: { mainAxis: 12 },
                      }}
                      disabled={!isCollapsed}
                      showArrow
                      openDelay={200}
                    >
                      <NextLinkButton
                        href={ROUTES.ADMIN.USERS}
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
                          <Users size={18} />
                          {!isCollapsed && (
                            <Text display={{ base: 'block', md: 'block' }}>
                              {nav('users')}
                            </Text>
                          )}
                        </Flex>
                      </NextLinkButton>
                    </Tooltip>

                    <Tooltip
                      content={nav('notifications')}
                      positioning={{
                        placement: 'right',
                        offset: { mainAxis: 12 },
                      }}
                      disabled={!isCollapsed}
                      showArrow
                      openDelay={200}
                    >
                      <NextLinkButton
                        href={ROUTES.ADMIN.NOTIFICATIONS}
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
                          <Bell size={18} />
                          {!isCollapsed && (
                            <Text display={{ base: 'block', md: 'block' }}>
                              {nav('notifications')}
                            </Text>
                          )}
                        </Flex>
                      </NextLinkButton>
                    </Tooltip>

                    <Tooltip
                      content={nav('venues')}
                      positioning={{
                        placement: 'right',
                        offset: { mainAxis: 12 },
                      }}
                      disabled={!isCollapsed}
                      showArrow
                      openDelay={200}
                    >
                      <NextLinkButton
                        href={ROUTES.ADMIN.VENUES}
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
                          <MapPin size={18} />
                          {!isCollapsed && (
                            <Text display={{ base: 'block', md: 'block' }}>
                              {nav('venues')}
                            </Text>
                          )}
                        </Flex>
                      </NextLinkButton>
                    </Tooltip>
                  </Stack>
                </Box>

                {/* Separator */}
                <Separator />
              </>
            )}

            {/* Other Section */}
            <Box>
              {!isCollapsed && (
                <Text
                  fontSize="sm"
                  fontWeight="semibold"
                  color="fg.muted"
                  mb={3}
                  display={{ base: 'block', md: 'block' }}
                >
                  {common('otherSection')}
                </Text>
              )}
              <Stack gap={2}>
                {/* Analysis - Moved to Other section */}
                {isAuthenticated && user?.role !== UserRole.PLAYER && (
                  <Tooltip
                    content={nav('browse')}
                    positioning={{
                      placement: 'right',
                      offset: { mainAxis: 12 },
                    }}
                    disabled={!isCollapsed}
                    showArrow
                    openDelay={200}
                  >
                    <NextLinkButton
                      href={
                        user?.role === UserRole.HOST ||
                        user?.role === UserRole.ADMIN
                          ? ROUTES.HOST.DASHBOARD
                          : ROUTES.HOME
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
                        <BarChart3 size={18} />
                        {!isCollapsed && (
                          <Text display={{ base: 'block', md: 'block' }}>
                            {nav('browse')}
                          </Text>
                        )}
                      </Flex>
                    </NextLinkButton>
                  </Tooltip>
                )}

                <Tooltip
                  content={common('about')}
                  positioning={{
                    placement: 'right',
                    offset: { mainAxis: 12 },
                  }}
                  disabled={!isCollapsed}
                  showArrow
                  openDelay={200}
                >
                  <NextLinkButton
                    href={ROUTES.ABOUT}
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

            {/* Separator */}
            <Separator />

            {/* Language Switcher */}
            <Box>
              {!isCollapsed && (
                <Text
                  fontSize="sm"
                  fontWeight="semibold"
                  color="fg.muted"
                  mb={3}
                  display={{ base: 'block', md: 'block' }}
                >
                  {common('language')}
                </Text>
              )}
              <Suspense fallback={<Text fontSize="sm">Loading...</Text>}>
                {isCollapsed ? (
                  <Tooltip
                    content={common('language')}
                    positioning={{
                      placement: 'right',
                      offset: { mainAxis: 12 },
                    }}
                    showArrow
                    openDelay={200}
                  >
                    <Box w="full" px={1}>
                      <LanguageSwitcher
                        keepDrawerOpen={false}
                        isCollapsed={true}
                      />
                    </Box>
                  </Tooltip>
                ) : (
                  <LanguageSwitcher
                    keepDrawerOpen={false}
                    isCollapsed={false}
                  />
                )}
              </Suspense>
            </Box>

            {/* Theme Switcher */}
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
              <Suspense fallback={<Text fontSize="sm">Loading...</Text>}>
                {isCollapsed ? (
                  <Tooltip
                    content={common('theme')}
                    positioning={{
                      placement: 'right',
                      offset: { mainAxis: 12 },
                    }}
                    showArrow
                    openDelay={200}
                  >
                    <Box w="full" px={1}>
                      <ThemeSwitcher isCollapsed={true} />
                    </Box>
                  </Tooltip>
                ) : (
                  <ThemeSwitcher isCollapsed={false} />
                )}
              </Suspense>
            </Box>

            {/* Footer */}
            <Box pt={4}>
              {/* Login Button - Only show when NOT logged in and finished loading */}
              {isHydrated && !isLoading && !isAuthenticated && (
                <Box mb={4}>
                  <Tooltip
                    content="Login"
                    positioning={{
                      placement: 'right',
                      offset: { mainAxis: 12 },
                    }}
                    disabled={!isCollapsed}
                    showArrow
                    openDelay={200}
                  >
                    <NextLinkButton
                      href={ROUTES.AUTH.SIGNIN}
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
                    {`© ${new Date().getFullYear()} ${common('appName')}. All Rights Reserved`}
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
