'use client';

import { NextLinkButton } from '@/components/ui/NextLinkButton';
import { Box, Flex, Text, Stack, Separator } from '@chakra-ui/react';
import {
  Search,
  Info,
  LogIn,
  Receipt,
  CreditCard,
  BarChart3,
  ClipboardList,
  Ticket,
  Users,
  UserSearch,
  Bell,
  MapPin,
  UserPlus,
  Trophy,
  Swords,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Suspense } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import LanguageSwitcher from './LanguageSwitcher';
import { UserRole } from '@/lib/api/types';
import { useCanAccessHostFeatures } from '@/hooks/useCanAccessHostFeatures';
import {
  TOP_BAR_HEIGHT_MOBILE,
  TOP_BAR_HEIGHT_DESKTOP,
  SIDEBAR_WIDTH_EXPANDED,
  SIDEBAR_WIDTH_COLLAPSED,
} from '@/constants';
import { useSidebar } from '@/contexts/SidebarContext';
import { VTooltip } from './VTooltip';
import { ROUTES } from '@/constants';
import ThemeSwitcher from './ThemeSwitcher';
import { usePathname } from '@/i18n/config';

interface SlideOutMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SlideOutMenu({ isOpen, onClose }: SlideOutMenuProps) {
  const common = useTranslations('common');
  const nav = useTranslations('navigation');
  const { user, isAuthenticated, isLoading, isHydrated } = useAuthStore();
  const { canAccessHostFeatures } = useCanAccessHostFeatures();
  const { isCollapsed } = useSidebar();
  const pathname = usePathname();

