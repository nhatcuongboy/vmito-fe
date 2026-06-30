'use client';

import { NextLinkButton } from '@/components/ui/NextLinkButton';
import {
  Box,
  Collapsible,
  Flex,
  Text,
  Stack,
  Separator,
  Button,
  useBreakpointValue,
} from '@chakra-ui/react';
import {
  ChevronDown,
  Search,
  Info,
  BookOpen,
  LogIn,
  Receipt,
  CreditCard,
  CalendarDays,
  ClipboardList,
  Ticket,
  Users,
  UserSearch,
  MapPin,
  UserPlus,
  Trophy,
  Swords,
  SlidersHorizontal,
  Bell,
  Award,
  MessageCircle,
  Newspaper,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Suspense, useEffect, useRef, useState } from 'react';
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
import { PopoverContent, PopoverRoot, PopoverTrigger } from './popover';

interface SlideOutMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SessionSubmenuItem {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
}

export default function SlideOutMenu({ isOpen, onClose }: SlideOutMenuProps) {
  const common = useTranslations('common');
  const nav = useTranslations('navigation');
  const { user, isAuthenticated, isLoading, isHydrated } = useAuthStore();
  const { canAccessHostFeatures } = useCanAccessHostFeatures();
  const { isCollapsed: isSidebarCollapsed } = useSidebar();
  const isCollapsed =
    useBreakpointValue({ base: false, md: isSidebarCollapsed }) ?? false;
  const pathname = usePathname();
  const normalizedPathname = pathname.replace(/\/$/, '') || '/';
  const manageSessionsHref = canAccessHostFeatures
    ? ROUTES.HOST.SESSIONS.LIST
    : ROUTES.PLAYER.HOST_FEATURE;
  const joinedSessionsHref = ROUTES.PLAYER.SESSIONS.LIST;
  const isSessionsParentActive = normalizedPathname.startsWith(
    ROUTES.HOST.SESSIONS.LIST
  );
  const isJoinedSessionsActive =
    normalizedPathname.startsWith(joinedSessionsHref);
  const isHostedSessionsActive =
    isSessionsParentActive && !isJoinedSessionsActive;
  const isSessionsMenuActive = isHostedSessionsActive || isJoinedSessionsActive;
  const [isSessionsMenuOpen, setIsSessionsMenuOpen] =
    useState(isSessionsMenuActive);
  const [isSessionsFlyoutOpen, setIsSessionsFlyoutOpen] = useState(false);
  const sessionsFlyoutCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  useEffect(() => {
    if (isSessionsMenuActive) {
      setIsSessionsMenuOpen(true);
    }
  }, [isSessionsMenuActive]);

  useEffect(() => {
    return () => {
      if (sessionsFlyoutCloseTimer.current) {
        clearTimeout(sessionsFlyoutCloseTimer.current);
      }
    };
  }, []);

  const openSessionsFlyout = () => {
    if (sessionsFlyoutCloseTimer.current) {
      clearTimeout(sessionsFlyoutCloseTimer.current);
    }
    setIsSessionsFlyoutOpen(true);
  };

  const closeSessionsFlyout = () => {
    if (sessionsFlyoutCloseTimer.current) {
      clearTimeout(sessionsFlyoutCloseTimer.current);
    }
    sessionsFlyoutCloseTimer.current = setTimeout(() => {
      setIsSessionsFlyoutOpen(false);
    }, 250);
  };

  const sessionSubmenuItems: SessionSubmenuItem[] = [
    {
      href: manageSessionsHref,
      label: nav('myHostedSessions'),
      icon: ClipboardList,
      isActive: isHostedSessionsActive,
    },
    {
      href: joinedSessionsHref,
      label: nav('joined'),
      icon: Ticket,
      isActive: isJoinedSessionsActive,
    },
  ];

  const getActiveProps = (href: string, isActiveOverride?: boolean) => {
    // Exact match for home, startsWith for others
    const isActive =
      isActiveOverride ??
      (href === '/' ? pathname === '/' : pathname.startsWith(href));

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

  const getSubmenuProps = (
    isActive: boolean,
    variant: 'inline' | 'flyout' = 'inline'
  ) => {
    if (!isActive) {
      return {
        position: 'relative',
        bg: 'transparent',
        borderColor: 'transparent',
        color: 'fg.muted',
        _hover: {
          bg: 'green.50/70',
          color: 'green.700',
        },
        _dark: {
          color: 'gray.400',
          _hover: {
            bg: 'green.950/20',
            color: 'green.200',
          },
        },
      };
    }

    return {
      position: 'relative',
      bg: 'green.50/80',
      borderColor: 'transparent',
      color: 'green.700',
      fontWeight: 'semibold',
      ...(variant === 'inline'
        ? {
            _before: {
              content: '""',
              position: 'absolute',
              left: '-21px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '8px',
              height: '8px',
              borderRadius: 'full',
              bg: 'green.500',
              boxShadow: '0 0 0 3px var(--chakra-colors-green-100)',
            },
          }
        : {}),
      _hover: {
        bg: 'green.50',
      },
      _dark: {
        bg: 'green.950/30',
        color: 'green.200',
        ...(variant === 'inline'
          ? {
              _before: {
                bg: 'green.300',
                boxShadow: '0 0 0 3px var(--chakra-colors-green-900)',
              },
            }
          : {}),
        _hover: {
          bg: 'green.900/40',
        },
      },
    };
  };

  const renderSessionSubmenuItem = (
    item: SessionSubmenuItem,
    variant: 'inline' | 'flyout' = 'inline'
  ) => {
    const Icon = item.icon;

    return (
      <NextLinkButton
        key={item.href}
        href={item.href}
        variant="ghost"
        justifyContent="flex-start"
        onClick={onClose}
        w="full"
        px={3}
        py={variant === 'flyout' ? 2 : 1.5}
        minH={variant === 'flyout' ? '38px' : '34px'}
        borderRadius="md"
        borderWidth={0}
        textAlign="left"
        {...getSubmenuProps(item.isActive, variant)}
      >
        <Flex align="center" gap={2.5} w="full">
          <Box
            display="inline-flex"
            alignItems="center"
            justifyContent="center"
            color={item.isActive ? 'green.500' : 'currentColor'}
            flexShrink={0}
          >
            <Icon size={variant === 'flyout' ? 16 : 15} />
          </Box>
          <Text fontSize={variant === 'flyout' ? 'sm' : 'xs'} flex={1}>
            {item.label}
          </Text>
        </Flex>
      </NextLinkButton>
    );
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
          md: isSidebarCollapsed
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
                  content={nav('browseVenues')}
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
                  content={nav('browseClubs')}
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
                <VTooltip
                  content="Tìm giải"
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
                          Tìm giải
                        </Text>
                      )}
                    </Flex>
                  </NextLinkButton>
                </VTooltip>
                {isAuthenticated && (
                  <VTooltip
                    content={nav('newsfeed')}
                    positioning={{
                      placement: 'right',
                      offset: { mainAxis: 12 },
                    }}
                    disabled={!isCollapsed}
                    showArrow
                    openDelay={200}
                  >
                    <NextLinkButton
                      href={ROUTES.NEWSFEED}
                      variant="ghost"
                      justifyContent={{
                        base: 'flex-start',
                        md: isCollapsed ? 'center' : 'flex-start',
                      }}
                      onClick={onClose}
                      w="full"
                      px={{ base: 4, md: isCollapsed ? 0 : 4 }}
                      {...getActiveProps(ROUTES.NEWSFEED)}
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
                        <Newspaper
                          size={18}
                          color={
                            pathname.startsWith(ROUTES.NEWSFEED)
                              ? 'var(--chakra-colors-green-500)'
                              : 'currentColor'
                          }
                        />
                        {!isCollapsed && (
                          <Text display={{ base: 'block', md: 'block' }}>
                            {nav('newsfeed')}
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
                    <Box
                      display={{
                        base: 'none',
                        md: isCollapsed ? 'block' : 'none',
                      }}
                      onPointerEnter={openSessionsFlyout}
                      onPointerLeave={closeSessionsFlyout}
                      onFocus={openSessionsFlyout}
                    >
                      <PopoverRoot
                        open={isSessionsFlyoutOpen}
                        positioning={{
                          placement: 'right-start',
                          offset: { mainAxis: 8, crossAxis: -4 },
                        }}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            w="full"
                            px={0}
                            minH="10"
                            borderRadius="lg"
                            aria-label={nav('sessions')}
                            {...getActiveProps(
                              manageSessionsHref,
                              isSessionsMenuActive
                            )}
                          >
                            <CalendarDays
                              size={18}
                              color={
                                isSessionsMenuActive
                                  ? 'var(--chakra-colors-green-500)'
                                  : 'currentColor'
                              }
                            />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          w="220px"
                          p={2}
                          borderRadius="lg"
                          boxShadow="xl"
                          zIndex={2001}
                          bg="bg"
                          _dark={{ bg: 'gray.900', borderColor: 'gray.700' }}
                          onPointerEnter={openSessionsFlyout}
                          onPointerLeave={closeSessionsFlyout}
                        >
                          <Text
                            px={2}
                            py={1}
                            fontSize="xs"
                            fontWeight="semibold"
                            color="fg.muted"
                          >
                            {nav('sessions')}
                          </Text>
                          <Stack gap={1} mt={1}>
                            {sessionSubmenuItems.map((item) =>
                              renderSessionSubmenuItem(item, 'flyout')
                            )}
                          </Stack>
                        </PopoverContent>
                      </PopoverRoot>
                    </Box>

                    <Box
                      display={{
                        base: 'block',
                        md: isCollapsed ? 'none' : 'block',
                      }}
                    >
                      <Collapsible.Root
                        open={isSessionsMenuOpen}
                        onOpenChange={(event) =>
                          setIsSessionsMenuOpen(event.open)
                        }
                      >
                        <Collapsible.Trigger asChild>
                          <Button
                            w="full"
                            px={4}
                            py={2}
                            minH="10"
                            borderRadius="md"
                            variant="ghost"
                            justifyContent="flex-start"
                            textAlign="left"
                            _hover={{
                              bg: 'gray.100',
                              _dark: { bg: 'whiteAlpha.100' },
                            }}
                            {...getActiveProps(
                              manageSessionsHref,
                              isSessionsMenuActive
                            )}
                          >
                            <Flex align="center" gap={3} w="full">
                              <CalendarDays
                                size={18}
                                color={
                                  isSessionsMenuActive
                                    ? 'var(--chakra-colors-green-500)'
                                    : 'currentColor'
                                }
                              />
                              <Text flex={1} fontWeight="inherit">
                                {nav('sessions')}
                              </Text>
                              <Box
                                display="inline-flex"
                                transition="transform 0.2s ease"
                                transform={
                                  isSessionsMenuOpen
                                    ? 'rotate(0deg)'
                                    : 'rotate(-90deg)'
                                }
                              >
                                <ChevronDown size={16} aria-hidden="true" />
                              </Box>
                            </Flex>
                          </Button>
                        </Collapsible.Trigger>

                        <Collapsible.Content>
                          <Box
                            mt={1.5}
                            ms={5}
                            ps={4}
                            py={1}
                            borderLeftWidth="2px"
                            borderLeftColor="green.200"
                            _dark={{
                              borderLeftColor: 'green.800',
                            }}
                          >
                            <Stack gap={1}>
                              {sessionSubmenuItems.map((item) =>
                                renderSessionSubmenuItem(item)
                              )}
                            </Stack>
                          </Box>
                        </Collapsible.Content>
                      </Collapsible.Root>
                    </Box>

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
                    {canAccessHostFeatures &&
                      (user?.role === UserRole.ADMIN ||
                        user?.role === UserRole.HOST) && (
                        <VTooltip
                          content={nav('tournaments')}
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
                          content={nav('feedback')}
                          positioning={{
                            placement: 'right',
                            offset: { mainAxis: 12 },
                          }}
                          disabled={!isCollapsed}
                          showArrow
                          openDelay={200}
                        >
                          <NextLinkButton
                            href={ROUTES.ADMIN.FEEDBACK}
                            variant="ghost"
                            justifyContent={{
                              base: 'flex-start',
                              md: isCollapsed ? 'center' : 'flex-start',
                            }}
                            onClick={onClose}
                            w="full"
                            px={{ base: 4, md: isCollapsed ? 0 : 4 }}
                            {...getActiveProps(ROUTES.ADMIN.FEEDBACK)}
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
                              <MessageCircle
                                size={18}
                                color={
                                  pathname.startsWith(ROUTES.ADMIN.FEEDBACK)
                                    ? 'var(--chakra-colors-green-500)'
                                    : 'currentColor'
                                }
                              />
                              {!isCollapsed && (
                                <Text display={{ base: 'block', md: 'block' }}>
                                  {nav('feedback')}
                                </Text>
                              )}
                            </Flex>
                          </NextLinkButton>
                        </VTooltip>

                        <VTooltip
                          content={nav('generalSettings')}
                          positioning={{
                            placement: 'right',
                            offset: { mainAxis: 12 },
                          }}
                          disabled={!isCollapsed}
                          showArrow
                          openDelay={200}
                        >
                          <NextLinkButton
                            href={ROUTES.ADMIN.GENERAL}
                            variant="ghost"
                            justifyContent={{
                              base: 'flex-start',
                              md: isCollapsed ? 'center' : 'flex-start',
                            }}
                            onClick={onClose}
                            w="full"
                            px={{ base: 4, md: isCollapsed ? 0 : 4 }}
                            {...getActiveProps(ROUTES.ADMIN.GENERAL)}
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
                              <SlidersHorizontal
                                size={18}
                                color={
                                  pathname.startsWith(ROUTES.ADMIN.GENERAL)
                                    ? 'var(--chakra-colors-green-500)'
                                    : 'currentColor'
                                }
                              />
                              {!isCollapsed && (
                                <Text display={{ base: 'block', md: 'block' }}>
                                  {nav('generalSettings')}
                                </Text>
                              )}
                            </Flex>
                          </NextLinkButton>
                        </VTooltip>

                        <VTooltip
                          content={nav('levelDescriptions')}
                          positioning={{
                            placement: 'right',
                            offset: { mainAxis: 12 },
                          }}
                          disabled={!isCollapsed}
                          showArrow
                          openDelay={200}
                        >
                          <NextLinkButton
                            href={ROUTES.ADMIN.LEVEL_DESCRIPTIONS}
                            variant="ghost"
                            justifyContent={{
                              base: 'flex-start',
                              md: isCollapsed ? 'center' : 'flex-start',
                            }}
                            onClick={onClose}
                            w="full"
                            px={{ base: 4, md: isCollapsed ? 0 : 4 }}
                            {...getActiveProps(ROUTES.ADMIN.LEVEL_DESCRIPTIONS)}
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
                              <Award
                                size={18}
                                color={
                                  pathname.startsWith(
                                    ROUTES.ADMIN.LEVEL_DESCRIPTIONS
                                  )
                                    ? 'var(--chakra-colors-green-500)'
                                    : 'currentColor'
                                }
                              />
                              {!isCollapsed && (
                                <Text display={{ base: 'block', md: 'block' }}>
                                  {nav('levelDescriptions')}
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

                <VTooltip
                  content={common('guide')}
                  positioning={{
                    placement: 'right',
                    offset: { mainAxis: 12 },
                  }}
                  disabled={!isCollapsed}
                  showArrow
                  openDelay={200}
                >
                  <NextLinkButton
                    href={ROUTES.GUIDE}
                    variant="ghost"
                    justifyContent={{
                      base: 'flex-start',
                      md: isCollapsed ? 'center' : 'flex-start',
                    }}
                    onClick={onClose}
                    w="full"
                    px={{ base: 4, md: isCollapsed ? 0 : 4 }}
                    {...getActiveProps(ROUTES.GUIDE)}
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
                      <BookOpen
                        size={18}
                        color={
                          pathname.startsWith(ROUTES.GUIDE)
                            ? 'var(--chakra-colors-green-500)'
                            : 'currentColor'
                        }
                      />
                      {!isCollapsed && (
                        <Text display={{ base: 'block', md: 'block' }}>
                          {common('guide')}
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
              {/* Login Button - Only show when NOT logged in and finished loading and NOT on signin page */}
              {isHydrated &&
                !isLoading &&
                !isAuthenticated &&
                !pathname.includes('/auth/signin') &&
                !pathname.includes('/auth/signup') && (
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
