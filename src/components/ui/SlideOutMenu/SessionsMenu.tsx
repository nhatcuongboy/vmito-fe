'use client';

import { Box, Button, Collapsible, Flex, Stack, Text } from '@chakra-ui/react';
import {
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Ticket,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { NextLinkButton } from '@/components/ui/NextLinkButton';
import {
  PopoverContent,
  PopoverRoot,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ROUTES } from '@/constants';
import { useCanAccessHostFeatures } from '@/hooks/useCanAccessHostFeatures';
import { usePathname } from '@/i18n/config';
import {
  ACTIVE_ICON_COLOR,
  getActiveProps,
  getSubmenuProps,
} from './nav-styles';
import type { NavItemComponentProps } from './nav-config';

const FLYOUT_CLOSE_DELAY_MS = 250;

interface SessionSubmenuItem {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
}

function SessionSubmenuLink({
  item,
  variant = 'inline',
  onClose,
}: {
  item: SessionSubmenuItem;
  variant?: 'inline' | 'flyout';
  onClose: () => void;
}) {
  const Icon = item.icon;

  return (
    <NextLinkButton
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
}

export default function SessionsMenu({
  isCollapsed,
  onClose,
}: NavItemComponentProps) {
  const nav = useTranslations('navigation');
  const { canAccessHostFeatures } = useCanAccessHostFeatures();
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
  const isMenuActive = isHostedSessionsActive || isJoinedSessionsActive;

  const [isMenuOpen, setIsMenuOpen] = useState(isMenuActive);
  const [isFlyoutOpen, setIsFlyoutOpen] = useState(false);
  const flyoutCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isMenuActive) {
      setIsMenuOpen(true);
    }
  }, [isMenuActive]);

  useEffect(() => {
    return () => {
      if (flyoutCloseTimer.current) {
        clearTimeout(flyoutCloseTimer.current);
      }
    };
  }, []);

  const openFlyout = () => {
    if (flyoutCloseTimer.current) {
      clearTimeout(flyoutCloseTimer.current);
    }
    setIsFlyoutOpen(true);
  };

  const closeFlyout = () => {
    if (flyoutCloseTimer.current) {
      clearTimeout(flyoutCloseTimer.current);
    }
    flyoutCloseTimer.current = setTimeout(() => {
      setIsFlyoutOpen(false);
    }, FLYOUT_CLOSE_DELAY_MS);
  };

  const submenuItems: SessionSubmenuItem[] = [
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

  return (
    <>
      {/* Collapsed sidebar (desktop): flyout on hover */}
      <Box
        display={{
          base: 'none',
          md: isCollapsed ? 'block' : 'none',
        }}
        onPointerEnter={openFlyout}
        onPointerLeave={closeFlyout}
        onFocus={openFlyout}
      >
        <PopoverRoot
          open={isFlyoutOpen}
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
              {...getActiveProps(isMenuActive, isCollapsed)}
            >
              <CalendarDays
                size={18}
                color={isMenuActive ? ACTIVE_ICON_COLOR : 'currentColor'}
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
            onPointerEnter={openFlyout}
            onPointerLeave={closeFlyout}
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
              {submenuItems.map((item) => (
                <SessionSubmenuLink
                  key={item.href}
                  item={item}
                  variant="flyout"
                  onClose={onClose}
                />
              ))}
            </Stack>
          </PopoverContent>
        </PopoverRoot>
      </Box>

      {/* Expanded sidebar / mobile: inline collapsible submenu */}
      <Box
        display={{
          base: 'block',
          md: isCollapsed ? 'none' : 'block',
        }}
      >
        <Collapsible.Root
          open={isMenuOpen}
          onOpenChange={(event) => setIsMenuOpen(event.open)}
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
              {...getActiveProps(isMenuActive, isCollapsed)}
            >
              <Flex align="center" gap={3} w="full">
                <CalendarDays
                  size={18}
                  color={isMenuActive ? ACTIVE_ICON_COLOR : 'currentColor'}
                />
                <Text flex={1} fontWeight="inherit">
                  {nav('sessions')}
                </Text>
                <Box
                  display="inline-flex"
                  transition="transform 0.2s ease"
                  transform={isMenuOpen ? 'rotate(0deg)' : 'rotate(-90deg)'}
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
                {submenuItems.map((item) => (
                  <SessionSubmenuLink
                    key={item.href}
                    item={item}
                    onClose={onClose}
                  />
                ))}
              </Stack>
            </Box>
          </Collapsible.Content>
        </Collapsible.Root>
      </Box>
    </>
  );
}
