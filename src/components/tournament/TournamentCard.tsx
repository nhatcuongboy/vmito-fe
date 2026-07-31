'use client';

import { FavoriteButton } from '@/components/favorites/FavoriteButton';
import { resolveTournamentStatusBadge } from '@/components/tournament/tournamentStatusBadge';
import { Link } from '@/i18n/config';
import {
  SportType,
  Tournament,
  TournamentCategorySummary,
} from '@/lib/api/types';
import { TOURNAMENT_COVER_TRANSFORM } from '@/lib/images/coverTransforms';
import { normalizeImageUrl } from '@/lib/images/normalizeImageUrl';
import { getPrimaryVenueDisplay } from '@/utils';
import { Badge, Box, Flex, Icon, Image, Stack, Text } from '@chakra-ui/react';
import { Calendar, MapPin, Swords, Users } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { memo } from 'react';

/** Chips beyond this are collapsed into a "+N" counter. */
const MAX_CATEGORY_CHIPS = 2;

const isSameCalendarDay = (first: Date, second: Date) =>
  first.getFullYear() === second.getFullYear() &&
  first.getMonth() === second.getMonth() &&
  first.getDate() === second.getDate();

const formatDateRange = (startDate: Date, endDate: Date, locale: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const fullFormatter = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const shortFormatter = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  if (isSameCalendarDay(start, end)) return fullFormatter.format(start);
  if (
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear()
  ) {
    return `${shortFormatter.format(start)} - ${fullFormatter.format(end)}`;
  }
  return `${fullFormatter.format(start)} - ${fullFormatter.format(end)}`;
};

const getLocationText = (tournament: Tournament) => {
  const venue = getPrimaryVenueDisplay(tournament);
  if (!venue) return null;
  const parts: string[] = [];
  if (venue.name) {
    parts.push(venue.name);
    const district = venue.newDistrict || venue.district;
    const city = venue.newCity || venue.city;
    if (district) parts.push(district);
    if (city && city !== district) parts.push(city);
  } else if (venue.address) {
    parts.push(venue.address);
  }
  return parts.filter(Boolean).join(', ') || null;
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
 * Mobile: horizontal row (square poster left, info right) so several fit on
 * screen; md+: vertical card with a 16:9 poster — tournament banners are
 * banner-shaped, and a fixed pixel height letterboxed them badly in the wider
 * grid columns. Mirrors SessionCardCompact's chrome so the two browse
 * surfaces read as one system.
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
  const visibleCategories = categories.slice(0, MAX_CATEGORY_CHIPS);
  const hiddenCategoryCount = categories.length - visibleCategories.length;
  const categoryCount = tournament._count?.categories ?? categories.length;

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
        display="flex"
        flexDirection={{ base: 'row', md: 'column' }}
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
          w={{ base: '120px', md: 'auto' }}
          aspectRatio={{ base: 'auto', md: 16 / 9 }}
          bg="bg.muted"
        >
          {coverImage ? (
            <Image
              src={normalizeImageUrl(coverImage, TOURNAMENT_COVER_TRANSFORM)}
              alt={tournament.name}
              position="absolute"
              inset={0}
              w="100%"
              h="100%"
              objectFit="cover"
              objectPosition="center"
              loading={imagePriority ? 'eager' : 'lazy'}
              fetchPriority={imagePriority ? 'high' : 'low'}
              decoding="async"
              transition="transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
              _groupHover={{ transform: 'scale(1.04)' }}
            />
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
            top={2}
            left={2}
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

        {/* Over the poster on md+, over the card body on the mobile row — the
            title reserves space for it via pr. */}
        <Box position="absolute" top={2} right={2} zIndex={3}>
          <FavoriteButton
            type="TOURNAMENT"
            targetId={tournament.id}
            isFavorite={tournament.isFavorite}
            size="sm"
            variant={{ base: 'ghost', md: 'overlay' }}
            returnUrl={href}
            onChange={(nextValue) =>
              onFavoriteChange?.(tournament.id, nextValue)
            }
          />
        </Box>

        <Stack
          p={{ base: 2.5, md: 3 }}
          gap={{ base: 1, md: 1.5 }}
          flex="1"
          minW={0}
        >
          {/* The date is the primary decision signal for an event, so it gets
              the brand accent rather than muted small print. */}
          <Flex align="center" gap={1} minW={0}>
            <Icon
              as={Calendar}
              boxSize={{ base: 3, md: 3.5 }}
              flexShrink={0}
              color="green.600"
              _dark={{ color: 'green.300' }}
            />
            <Text
              fontSize="xs"
              fontWeight="semibold"
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
            fontWeight="semibold"
            fontSize={{ base: 'sm', md: 'md' }}
            lineHeight={1.35}
            lineClamp={2}
            minW={0}
            pr={{ base: 8, md: 0 }}
          >
            {tournament.name}
          </Text>

          {locationText && (
            <Flex align="center" gap={1} color="fg.muted" minW={0}>
              <Icon as={MapPin} boxSize={{ base: 3, md: 3.5 }} flexShrink={0} />
              <Text fontSize="xs" truncate minW={0}>
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
              <Badge
                variant="subtle"
                colorPalette={
                  tournament.sportType === SportType.PICKLEBALL
                    ? 'orange'
                    : 'green'
                }
                borderRadius="full"
                fontSize="2xs"
                px={2}
                textTransform="none"
                flexShrink={0}
              >
                {t(`filters.sport.${tournament.sportType}`)}
              </Badge>
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
                    fontSize="2xs"
                    px={2}
                    maxW="96px"
                    textTransform="none"
                    truncate
                  >
                    {category.name}
                  </Badge>
                ))
              : categoryCount > 0 && (
                  <Text fontSize="2xs" color="fg.muted" flexShrink={0}>
                    {t('card.categoryCount', { count: categoryCount })}
                  </Text>
                )}
            {hiddenCategoryCount > 0 && (
              <Badge
                variant="subtle"
                colorPalette="gray"
                borderRadius="full"
                fontSize="2xs"
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
                <Text fontSize="2xs">{entrantLabel}</Text>
              </Flex>
            )}
          </Flex>
        </Stack>
      </Box>
    </Box>
  );
};

export default memo(TournamentCard);
