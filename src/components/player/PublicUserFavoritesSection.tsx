'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  HStack,
  Image,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react';
import { ChevronRight, Heart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import {
  FavoriteService,
  FavoriteTargetSummary,
  FavoriteType,
} from '@/lib/api/favorite.service';
import { getFavoriteListHref } from '@/hooks/useFavoriteToggle';
import { ROUTES } from '@/constants';

const PREVIEW_SIZE = 5;
const FAVORITE_TABS: FavoriteType[] = [
  'SESSION',
  'VENUE',
  'CLUB',
  'TOURNAMENT',
];

const getTargetHref = (type: FavoriteType, item: FavoriteTargetSummary) => {
  switch (type) {
    case 'SESSION':
      return ROUTES.BROWSE.SESSIONS.DETAIL(item.id, item.slug);
    case 'VENUE':
      return ROUTES.VENUES.DETAIL(item.id, item.slug);
    case 'CLUB':
      return ROUTES.CLUBS.DETAIL(item.id);
    case 'TOURNAMENT':
      return ROUTES.TOURNAMENT.DETAIL(item.id);
  }
};

const getTargetImage = (item: FavoriteTargetSummary) =>
  item.coverPhoto || item.image || item.images?.[0];

const getTargetSubtitle = (type: FavoriteType, item: FavoriteTargetSummary) => {
  switch (type) {
    case 'SESSION':
      return item.venue?.name;
    case 'VENUE': {
      const address = item.address || item.district || item.city;
      return address;
    }
    case 'CLUB':
      return item.defaultVenue?.name;
    case 'TOURNAMENT':
      return item.host?.name;
  }
};

export default function PublicUserFavoritesSection() {
  const t = useTranslations('userProfilePage');
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState<FavoriteType>('SESSION');
  const [items, setItems] = useState<FavoriteTargetSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchFavorites = async () => {
      try {
        setIsLoading(true);
        const response = await FavoriteService.getFavorites({
          type: activeTab,
          page: 1,
          limit: PREVIEW_SIZE,
        });
        if (!cancelled) {
          setItems(response.data);
        }
      } catch (fetchError) {
        console.error('Failed to fetch favorites:', fetchError);
        if (!cancelled) {
          setItems([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchFavorites();

    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  const tabLabelKey: Record<FavoriteType, string> = {
    SESSION: 'favoriteSessions',
    VENUE: 'favoriteVenues',
    CLUB: 'favoriteClubs',
    TOURNAMENT: 'favoriteTournaments',
  };

  const emptyLabelKey: Record<FavoriteType, string> = {
    SESSION: 'noFavoriteSessions',
    VENUE: 'noFavoriteVenues',
    CLUB: 'noFavoriteClubs',
    TOURNAMENT: 'noFavoriteTournaments',
  };

  return (
    <Box
      bg="white"
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="2xl"
      p={4}
      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
    >
      <Text
        fontSize="lg"
        fontWeight="bold"
        color="gray.800"
        _dark={{ color: 'gray.100' }}
        mb={3}
      >
        {t('favorites')}
      </Text>

      <HStack gap={2} mb={4} wrap="wrap">
        {FAVORITE_TABS.map((tab) => (
          <Button
            key={tab}
            size="sm"
            borderRadius="full"
            variant={activeTab === tab ? 'solid' : 'outline'}
            colorPalette={activeTab === tab ? 'green' : 'gray'}
            onClick={() => setActiveTab(tab)}
          >
            {t(tabLabelKey[tab])}
          </Button>
        ))}
      </HStack>

      {isLoading ? (
        <VStack gap={3} align="stretch">
          {[0, 1].map((i) => (
            <Skeleton key={i} height="64px" borderRadius="lg" />
          ))}
        </VStack>
      ) : items.length === 0 ? (
        <Box
          borderWidth="1px"
          borderStyle="dashed"
          borderColor="gray.300"
          borderRadius="xl"
          p={6}
          textAlign="center"
          bg="gray.50"
          _dark={{ bg: 'gray.700', borderColor: 'gray.600' }}
        >
          <Heart size={20} color="gray" style={{ margin: '0 auto 8px' }} />
          <Text color="gray.500" _dark={{ color: 'gray.400' }}>
            {t(emptyLabelKey[activeTab])}
          </Text>
        </Box>
      ) : (
        <VStack gap={2} align="stretch">
          {items.map((item) => {
            const subtitle = getTargetSubtitle(activeTab, item);
            const image = getTargetImage(item);

            return (
              <Link
                key={item.id}
                href={`/${locale}${getTargetHref(activeTab, item)}`}
              >
                <Box
                  borderWidth="1px"
                  borderColor="gray.200"
                  borderRadius="lg"
                  p={3}
                  bg="gray.50"
                  _dark={{ bg: 'gray.700', borderColor: 'gray.600' }}
                  _hover={{
                    bg: 'gray.100',
                    borderColor: 'green.300',
                    _dark: { bg: 'gray.600', borderColor: 'green.500' },
                  }}
                  transition="all 0.2s"
                  cursor="pointer"
                >
                  <HStack gap={3}>
                    {image && (
                      <Image
                        src={image}
                        alt={item.name}
                        boxSize="40px"
                        borderRadius="md"
                        objectFit="cover"
                      />
                    )}
                    <VStack align="start" gap={0} flex={1}>
                      <Text
                        fontWeight="semibold"
                        color="gray.800"
                        _dark={{ color: 'gray.100' }}
                        lineClamp={1}
                      >
                        {item.name}
                      </Text>
                      {subtitle && (
                        <Text
                          fontSize="xs"
                          color="gray.500"
                          _dark={{ color: 'gray.400' }}
                          lineClamp={1}
                        >
                          {subtitle}
                        </Text>
                      )}
                    </VStack>
                    <ChevronRight size={16} color="gray" />
                  </HStack>
                </Box>
              </Link>
            );
          })}
        </VStack>
      )}

      <Link href={`/${locale}${getFavoriteListHref(activeTab)}`}>
        <Button variant="ghost" size="sm" colorPalette="green" mt={3} w="full">
          {t('viewAllFavorites')}
        </Button>
      </Link>
    </Box>
  );
}
