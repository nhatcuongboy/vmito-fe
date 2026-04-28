'use client';

import { Flex, Box, Text } from '@chakra-ui/react';
import { useRouter, usePathname } from '@/i18n/config';
import {
  ROUTES,
  TOP_BAR_HEIGHT_DESKTOP,
  TOP_BAR_HEIGHT_MOBILE,
  CONTAINER_PX,
} from '@/constants';
import { useTranslations } from 'next-intl';

import { UnderlineTabs } from '../ui/UnderlineTabs';

export function DiscoveryTabNav() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('navigation');

  const tabs = [
    { id: ROUTES.HOME, label: t('findSessions') },
    { id: ROUTES.BROWSE.VENUES.LIST, label: t('findVenues') },
    { id: ROUTES.CLUBS.BROWSE, label: t('findClubs') },
    // { id: ROUTES.BROWSE.TOURNAMENTS.LIST, label: t('findTournaments') },
  ];

  // Helper to check which tab is active
  const activeId =
    tabs.find((tab) => {
      if (tab.id === ROUTES.HOME) {
        return pathname === '/';
      }
      return pathname.startsWith(tab.id);
    })?.id || ROUTES.HOME;

  return (
    <Box display={{ base: 'block', md: 'none' }}>
      <UnderlineTabs
        items={tabs}
        activeId={activeId}
        onTabClick={(id) => router.push(id)}
        isFixed={true}
        boxShadow="sm"
        top={{
          base: `calc(${TOP_BAR_HEIGHT_MOBILE}px + env(safe-area-inset-top))`,
          md: `calc(${TOP_BAR_HEIGHT_DESKTOP}px + env(safe-area-inset-top))`,
        }}
      />
    </Box>
  );
}
