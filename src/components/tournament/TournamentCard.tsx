'use client';

import { AppSportBadge } from '@/components/common/AppSportBadge';
import { FavoriteButton } from '@/components/favorites/FavoriteButton';
import { resolveTournamentStatusBadge } from '@/components/tournament/tournamentStatusBadge';
import { Link } from '@/i18n/config';
import { Tournament, TournamentCategorySummary } from '@/lib/api/types';
import { TOURNAMENT_COVER_TRANSFORM } from '@/lib/images/coverTransforms';
import { normalizeImageUrl } from '@/lib/images/normalizeImageUrl';
import { getPrimaryVenueDisplay } from '@/utils';
import { Badge, Box, Flex, Icon, Image, Stack, Text } from '@chakra-ui/react';
import { Calendar, MapPin, Swords, Users } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { memo } from 'react';

/** Chips beyond this are collapsed into a "+N" counter. */
const MAX_CATEGORY_CHIPS = 1;

const isSameCalendarDay = (first: Date, second: Date) =>
  first.getFullYear() === second.getFullYear() &&
  first.getMonth() === second.getMonth() &&
  first.getDate() === second.getDate();

const formatDateRange = (startDate: Date, endDate: Date, locale: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const singleDayFormatter = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  if (isSameCalendarDay(start, end)) return singleDayFormatter.format(start);

  // formatRange automatically removes repeated month/year segments and keeps
  // punctuation/order correct for every supported locale. Omitting weekdays
  // keeps multi-day events compact enough for browse cards.
  const rangeFormatter = new Intl.DateTimeFormat(locale, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  return rangeFormatter.formatRange(start, end);
};

const getLocationText = (tournament: Tournament) => {
  const venue = getPrimaryVenueDisplay(tournament);
  if (!venue) return null;
  const parts: string[] = [];
  if (venue.name) {
    parts.push(venue.name);
    const city = venue.newCity || venue.city;
    const district = venue.newDistrict || venue.district;
    if (city) parts.push(city);
    else if (district) parts.push(district);
  } else if (venue.address) {
    parts.push(venue.address);
  }
  return parts.filter(Boolean).join(' · ') || null;
};

const getCoverImage = (tournament: Tournament) => {
  if (tournament.coverPhoto) return tournament.coverPhoto;
  const venue = getPrimaryVenueDisplay(tournament);
  if (venue?.coverPhoto) return venue.coverPhoto;
  if (venue?.images?.length) return venue.images[0];
  return undefined;
};

interface TournamentCardProps {
  tournament: Tournament;
  /** Eager-load the cover for above-the-fold cards. */
  imagePriority?: boolean;
  onFavoriteChange?: (tournamentId: string, isFavorite: boolean) => void;
}

/**
 * Browse-page card for a tournament.
 * Narrow mobile and md+: vertical card with a compact 140px cover matching
 * ClubCard. sm-only uses a horizontal row whose cover fills the row height.
 * Mirrors SessionCardCompact's chrome so the browse surfaces read as one
 * system.
 */
const TournamentCard = ({
  tournament,
  imagePriority = false,
  onFavoriteChange,
}: TournamentCardProps) => {
  const t = useTranslations('pages.tournaments');
  const locale = useLocale();

  const href = `/tournament/${tournament.slug ?? tournament.id}`;
  const coverImage = getCoverImage(tournament);
  const locationText = getLocationText(tournament);

  // The browse list only selects id/name/type on each category.
  const categories = (tournament.categories ??
    []) as TournamentCategorySummary[];
  const categoryCount = tournament._count?.categories ?? categories.length;
  const visibleCategories = categories.slice(0, MAX_CATEGORY_CHIPS);
  const hiddenCategoryCount = Math.max(
    categoryCount - visibleCategories.length,
    categories.length - visibleCategories.length
  );

  const pairCount = tournament._count?.pairs ?? 0;
  const playerCount = tournament._count?.players ?? 0;
  const entrantLabel =
    pairCount > 0
      ? t('card.teams', { count: pairCount })
      : playerCount > 0
        ? t('card.playersCount', { count: playerCount })
        : null;

  const statusBadge = resolveTournamentStatusBadge(
    tournament.status,
    tournament.startDate,
    {
      inProgress: t('filters.status.IN_PROGRESS'),
      preparing: t('filters.status.PREPARING'),
      finished: t('filters.status.FINISHED'),
      cancelled: t('filters.status.CANCELLED'),
      startsToday: t('card.startsToday'),
      startsTomorrow: t('card.startsTomorrow'),
      daysLeft: (days) => t('card.daysLeft', { days }),
    }
  );

  return (
    <Box
      h="100%"
      w="100%"
      transition="transform 0.15s ease, opacity 0.15s ease"
      _active={{ transform: 'scale(0.98)', opacity: 0.95 }}
      css={{
        '@media (prefers-reduced-motion: reduce)': {
          transition: 'none',
        },
      }}
    >
      <Box
        role="group"
        position="relative"
        borderWidth="1px"
        borderColor="border.subtle"
        borderRadius="xl"
        overflow="hidden"
        bg="white"
        _dark={{ bg: 'gray.800' }}
        boxShadow="0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)"
        transition="box-shadow 0.2s ease, border-color 0.2s ease"
        _hover={{
          boxShadow:
            '0 8px 16px rgba(23, 154, 59, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08)',
          borderColor: 'green.200',
        }}
        _focusWithin={{
          borderColor: 'green.500',
          boxShadow: '0 0 0 3px rgba(23, 154, 59, 0.2)',
        }}
        display="flex"
        flexDirection={{ base: 'column', sm: 'row', md: 'column' }}
        minH={{ base: 'auto', sm: '168px', md: 'auto' }}
        height="100%"
        cursor="pointer"
      >
        {/* A real anchor rather than an onClick handler, so the card supports
            middle-click, cmd-click, keyboard focus and crawling. */}
        <Link
          href={href}
          aria-label={tournament.name}
          prefetch={false}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'block',
            zIndex: 1,
          }}
        />

        <Box
          position="relative"
          overflow="hidden"
          flexShrink={0}
          w={{ base: '100%', sm: '32%', md: 'auto' }}
          minW={{ base: 0, sm: '150px', md: 0 }}
          h={{ base: '140px', sm: 'auto', md: '140px' }}
          bg="bg.muted"
        >
          {coverImage ? (
            <>
              <Image
                src={normalizeImageUrl(coverImage, TOURNAMENT_COVER_TRANSFORM)}
                alt=""
                aria-hidden="true"
                position="absolute"
                inset="-12px"
                w="calc(100% + 24px)"
                h="calc(100% + 24px)"
                objectFit="cover"
                filter="blur(12px) saturate(0.85)"
                opacity={0.72}
                loading={imagePriority ? 'eager' : 'lazy'}
                decoding="async"
              />
              <Image
                src={normalizeImageUrl(coverImage, TOURNAMENT_COVER_TRANSFORM)}
                alt={tournament.name}
                position="absolute"
                inset={0}
                w="100%"
                h="100%"
                objectFit="contain"
                objectPosition="center"
                loading={imagePriority ? 'eager' : 'lazy'}
                fetchPriority={imagePriority ? 'high' : 'low'}
                decoding="async"
                transition="transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
                _groupHover={{ transform: 'scale(1.025)' }}
                css={{
                  '@media (prefers-reduced-motion: reduce)': {
                    transition: 'none',
                  },
                }}
              />
            </>
          ) : (
            // Branded gradient instead of a faded app logo, which read as a
            // broken image.
            <Flex
              position="absolute"
              inset={0}
              align="center"
              justify="center"
              bg="linear-gradient(135deg, #16a34a 0%, #0f766e 100%)"
            >
              <Icon
                as={Swords}
                boxSize={{ base: 7, md: 10 }}
                color="white"
                opacity={0.85}
              />
            </Flex>
          )}

          {/* Keeps the badge legible over bright posters. */}
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            h="64px"
            bg="linear-gradient(180deg, rgba(2, 6, 23, 0.35) 0%, transparent 100%)"
            pointerEvents="none"
          />

          <Flex
            position="absolute"
            top={{ base: 3, sm: 2, md: 3 }}
            left={{ base: 3, sm: 2, md: 3 }}
            zIndex={2}
            pointerEvents="none"
          >
            <Badge
              display="flex"
              alignItems="center"
              gap={1.5}
              bg={statusBadge.bg}
              color={statusBadge.color}
              fontSize="2xs"
              fontWeight="600"
              px={2.5}
              py={1}
              borderRadius="full"
              backdropFilter="blur(8px)"
              boxShadow="0 2px 8px rgba(0, 0, 0, 0.15)"
              textTransform="none"
              maxW={{ base: '104px', md: 'none' }}
              truncate
            >
              {statusBadge.live && (
                <Box
                  w="6px"
                  h="6px"
                  borderRadius="full"
                  bg="green.500"
                  flexShrink={0}
                  className="tournament-live-dot"
                />
              )}
              {statusBadge.label}
            </Badge>
          </Flex>
        </Box>

        {/* Over the poster in vertical layouts and over the card body in the
            sm-only row. The date reserves space for it at that breakpoint. */}
        <Box position="absolute" top={3} right={3} zIndex={3}>
          <FavoriteButton
            type="TOURNAMENT"
            targetId={tournament.id}
            isFavorite={tournament.isFavorite}
            variant={{ base: 'overlay', sm: 'ghost', md: 'overlay' }}
            returnUrl={href}
            onChange={(nextValue) =>
              onFavoriteChange?.(tournament.id, nextValue)
            }
          />
        </Box>

        <Stack
          p={{ base: 3, md: 4 }}
          gap={{ base: 1.5, md: 2 }}
          flex="1"
          minW={0}
        >
          <Flex
            align="center"
            gap={1.5}
            minW={0}
            pr={{ base: 0, sm: 10, md: 0 }}
          >
            <Icon
              as={Calendar}
              boxSize={4}
              flexShrink={0}
              color="green.600"
              _dark={{ color: 'green.300' }}
            />
            <Text
              fontSize="sm"
              fontWeight="medium"
              color="green.700"
              _dark={{ color: 'green.300' }}
              lineClamp={1}
              minW={0}
            >
              {formatDateRange(
                tournament.startDate,
                tournament.endDate,
                locale
              )}
            </Text>
          </Flex>

          <Text
            as="h2"
            fontWeight="semibold"
            fontSize="md"
            lineHeight={1.35}
            lineClamp={2}
            minW={0}
            textWrap="pretty"
          >
            {tournament.name}
          </Text>

          {locationText && (
            <Flex align="center" gap={1.5} color="fg.muted" minW={0}>
              <Icon as={MapPin} boxSize={4} flexShrink={0} />
              <Text fontSize="sm" lineClamp={1} minW={0}>
                {locationText}
              </Text>
            </Flex>
          )}

          {/* mt=auto keeps this row on the baseline so cards in a grid row line
              up even when titles wrap to different heights. */}
          <Flex
            align="center"
            wrap="wrap"
            columnGap={1.5}
            rowGap={1}
            mt="auto"
            pt={1}
            minW={0}
          >
            {tournament.sportType && (
              <AppSportBadge
                sportType={tournament.sportType}
                borderRadius="full"
                fontSize="xs"
                px={2}
                textTransform="none"
                flexShrink={0}
              />
            )}

            {/* Category names come from the browse endpoint; older API
                deployments omit them, so fall back to the count. */}
            {visibleCategories.length > 0
              ? visibleCategories.map((category) => (
                  <Badge
                    key={category.id}
                    variant="subtle"
                    colorPalette="gray"
                    borderRadius="full"
                    fontSize="xs"
                    px={2}
                    maxW="104px"
                    textTransform="none"
                    truncate
                  >
                    {category.name}
                  </Badge>
                ))
              : categoryCount > 0 && (
                  <Text fontSize="xs" color="fg.muted" flexShrink={0}>
                    {t('card.categoryCount', { count: categoryCount })}
                  </Text>
                )}
            {hiddenCategoryCount > 0 && (
              <Badge
                variant="subtle"
                colorPalette="gray"
                borderRadius="full"
                fontSize="xs"
                px={2}
                textTransform="none"
                flexShrink={0}
              >
                {t('card.moreCategories', { count: hiddenCategoryCount })}
              </Badge>
            )}

            {entrantLabel && (
              <Flex align="center" gap={1} color="fg.muted" flexShrink={0}>
                <Icon as={Users} boxSize={3} />
                <Text fontSize="xs">{entrantLabel}</Text>
              </Flex>
            )}
          </Flex>
        </Stack>
      </Box>
    </Box>
  );
};

export default memo(TournamentCard);
