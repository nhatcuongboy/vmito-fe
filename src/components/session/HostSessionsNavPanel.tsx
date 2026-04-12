'use client';

import { Box, Flex, Text, VStack } from '@chakra-ui/react';
import { ClipboardList, ClipboardCheck, Ticket, History } from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/config';
import { ROUTES } from '@/constants';
import BottomNavigationBar from '@/components/ui/BottomNavigationBar';
import { useState, useTransition, useEffect } from 'react';

interface INavItem {
  id: number;
  labelKey: string;
  icon: LucideIcon;
  href: string;
}

const NAV_ITEMS: INavItem[] = [
  {
    id: 0,
    labelKey: 'host',
    icon: ClipboardList,
    href: ROUTES.HOST.SESSIONS.LIST,
  },
  {
    id: 1,
    labelKey: 'pendingJoinRequests',
    icon: ClipboardCheck,
    href: ROUTES.HOST.PENDING_JOIN_REQUESTS,
  },
  {
    id: 2,
    labelKey: 'joined',
    icon: Ticket,
    href: ROUTES.PLAYER.SESSIONS.LIST,
  },
  {
    id: 3,
    labelKey: 'endedSessions',
    icon: History,
    href: ROUTES.HOST.SESSIONS.ENDED,
  },
  {
    id: 4,
    labelKey: 'endedJoinedSessions',
    icon: History,
    href: ROUTES.PLAYER.SESSIONS.ENDED,
  },
];

export default function HostSessionsNavPanel() {
  const t = useTranslations('navigation');
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingTabId, setPendingTabId] = useState<number | null>(null);

  const activeId = NAV_ITEMS.find((item) => pathname === item.href)?.id ?? -1;

  const handleNavigate = (id: number) => {
    const item = NAV_ITEMS.find((i) => i.id === id);
    if (!item) return;

    // Normalize paths for comparison (remove trailing slashes)
    const normalizedPathname = pathname.replace(/\/$/, '') || '/';
    const normalizedHref = item.href.replace(/\/$/, '') || '/';

    if (normalizedPathname === normalizedHref) return;

    setPendingTabId(id);
    startTransition(() => {
      router.push(item.href);
    });
  };

  useEffect(() => {
    if (!isPending) setPendingTabId(null);
  }, [isPending, pathname]);

  const tabs = NAV_ITEMS.map((item) => ({
    id: item.id,
    label: t(item.labelKey as Parameters<typeof t>[0]),
    icon: item.icon,
  }));

  return (
    <>
      {/* Desktop left sidebar panel */}
      <Box
        display="none"
        w="220px"
        flexShrink={0}
        position="sticky"
        top="72px"
        alignSelf="flex-start"
        bg="white"
        _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
        borderRadius="2xl"
        borderWidth="1px"
        borderColor="gray.200"
        boxShadow="sm"
        overflow="hidden"
        zIndex={10}
      >
        <VStack gap={1} align="stretch" p={2}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeId === item.id;

            return (
              <Flex
                key={item.id}
                role="button"
                align="center"
                gap={3}
                px={3}
                py={2.5}
                borderRadius="lg"
                cursor="pointer"
                bg={isActive ? 'green.50' : 'transparent'}
                _dark={{
                  bg: isActive ? 'green.950/20' : 'transparent',
                  _hover: { bg: isActive ? 'green.950/20' : 'gray.700' },
                }}
                color={isActive ? 'green.600' : 'fg'}
                fontWeight={isActive ? 'semibold' : 'normal'}
                borderLeft="4px solid"
                borderLeftColor={isActive ? 'green.500' : 'transparent'}
                _hover={{ bg: isActive ? 'green.50' : 'gray.50' }}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigate(item.id);
                }}
                textAlign="left"
                w="full"
                transition="all 0.2s"
                position="relative"
                zIndex={isActive ? 2 : 1}
              >
                <Icon
                  size={18}
                  color={
                    isActive ? 'var(--chakra-colors-green-500)' : 'currentColor'
                  }
                />
                <Text fontSize="sm">
                  {t(item.labelKey as Parameters<typeof t>[0])}
                </Text>
              </Flex>
            );
          })}
        </VStack>
      </Box>

      {/* Mobile bottom navigation */}
      <BottomNavigationBar
        tabs={tabs}
        activeTab={activeId}
        loadingTabId={pendingTabId}
        onTabChange={handleNavigate}
        alwaysVisible={true}
      />
    </>
  );
}
