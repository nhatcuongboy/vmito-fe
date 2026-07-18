'use client';

import { memo, useState } from 'react';
import {
  Avatar,
  Badge,
  Box,
  Flex,
  Icon,
  Image,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import { ArrowRight, Clock, Facebook, MapPin } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { ISession } from '@/lib/api/types';
import { Link } from '@/i18n/config';
import { FavoriteButton } from '@/components/favorites/FavoriteButton';
import { FeeService } from '@/lib/api/fee.service';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import { getSkillLevelColor } from '@/lib/utils/skillLevel.utils';
import {
  VALID_LEVELS,
  getLevelRank,
  sortLevelsByRank,
} from '@/constants/levels';
import { normalizeImageUrl } from '@/lib/images/normalizeImageUrl';
import { DEFAULT_COVER_PHOTO } from '@/constants';
import { formatCompactSessionDate } from '@/utils/session-helpers';
import { formatTimeRangeByDevicePreference } from '@/utils/time-helpers';
import { formatVenueName } from '@/utils/venue-helpers';

// 600x450 = 4:3 at 2x DPR for the widest render (~280px at lg 4-col).
// Must stay byte-identical to the view=list LCP preload in
// src/app/[locale]/page.tsx.
export const COMPACT_COVER_TRANSFORM = {
  cloudinaryWidth: 600,
  cloudinaryHeight: 450,
} as const;

interface SessionCardCompactProps {
  session: ISession;
  userRegistrationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  distance?: number;
  imagePriority?: boolean;
}

/**
 * Marketplace-style compact card for the find-session page's list view.
 * Mobile: single-column horizontal rows (square photo left, info right);
 * md+: vertical cards (4:3 cover on top) in a 3–4 column grid. One overlay
 * badge + favorite heart, then title / time / venue / levels+price. No
 * action buttons — the whole card links to the session detail page.
 * Other pages keep the legacy list look via BaseSessionCard variant="list".
 */
const SessionCardCompact = ({
  session,
  userRegistrationStatus = null,
  distance,
  imagePriority = false,
}: SessionCardCompactProps) => {
  const t = useTranslations('session');
  const tVenue = useTranslations('venue');
  const locale = useLocale();
  const { getLevelShortLabel } = useLevelLabel();
  const [isLoading, setIsLoading] = useState(false);

  const cardHref = `/sessions/${session.slug || session.id}`;

  const handleCardLinkClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }

    setIsLoading(true);
    // Reset loading after a delay just in case navigation fails or user comes back
    setTimeout(() => {
      setIsLoading(false);
    }, 5000);
  };

  // Slot availability (approved players only), same as FindSessionCard
  const maxPlayers = session.numberOfCourts * session.maxPlayersPerCourt;
  const approvedPlayersCount = session._count?.players || 0;
  const availableSlots = maxPlayers - approvedPlayersCount;
  const isFull = approvedPlayersCount >= maxPlayers;
  const isCrawled = session.isCrawled === true;
  const isExpired =
    session.status === 'PREPARING' &&
    session.endTime &&
    new Date(session.endTime) < new Date();

  // Single overlay badge, first match wins: the viewer's own registration
  // state beats generic availability; crawled sessions have no managed
  // slots so a slot badge would be wrong; expired sessions get none.
  let overlayBadge: React.ReactNode = null;
  if (userRegistrationStatus) {
    overlayBadge = (
      <Badge
        colorPalette={userRegistrationStatus === 'REJECTED' ? 'red' : 'yellow'}
        variant={userRegistrationStatus === 'APPROVED' ? 'subtle' : 'solid'}
        borderWidth="1px"
        borderColor={
          userRegistrationStatus === 'APPROVED'
            ? 'yellow.200'
            : userRegistrationStatus === 'PENDING'
              ? 'yellow.400'
              : 'red.400'
        }
      >
        {userRegistrationStatus === 'APPROVED'
          ? t('registrationApproved')
          : userRegistrationStatus === 'PENDING'
            ? t('registrationPending')
            : t('registrationRejected')}
      </Badge>
    );
  } else if (isCrawled) {
    overlayBadge = (
      <Badge
        bg="blackAlpha.600"
        _dark={{ bg: 'whiteAlpha.200' }}
        color="white"
        borderWidth="1px"
        borderColor="whiteAlpha.200"
        backdropFilter="blur(4px)"
        gap={1}
      >
        <Icon as={Facebook} boxSize={3} />
        {t('crawledBadge')}
      </Badge>
    );
  } else if (!isExpired) {
    overlayBadge = (
      <Badge
        colorPalette={isFull ? 'gray' : 'teal'}
        variant="solid"
        borderWidth="1px"
        borderColor={isFull ? 'gray.400' : 'teal.400'}
      >
        {isFull
          ? t('slotsFull')
          : t('slotsAvailable', { count: availableSlots })}
      </Badge>
    );
  }

  // "Hôm nay, 20:00-22:00" / "T4 22/07, 20:00-22:00" — one line, must fit
  // narrow md+ cards, so minimal date + no spaces around the time range dash
  const dateLabel = formatCompactSessionDate(
    session.startTime || session.createdAt,
    locale,
    { today: t('today'), tomorrow: t('tomorrow') },
    { minimal: true }
  );
  const timeLabel = session.startTime
    ? formatTimeRangeByDevicePreference(
        session.startTime,
        session.endTime
      ).replace(' - ', '-')
    : '';
  const dateTimeLine = timeLabel ? `${dateLabel}, ${timeLabel}` : dateLabel;
  const isRelativeDay = dateLabel === t('today') || dateLabel === t('tomorrow');

  // "Tên Sân • Quận [• 1.2km]" — no full address on the compact card. The
  // district/distance segment stays visible; only the name truncates.
  const venueName = session.venue?.name
    ? formatVenueName(
        session.venue.name,
        tVenue('nameFormat', { name: '{name}' })
      )
    : session.location;
  // "Phường Gò Vấp" → "Gò Vấp" (Chợ Tốt style), but keep the prefix for
  // numbered wards where the bare remainder would be meaningless ("Phường 5")
  const district = (
    session.venue?.newDistrict ||
    session.venue?.district ||
    ''
  ).replace(/^(Phường|Xã|Thị trấn)\s+(?=\D)/i, '');
  const distanceLabel =
    distance !== undefined
      ? distance < 1
        ? `${Math.round(distance * 1000)}m`
        : `${distance.toFixed(1)}km`
      : undefined;
  const venueSuffix = [district, distanceLabel].filter(Boolean).join(' • ');

  // Levels: min/max shown as a range (arrow) only when the selected levels
  // are actually contiguous by rank — a range badge for a gappy selection
  // (e.g. only "Yếu-" and "TB+" picked, skipping everything between) would
  // visually claim the skipped middle levels are welcome too, which is wrong.
  const uniqueLevels = sortLevelsByRank(
    Array.from(new Set(session.requiredLevels || []))
  );
  const isAllLevels =
    uniqueLevels.length === 0 || uniqueLevels.length >= VALID_LEVELS.length;
  const minLevel = uniqueLevels[0];
  const maxLevel = uniqueLevels[uniqueLevels.length - 1];
  const isContiguous = uniqueLevels.every((level, i) => {
    if (i === 0) return true;
    const prevRank = getLevelRank(uniqueLevels[i - 1]);
    const rank = getLevelRank(level);
    return (
      prevRank !== undefined && rank !== undefined && rank === prevRank + 1
    );
  });
  const isLevelRange = !isAllLevels && uniqueLevels.length > 1 && isContiguous;
  // Discrete (non-contiguous) multi-level selection: list actual picks
  // instead of implying a span. Cap so the row can't overflow the card.
  const DISCRETE_LEVEL_CAP = 3;
  const isDiscreteLevels =
    !isAllLevels && uniqueLevels.length > 1 && !isContiguous;
  const shownDiscreteLevels = isDiscreteLevels
    ? uniqueLevels.slice(0, DISCRETE_LEVEL_CAP)
    : [];
  const extraDiscreteLevelCount = isDiscreteLevels
    ? uniqueLevels.length - shownDiscreteLevels.length
    : 0;

  const displayHostName = session.hostName || session.host?.name || '';

  const feeDisplayText = FeeService.getSessionFeeForCard(session);

  return (
    <Box
      h="100%"
      w="100%"
      transition="transform 0.15s ease, opacity 0.15s ease"
      _active={{ transform: 'scale(0.98)', opacity: 0.95 }}
    >
      <Box
        position="relative"
        borderWidth="1px"
        borderRadius="xl"
        overflow="hidden"
        bg="white"
        _dark={{ bg: 'gray.800' }}
        boxShadow="0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)"
        transition="box-shadow 0.2s ease, border-color 0.2s ease"
        _hover={{
          boxShadow:
            '0 8px 16px rgba(16, 185, 129, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08)',
          borderColor: 'green.200',
        }}
        display="flex"
        // mobile: horizontal row (square photo left, info right, 1-col list);
        // md+: vertical card (4:3 cover on top) for the 3–4 column grid
        flexDirection={{ base: 'row', md: 'column' }}
        height="100%"
        cursor="pointer"
      >
        <Link
          href={cardHref}
          aria-label={session.name}
          prefetch={false}
          onClick={handleCardLinkClick}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'block',
            zIndex: 1,
          }}
        />

        {/* Cover: square thumbnail stretching to row height on mobile,
            4:3 on md+. Single overlay badge; heart sits at card level. */}
        <Box
          position="relative"
          overflow="hidden"
          flexShrink={0}
          w={{ base: '112px', md: 'auto' }}
          aspectRatio={{ base: 'auto', md: 4 / 3 }}
        >
          <Image
            src={
              normalizeImageUrl(session.coverPhoto, COMPACT_COVER_TRANSFORM) ||
              DEFAULT_COVER_PHOTO
            }
            alt={session.name}
            position="absolute"
            inset={0}
            w="100%"
            h="100%"
            objectFit="cover"
            loading={imagePriority ? 'eager' : 'lazy'}
            fetchPriority={imagePriority ? 'high' : 'low'}
            decoding="async"
            onError={(e) => {
              // Hotlinked Facebook images can expire — fall back to default
              const img = e.currentTarget as HTMLImageElement;
              if (img.src !== DEFAULT_COVER_PHOTO) {
                img.src = DEFAULT_COVER_PHOTO;
              }
            }}
          />
          {overlayBadge && (
            <Box position="absolute" top={1.5} left={1.5} pointerEvents="none">
              {overlayBadge}
            </Box>
          )}
        </Box>

        {/* Top-right of the card: over the cover on md+, over the body on
            the mobile row layout (title reserves space via pr) */}
        <Box position="absolute" top={2} right={2} zIndex={3}>
          <FavoriteButton
            type="SESSION"
            targetId={session.id}
            isFavorite={session.isFavorite}
            size="xs"
            returnUrl={cardHref}
          />
        </Box>

        {/* Body: title / host / time / venue / levels + price */}
        <Stack p={2.5} gap={1} flex="1" minW={0}>
          <Text
            fontWeight="semibold"
            fontSize="sm"
            lineHeight={1.35}
            truncate
            minW={0}
            pr={{ base: 8, md: 0 }}
          >
            {session.name}
          </Text>

          {/* Session source right under the title: host for app sessions,
              Facebook attribution for crawled ones */}
          {isCrawled ? (
            <Flex align="center" gap={1}>
              <Icon as={Facebook} boxSize={3} color="blue.500" flexShrink={0} />
              <Text
                fontSize="2xs"
                color="gray.500"
                _dark={{ color: 'fg.subtle' }}
                lineClamp={1}
              >
                {t('crawledSourcePrefix')}
              </Text>
            </Flex>
          ) : (
            displayHostName && (
              <Flex align="center" gap={1.5}>
                <Avatar.Root size="2xs" bg="brand.500" flexShrink={0}>
                  <Avatar.Fallback name={displayHostName}>
                    {displayHostName.charAt(0).toUpperCase()}
                  </Avatar.Fallback>
                  {session.host?.image && (
                    <Avatar.Image
                      src={normalizeImageUrl(session.host.image)}
                      // Decorative — the host name is rendered right next to it
                      alt=""
                    />
                  )}
                </Avatar.Root>
                <Text
                  fontSize="xs"
                  fontWeight="normal"
                  color="gray.600"
                  _dark={{ color: 'gray.400' }}
                  lineClamp={1}
                >
                  {displayHostName}
                </Text>
              </Flex>
            )
          )}

          <Flex
            align="center"
            gap={1}
            color="gray.500"
            _dark={{ color: 'fg.subtle' }}
          >
            <Icon as={Clock} boxSize={3} flexShrink={0} />
            {/* Play time is a primary signal — darker/bolder than the other
                meta lines, with an orange accent on today/tomorrow */}
            <Text
              fontSize="xs"
              fontWeight="semibold"
              color="gray.700"
              _dark={{ color: 'gray.200' }}
              lineClamp={1}
            >
              {isRelativeDay ? (
                <>
                  <Text
                    as="span"
                    color="orange.500"
                    _dark={{ color: 'orange.300' }}
                  >
                    {dateLabel}
                  </Text>
                  {timeLabel ? `, ${timeLabel}` : ''}
                </>
              ) : (
                dateTimeLine
              )}
            </Text>
          </Flex>

          {(venueName || venueSuffix) && (
            <Flex
              align="center"
              gap={1}
              color="gray.500"
              _dark={{ color: 'fg.subtle' }}
            >
              <Icon as={MapPin} boxSize={3} flexShrink={0} />
              {venueName && (
                <Text fontSize="xs" truncate minW={0}>
                  {venueName}
                </Text>
              )}
              {venueSuffix && (
                <Text fontSize="xs" truncate flexShrink={0} maxW="75%">
                  {venueName ? `• ${venueSuffix}` : venueSuffix}
                </Text>
              )}
            </Flex>
          )}

          {/* wrap + ml-auto price: when the chip + price don't fit one line
              the price drops to its own line, still right-aligned */}
          <Flex
            align="center"
            wrap="wrap"
            columnGap={1}
            rowGap={0.5}
            mt="auto"
            pt={1}
          >
            <Flex align="center" gap={1} flexShrink={0}>
              {isAllLevels ? (
                <Badge
                  colorPalette="gray"
                  variant="subtle"
                  fontSize="xs"
                  px={1.5}
                >
                  {t('allLevelsShort')}
                </Badge>
              ) : isDiscreteLevels ? (
                // Non-contiguous picks: list them, no arrow — an arrow would
                // wrongly imply the skipped levels in between are welcome too
                <>
                  {shownDiscreteLevels.map((level) => (
                    <Badge
                      key={level}
                      colorPalette={getSkillLevelColor([level]).colorPalette}
                      variant="solid"
                      fontSize="xs"
                      px={1.5}
                    >
                      {getLevelShortLabel(level)}
                    </Badge>
                  ))}
                  {extraDiscreteLevelCount > 0 && (
                    <Badge
                      colorPalette="gray"
                      variant="subtle"
                      fontSize="xs"
                      px={1.5}
                    >
                      +{extraDiscreteLevelCount}
                    </Badge>
                  )}
                </>
              ) : (
                <>
                  <Badge
                    colorPalette={getSkillLevelColor([minLevel]).colorPalette}
                    variant="solid"
                    fontSize="xs"
                    px={1.5}
                  >
                    {getLevelShortLabel(minLevel)}
                  </Badge>
                  {isLevelRange && (
                    <>
                      <Icon
                        as={ArrowRight}
                        boxSize={2.5}
                        color="gray.400"
                        flexShrink={0}
                      />
                      <Badge
                        colorPalette={
                          getSkillLevelColor([maxLevel]).colorPalette
                        }
                        variant="solid"
                        fontSize="xs"
                        px={1.5}
                      >
                        {getLevelShortLabel(maxLevel)}
                      </Badge>
                    </>
                  )}
                </>
              )}
            </Flex>

            {feeDisplayText && (
              <Text
                fontSize="md"
                fontWeight="bold"
                color="green.600"
                _dark={{ color: 'green.300' }}
                whiteSpace="nowrap"
                flexShrink={0}
                ml="auto"
              >
                {feeDisplayText}
              </Text>
            )}
          </Flex>
        </Stack>

        {/* Loading overlay — mirrors BaseSessionCard's tap feedback so the
            card doesn't feel unresponsive during the route transition */}
        {isLoading && (
          <Flex
            position="absolute"
            inset={0}
            bg="whiteAlpha.700"
            _dark={{ bg: 'blackAlpha.700' }}
            align="center"
            justify="center"
            zIndex={10}
          >
            <Spinner size="lg" color="green.500" />
          </Flex>
        )}
      </Box>
    </Box>
  );
};

export default memo(SessionCardCompact);