  const getActiveProps = (href: string) => {
    // Exact match for home, startsWith for others
    const isActive =
      href === '/' ? pathname === '/' : pathname.startsWith(href);

    if (!isActive) {
      return {
        color: 'fg',
      };
    }

    return {
      bg: 'green.50',
      _dark: { bg: 'green.950/20' },
      color: 'green.600',
      fontWeight: 'semibold',
      borderLeft: !isCollapsed ? '4px solid' : 'none',
      borderLeftColor: 'green.500',
      borderRadius: isCollapsed ? 'lg' : '0',
      ps: !isCollapsed ? '12px' : isCollapsed ? 0 : 4, // Adjust padding for border
      _hover: {
        bg: 'green.100',
        _dark: { bg: 'green.900/40' },
      },
    };
  };

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
          zIndex={1200}
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
        zIndex={1250}
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
        <Box
          p={{ base: 4, md: isCollapsed ? 2 : 4 }}
          pb={{
            base: 'calc(1rem + env(safe-area-inset-bottom))',
            md: isCollapsed ? 2 : 4,
          }}
        >
          <Stack gap={3}>
            {/* Discovery Section */}
            <Box>
              {!isCollapsed && (
                <Text
                  fontSize="sm"
                  fontWeight="semibold"
                  color="fg.muted"
                  mb={3}
                  display={{ base: 'block', md: 'block' }}
                >
                  {common('discovery')}
                </Text>
              )}
              <Stack gap={2}>
                <VTooltip
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
                    {...getActiveProps(ROUTES.HOME)}
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
                      <Search
                        size={18}
                        color={
                          pathname === ROUTES.HOME
                            ? 'var(--chakra-colors-green-500)'
                            : 'currentColor'
                        }
                      />
                      {!isCollapsed && (
                        <Text display={{ base: 'block', md: 'block' }}>
                          {nav('home')}
                        </Text>
                      )}
                    </Flex>
                  </NextLinkButton>
                </VTooltip>
                <VTooltip
                  content={nav('venues') || 'Tìm sân'}
                  positioning={{
                    placement: 'right',
                    offset: { mainAxis: 12 },
                  }}
                  disabled={!isCollapsed}
                  showArrow
                  openDelay={200}
                >
                  <NextLinkButton
                    href={ROUTES.BROWSE.VENUES.LIST}
                    variant="ghost"
                    justifyContent={{
                      base: 'flex-start',
                      md: isCollapsed ? 'center' : 'flex-start',
                    }}
                    onClick={onClose}
                    w="full"
                    px={{ base: 4, md: isCollapsed ? 0 : 4 }}
                    {...getActiveProps(ROUTES.BROWSE.VENUES.LIST)}
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
                      <MapPin
                        size={18}
                        color={
                          pathname.startsWith(ROUTES.BROWSE.VENUES.LIST)
                            ? 'var(--chakra-colors-green-500)'
                            : 'currentColor'
                        }
                      />
                      {!isCollapsed && (
                        <Text display={{ base: 'block', md: 'block' }}>
                          {nav('browseVenues')}
                        </Text>
                      )}
                    </Flex>
                  </NextLinkButton>
                </VTooltip>
                <VTooltip
                  content={nav('browseClubs') || 'Tra cứu nhóm'}
                  positioning={{
                    placement: 'right',
                    offset: { mainAxis: 12 },
                  }}
                  disabled={!isCollapsed}
                  showArrow
                  openDelay={200}
                >
                  <NextLinkButton
                    href={ROUTES.CLUBS.BROWSE}
                    variant="ghost"
                    justifyContent={{
                      base: 'flex-start',
                      md: isCollapsed ? 'center' : 'flex-start',
                    }}
                    onClick={onClose}
                    w="full"
                    px={{ base: 4, md: isCollapsed ? 0 : 4 }}
                    {...getActiveProps(ROUTES.CLUBS.BROWSE)}
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
                      <UserSearch
                        size={18}
                        color={
                          pathname.startsWith(ROUTES.CLUBS.BROWSE)
                            ? 'var(--chakra-colors-green-500)'
                            : 'currentColor'
                        }
                      />
                      {!isCollapsed && (
                        <Text display={{ base: 'block', md: 'block' }}>
                          {nav('browseClubs')}
                        </Text>
                      )}
                    </Flex>
                  </NextLinkButton>
                </VTooltip>
                {(user?.role === UserRole.ADMIN ||
                  user?.role === UserRole.HOST) && (
                  <VTooltip
                    content={nav('browseTournaments') || 'Giải đấu'}
                    positioning={{
                      placement: 'right',
                      offset: { mainAxis: 12 },
                    }}
                    disabled={!isCollapsed}
                    showArrow
                    openDelay={200}
                  >
                    <NextLinkButton
                      href={ROUTES.BROWSE.TOURNAMENTS.LIST}
                      variant="ghost"
                      justifyContent={{
                        base: 'flex-start',
                        md: isCollapsed ? 'center' : 'flex-start',
                      }}
                      onClick={onClose}
                      w="full"
                      px={{ base: 4, md: isCollapsed ? 0 : 4 }}
                      {...getActiveProps(ROUTES.BROWSE.TOURNAMENTS.LIST)}
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
                        <Trophy
                          size={18}
                          color={
                            pathname.startsWith(ROUTES.BROWSE.TOURNAMENTS.LIST)
                              ? 'var(--chakra-colors-green-500)'
                              : 'currentColor'
                          }
                        />
                        {!isCollapsed && (
                          <Text display={{ base: 'block', md: 'block' }}>
                            {nav('browseTournaments')}
                          </Text>
                        )}
                      </Flex>
                    </NextLinkButton>
                  </VTooltip>
                )}
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
                    <VTooltip
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
                          canAccessHostFeatures
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
                        {...getActiveProps(
                          canAccessHostFeatures
                            ? ROUTES.HOST.SESSIONS.LIST
                            : ROUTES.PLAYER.HOST_FEATURE
                        )}
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
                          <ClipboardList
                            size={18}
                            color={
                              pathname.startsWith(ROUTES.HOST.SESSIONS.LIST) ||
                              pathname === ROUTES.PLAYER.HOST_FEATURE
                                ? 'var(--chakra-colors-green-500)'
                                : 'currentColor'
                            }
                          />
                          {!isCollapsed && (
                            <Text display={{ base: 'block', md: 'block' }}>
                              {nav('host')}
                            </Text>
                          )}
                        </Flex>
                      </NextLinkButton>
                    </VTooltip>

                    <VTooltip
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
                        {...getActiveProps(ROUTES.PLAYER.SESSIONS.LIST)}
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
                          <Ticket
                            size={18}
                            color={
                              pathname.startsWith(ROUTES.PLAYER.SESSIONS.LIST)
                                ? 'var(--chakra-colors-green-500)'
                                : 'currentColor'
                            }
                          />
                          {!isCollapsed && (
                            <Text display={{ base: 'block', md: 'block' }}>
                              {nav('joined')}
                            </Text>
                          )}
                        </Flex>
                      </NextLinkButton>
                    </VTooltip>

                    {/* Redundant 'My Clubs' removed from here and moved to Management section */}
                  </Stack>
                </Box>

