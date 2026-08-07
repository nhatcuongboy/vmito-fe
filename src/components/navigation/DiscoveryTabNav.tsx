'use client';

import { Box, Flex, Icon } from '@chakra-ui/react';
import { useRouter, usePathname } from '@/i18n/config';
import {
  ROUTES,
  TOP_BAR_HEIGHT_DESKTOP,
  TOP_BAR_HEIGHT_MOBILE,
} from '@/constants';
import { useTranslations } from 'next-intl';
import { Flame, Heart } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useAuthStore, useAuthHydration } from '@/stores/useAuthStore';

import { UnderlineTabs } from '../ui/UnderlineTabs';

export function DiscoveryTabNav() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations('navigation');
  const { isAuthenticated } = useAuthStore();
  const isHydrated = useAuthHydration();

  const tabs = [
    {
      id: ROUTES.HOME,
      label: (
        <Flex align="center" gap={1}>
          {t('findSessions')}
          <Box
            as={Flame}
            color="orange.500"
            fill="orange.500"
            w="14px"
            h="14px"
            display="inline-block"
          />
        </Flex>
      ),
    },
    { id: ROUTES.BROWSE.VENUES.LIST, label: t('findVenues') },
    { id: ROUTES.CLUBS.BROWSE, label: t('findClubs') },
    { id: ROUTES.CLASSES.BROWSE, label: t('findClasses') },
    { id: ROUTES.BROWSE.TOURNAMENTS.LIST, label: t('findTournaments') },
  ];

  // Helper to check which tab is active
  const activeId =
    tabs.find((tab) => {
      if (tab.id === ROUTES.HOME) {
        return pathname === '/';
      }
      return pathname.startsWith(tab.id);
    })?.id || ROUTES.HOME;

  // Check favorite status based on active page
  const isFavoriteActive = searchParams.get('favorite') === '1';

  const handleFavoriteToggle = () => {
    const params = new URLSearchParams(searchParams.toString());

    if (isFavoriteActive) {
      params.delete('favorite');
    } else {
      params.set('favorite', '1');
    }

    const queryString = params.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
    router.push(newUrl);
  };

  return (
    <Box display={{ base: 'block', md: 'none' }}>
      <UnderlineTabs
        items={tabs}
        activeId={activeId}
        onTabClick={(id) => router.push(id)}
        isFixed={true}
        top={{
          base: `calc(${TOP_BAR_HEIGHT_MOBILE + 52}px + env(safe-area-inset-top))`,
          md: `calc(${TOP_BAR_HEIGHT_DESKTOP}px + env(safe-area-inset-top))`,
        }}
        boxShadow="0 2px 4px -1px rgba(0,0,0,0.1)"
        rightContent={
          isHydrated && isAuthenticated ? (
            <Box
              as="button"
              onClick={handleFavoriteToggle}
              p={2}
              borderRadius="md"
              bg={isFavoriteActive ? 'green.50' : 'transparent'}
              color={isFavoriteActive ? 'green.600' : 'fg.muted'}
              transition="all 0.2s"
              cursor="pointer"
              _hover={{
                bg: isFavoriteActive ? 'green.100' : 'gray.50',
                color: isFavoriteActive ? 'green.700' : 'fg',
              }}
              _active={{
                transform: 'scale(0.95)',
              }}
              aria-label={
                isFavoriteActive ? 'Hiện tất cả' : 'Chỉ hiện yêu thích'
              }
              aria-pressed={isFavoriteActive}
            >
              <Icon
                as={Heart}
                boxSize={5}
                fill={isFavoriteActive ? 'currentColor' : 'none'}
                strokeWidth={2}
              />
            </Box>
          ) : null
        }
      />
    </Box>
  );
}