                {/* Separator */}
                <Separator />
              </>
            )}

            {/* Management Section */}
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
                      {common('admin')}
                    </Text>
                  )}
                  <Stack gap={2}>
                    {canAccessHostFeatures &&
                      (user?.role === UserRole.ADMIN ||
                        user?.role === UserRole.HOST) && (
                        <VTooltip
                          content={nav('tournaments') || 'Giải đấu'}
                          positioning={{
                            placement: 'right',
                            offset: { mainAxis: 12 },
                          }}
                          disabled={!isCollapsed}
                          showArrow
                          openDelay={200}
                        >
                          <NextLinkButton
                            href={ROUTES.HOST.TOURNAMENTS.LIST}
                            variant="ghost"
                            justifyContent={{
                              base: 'flex-start',
                              md: isCollapsed ? 'center' : 'flex-start',
                            }}
                            onClick={onClose}
                            w="full"
                            px={{ base: 4, md: isCollapsed ? 0 : 4 }}
                            {...getActiveProps(ROUTES.HOST.TOURNAMENTS.LIST)}
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
                              <Swords
                                size={18}
                                color={
                                  pathname.startsWith(
                                    ROUTES.HOST.TOURNAMENTS.LIST
                                  )
                                    ? 'var(--chakra-colors-green-500)'
                                    : 'currentColor'
                                }
                              />
                              {!isCollapsed && (
                                <Text display={{ base: 'block', md: 'block' }}>
                                  {nav('tournaments')}
                                </Text>
                              )}
                            </Flex>
                          </NextLinkButton>
                        </VTooltip>
                      )}
                    <VTooltip
                      content={nav('myClubs')}
                      positioning={{
                        placement: 'right',
                        offset: { mainAxis: 12 },
                      }}
                      disabled={!isCollapsed}
                      showArrow
                      openDelay={200}
                    >
                      <NextLinkButton
                        href={ROUTES.CLUBS.MY_CLUBS}
                        variant="ghost"
                        justifyContent={{
                          base: 'flex-start',
                          md: isCollapsed ? 'center' : 'flex-start',
                        }}
                        onClick={onClose}
                        w="full"
                        px={{ base: 4, md: isCollapsed ? 0 : 4 }}
                        {...getActiveProps(ROUTES.CLUBS.MY_CLUBS)}
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
                          <Users
                            size={18}
                            color={
                              pathname.startsWith(ROUTES.CLUBS.MY_CLUBS)
                                ? 'var(--chakra-colors-green-500)'
                                : 'currentColor'
                            }
                          />
                          {!isCollapsed && (
                            <Text display={{ base: 'block', md: 'block' }}>
                              {nav('myClubs')}
                            </Text>
                          )}
                        </Flex>
                      </NextLinkButton>
                    </VTooltip>
                    <VTooltip
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
                          canAccessHostFeatures
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
                        {...getActiveProps(
                          canAccessHostFeatures
                            ? ROUTES.HOST.TRANSACTIONS
                            : ROUTES.PLAYER.TRANSACTIONS
                        )}
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
                          <Receipt
                            size={18}
                            color={
                              pathname.startsWith(ROUTES.HOST.TRANSACTIONS) ||
                              pathname.startsWith(ROUTES.PLAYER.TRANSACTIONS)
                                ? 'var(--chakra-colors-green-500)'
                                : 'currentColor'
                            }
                          />
                          {!isCollapsed && (
                            <Text display={{ base: 'block', md: 'block' }}>
                              {nav('transactions')}
                            </Text>
                          )}
                        </Flex>
                      </NextLinkButton>
                    </VTooltip>

                    {canAccessHostFeatures && (
                      <VTooltip
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
                          {...getActiveProps(ROUTES.HOST.PAYMENT_SETTINGS)}
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
                            <CreditCard
                              size={18}
                              color={
                                pathname.startsWith(
                                  ROUTES.HOST.PAYMENT_SETTINGS
                                )
                                  ? 'var(--chakra-colors-green-500)'
                                  : 'currentColor'
                              }
                            />
                            {!isCollapsed && (
                              <Text display={{ base: 'block', md: 'block' }}>
                                {nav('paymentSettings')}
                              </Text>
                            )}
                          </Flex>
                        </NextLinkButton>
                      </VTooltip>
                    )}

                    {user?.role === UserRole.ADMIN && (
                      <>
                        <VTooltip
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
                            {...getActiveProps(ROUTES.ADMIN.USERS)}
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
                              <Users
                                size={18}
                                color={
                                  pathname.startsWith(ROUTES.ADMIN.USERS)
                                    ? 'var(--chakra-colors-green-500)'
                                    : 'currentColor'
                                }
                              />
                              {!isCollapsed && (
                                <Text display={{ base: 'block', md: 'block' }}>
                                  {nav('users')}
                                </Text>
                              )}
                            </Flex>
                          </NextLinkButton>
                        </VTooltip>

                        <VTooltip
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
                            {...getActiveProps(ROUTES.ADMIN.NOTIFICATIONS)}
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
                              <Bell
                                size={18}
                                color={
                                  pathname.startsWith(
                                    ROUTES.ADMIN.NOTIFICATIONS
                                  )
                                    ? 'var(--chakra-colors-green-500)'
                                    : 'currentColor'
                                }
                              />
                              {!isCollapsed && (
                                <Text display={{ base: 'block', md: 'block' }}>
                                  {nav('notifications')}
                                </Text>
                              )}
                            </Flex>
                          </NextLinkButton>
                        </VTooltip>

                        <VTooltip
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
                            {...getActiveProps(ROUTES.ADMIN.VENUES)}
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
                              <MapPin
                                size={18}
                                color={
                                  pathname.startsWith(ROUTES.ADMIN.VENUES)
                                    ? 'var(--chakra-colors-green-500)'
                                    : 'currentColor'
                                }
                              />
                              {!isCollapsed && (
                                <Text display={{ base: 'block', md: 'block' }}>
                                  {nav('venues')}
                                </Text>
                              )}
                            </Flex>
                          </NextLinkButton>
                        </VTooltip>

                        <VTooltip
                          content={nav('clubsAdmin') || 'Duyệt nhóm'}
                          positioning={{
                            placement: 'right',
                            offset: { mainAxis: 12 },
                          }}
                          disabled={!isCollapsed}
                          showArrow
                          openDelay={200}
                        >
                          <NextLinkButton
                            href={ROUTES.ADMIN.CLUBS}
                            variant="ghost"
                            justifyContent={{
                              base: 'flex-start',
                              md: isCollapsed ? 'center' : 'flex-start',
                            }}
                            onClick={onClose}
                            w="full"
                            px={{ base: 4, md: isCollapsed ? 0 : 4 }}
                            {...getActiveProps(ROUTES.ADMIN.CLUBS)}
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
                              <Users
                                size={18}
                                color={
                                  pathname.startsWith(ROUTES.ADMIN.CLUBS)
                                    ? 'var(--chakra-colors-green-500)'
                                    : 'currentColor'
                                }
                              />
                              {!isCollapsed && (
                                <Text display={{ base: 'block', md: 'block' }}>
                                  {nav('clubsAdmin') || 'Duyệt nhóm'}
                                </Text>
                              )}
                            </Flex>
                          </NextLinkButton>
                        </VTooltip>
                      </>
                    )}
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
                <VTooltip
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
                    {...getActiveProps(ROUTES.ABOUT)}
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
                      <Info
                        size={18}
                        color={
                          pathname.startsWith(ROUTES.ABOUT)
                            ? 'var(--chakra-colors-green-500)'
                            : 'currentColor'
                        }
                      />
                      {!isCollapsed && (
                        <Text display={{ base: 'block', md: 'block' }}>
                          {common('about')}
                        </Text>
                      )}
                    </Flex>
                  </NextLinkButton>
                </VTooltip>
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
                  <VTooltip
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
                  </VTooltip>
                ) : (
                  <Box w="180px">
                    <LanguageSwitcher
                      keepDrawerOpen={false}
                      isCollapsed={false}
                    />
                  </Box>
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
                  <VTooltip
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
                  </VTooltip>
                ) : (
                  <Box w="180px">
                    <ThemeSwitcher isCollapsed={false} />
                  </Box>
                )}
              </Suspense>
            </Box>

            {/* Footer */}
            <Box pt={4}>
              {/* Login Button - Only show when NOT logged in and finished loading */}
              {isHydrated && !isLoading && !isAuthenticated && (
                <Stack gap={2} mb={4}>
                  <VTooltip
                    content={common('login')}
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
                      // variant="outline"
                      colorPalette="green"
                      w={isCollapsed ? 'full' : '180px'}
                      onClick={onClose}
                      justifyContent="center"
                      px={{ base: 4, md: isCollapsed ? 0 : 4 }}
                    >
                      <Flex align="center" gap={2} justifyContent="center">
                        <LogIn size={16} />
                        {!isCollapsed && (
                          <Text display={{ base: 'block', md: 'block' }}>
                            {common('login')}
                          </Text>
                        )}
                      </Flex>
                    </NextLinkButton>
                  </VTooltip>

                  <VTooltip
                    content={common('register')}
                    positioning={{
                      placement: 'right',
                      offset: { mainAxis: 12 },
                    }}
                    disabled={!isCollapsed}
                    showArrow
                    openDelay={200}
                  >
                    <NextLinkButton
                      href={ROUTES.AUTH.SIGNUP}
                      variant="outline"
                      colorPalette="green"
                      w={isCollapsed ? 'full' : '180px'}
                      onClick={onClose}
                      justifyContent="center"
                      px={{ base: 4, md: isCollapsed ? 0 : 4 }}
                    >
                      <Flex align="center" gap={2} justifyContent="center">
                        <UserPlus size={16} />
                        {!isCollapsed && (
                          <Text display={{ base: 'block', md: 'block' }}>
                            {common('register')}
                          </Text>
                        )}
                      </Flex>
                    </NextLinkButton>
                  </VTooltip>
                </Stack>
              )}

              {!isCollapsed && (
                <>
                  <Text
                    fontSize="xs"
                    color="gray.500"
                    textAlign="center"
                    display={{ base: 'block', md: 'block' }}
                  >
                    {`© ${new Date().getFullYear()} ${common('appName')}. All Rights Reserved!`}
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
