'use client';

import { Badge, Box, Flex, Skeleton, Text } from '@chakra-ui/react';
import {
  ArrowRight,
  CalendarClock,
  CircleAlert,
  Radio,
  Trophy,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { Link } from '@/i18n/config';
import {
  Category,
  CategoryMatch,
  MatchStatus,
  TournamentStatus,
} from '@/lib/api/types';
import { resolveMatchSideLabel } from '@/lib/tournament/bracketSlots';
import { formatCourtWithVenue } from '@/lib/tournament/court';
import { usePlayoffSlotLabels } from '@/lib/tournament/usePlayoffSlotLabels';

interface TournamentPulseCardProps {
  status: TournamentStatus;
  categories: Category[];
  matches: CategoryMatch[];
  slug: string;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}

type PulseKind = 'live' | 'next' | 'finished' | 'preparing' | 'cancelled';

interface PulseSelection {
  kind: PulseKind;
  match?: CategoryMatch;
}

export default function TournamentPulseCard({
  status,
  categories,
  matches,
  slug,
  loading,
  error,
  onRetry,
}: TournamentPulseCardProps) {
  const t = useTranslations('pages.tournaments.detail.homeTab.pulse');
  const locale = useLocale();
  const slotLabels = usePlayoffSlotLabels();
  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories]
  );
  const selection = selectPulseMatch(matches, status);
  const match = selection.match;
  const category = match ? categoryById.get(match.categoryId) : undefined;
  const labelContext = match
    ? {
        allMatches: matches,
        category,
        labels: slotLabels,
        showPlayerNames: true,
      }
    : null;
  const team1 =
    match && labelContext
      ? resolveMatchSideLabel(match, 1, labelContext)
      : undefined;
  const team2 =
    match && labelContext
      ? resolveMatchSideLabel(match, 2, labelContext)
      : undefined;
  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }),
    [locale]
  );

  if (loading) {
    return (
      <Box
        borderRadius="xl"
        borderWidth="1px"
        borderColor="green.200"
        bg="white"
        p={3}
      >
        <Flex align="center" gap={3}>
          <Skeleton height="36px" width="36px" borderRadius="lg" />
          <Box flex={1}>
            <Skeleton height="18px" width="62%" borderRadius="md" mb={2} />
            <Skeleton height="14px" width="82%" borderRadius="md" />
          </Box>
          <Skeleton height="36px" width="92px" borderRadius="full" />
        </Flex>
      </Box>
    );
  }

  if (error) {
    return (
      <PulseShell kind="preparing">
        <Flex align="center" gap={3}>
          <CircleAlert size={22} aria-hidden="true" />
          <Box flex={1}>
            <Text fontWeight="700">{t('errorTitle')}</Text>
            <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }}>
              {t('errorDescription')}
            </Text>
          </Box>
          <Box
            as="button"
            minH="44px"
            px={3}
            borderRadius="lg"
            fontWeight="700"
            onClick={onRetry}
            _hover={{ bg: 'whiteAlpha.700' }}
            _focusVisible={{
              outline: '2px solid',
              outlineColor: 'green.400',
              outlineOffset: '2px',
            }}
          >
            {t('retry')}
          </Box>
        </Flex>
      </PulseShell>
    );
  }

  const presentation = getPulsePresentation(selection.kind, slug, t);
  const Icon = presentation.icon;
  const startTime =
    match?.startTime && !Number.isNaN(new Date(match.startTime).getTime())
      ? timeFormatter.format(new Date(match.startTime))
      : null;
  const courtLabel = match?.court
    ? formatCourtWithVenue(match.court, t('court'))
    : null;
  const score1 = match ? getLatestScore(match, 1) : null;
  const score2 = match ? getLatestScore(match, 2) : null;

  return (
    <PulseShell kind={selection.kind}>
      <Flex align="flex-start" justify="space-between" gap={3}>
        <Flex align="center" gap={2.5} minW={0}>
          <Flex
            align="center"
            justify="center"
            w={{ base: '36px', md: '40px' }}
            h={{ base: '36px', md: '40px' }}
            borderRadius="lg"
            bg="whiteAlpha.800"
            color={presentation.iconColor}
            flexShrink={0}
            boxShadow="0 6px 14px rgba(15, 23, 42, 0.07)"
          >
            <Icon size={20} aria-hidden="true" />
          </Flex>
          <Box minW={0}>
            <Flex align="center" gap={2} wrap="wrap">
              <Text fontWeight="800" fontSize={{ base: 'sm', md: 'md' }}>
                {presentation.title}
              </Text>
              {selection.kind === 'live' ? (
                <Badge colorPalette="green" borderRadius="full">
                  <Box
                    as="span"
                    display="inline-block"
                    w="6px"
                    h="6px"
                    borderRadius="full"
                    bg="green.500"
                    mr={1.5}
                    className="tournament-live-dot"
                  />
                  {t('live')}
                </Badge>
              ) : null}
            </Flex>
            {category ? (
              <Text
                fontSize="sm"
                color="gray.600"
                lineClamp={1}
                _dark={{ color: 'gray.300' }}
              >
                {category.name}
                {startTime ? ` · ${startTime}` : ''}
                {courtLabel ? ` · ${courtLabel}` : ''}
              </Text>
            ) : (
              <Flex align="center" gap={2} wrap="wrap">
                <Text
                  fontSize="sm"
                  color="gray.600"
                  lineClamp={1}
                  _dark={{ color: 'gray.300' }}
                >
                  {presentation.description}
                </Text>
                <Box
                  asChild
                  display="inline-flex"
                  color="green.700"
                  fontSize="sm"
                  fontWeight="750"
                  _hover={{ color: 'green.800', textDecoration: 'none' }}
                  _focusVisible={{
                    outline: '2px solid',
                    outlineColor: 'green.400',
                    outlineOffset: '2px',
                  }}
                  _dark={{ color: 'green.300', _hover: { color: 'green.200' } }}
                >
                  <Link href={presentation.href}>
                    <Flex align="center" gap={1}>
                      {presentation.cta}
                      <ArrowRight size={14} aria-hidden="true" />
                    </Flex>
                  </Link>
                </Box>
              </Flex>
            )}
          </Box>
        </Flex>
      </Flex>

      {match && team1 && team2 && selection.kind === 'live' ? (
        <Box
          mt={4}
          p={{ base: 3, md: 4 }}
          borderRadius="xl"
          bg="rgba(255, 255, 255, 0.78)"
          boxShadow="inset 0 0 0 1px rgba(22, 163, 74, 0.08)"
          display="grid"
          gridTemplateColumns={{
            base: 'minmax(0, 1fr) auto',
            md: 'minmax(0, 1fr) auto 18px auto minmax(0, 1fr)',
          }}
          gridTemplateAreas={{
            base: '"team1 score1" "divider divider" "team2 score2"',
            md: '"team1 score1 divider score2 team2"',
          }}
          alignItems="center"
          columnGap={{ base: 3, md: 4 }}
          rowGap={3}
          _dark={{
            bg: 'rgba(7, 17, 29, 0.52)',
            boxShadow: 'inset 0 0 0 1px rgba(74, 222, 128, 0.12)',
          }}
        >
          <Text
            gridArea="team1"
            minW={0}
            fontWeight="750"
            fontSize={{ base: 'sm', md: 'md' }}
            lineHeight="short"
            textAlign={{ base: 'left', md: 'right' }}
            lineClamp={2}
          >
            {team1}
          </Text>
          <Text
            gridArea="score1"
            minW={{ base: '36px', md: '32px' }}
            fontSize={{ base: '2xl', md: '2xl' }}
            fontWeight="900"
            lineHeight="1"
            textAlign="center"
          >
            {score1 ?? '–'}
          </Text>
          <Flex
            gridArea="divider"
            align="center"
            justify="center"
            color="gray.400"
            aria-hidden="true"
          >
            <Box
              display={{ base: 'block', md: 'none' }}
              h="1px"
              flex={1}
              bg="green.100"
              _dark={{ bg: 'green.800' }}
            />
            <Text px={{ base: 2, md: 0 }} fontWeight="700">
              –
            </Text>
            <Box
              display={{ base: 'block', md: 'none' }}
              h="1px"
              flex={1}
              bg="green.100"
              _dark={{ bg: 'green.800' }}
            />
          </Flex>
          <Text
            gridArea="score2"
            minW={{ base: '36px', md: '32px' }}
            fontSize={{ base: '2xl', md: '2xl' }}
            fontWeight="900"
            lineHeight="1"
            textAlign="center"
          >
            {score2 ?? '–'}
          </Text>
          <Text
            gridArea="team2"
            minW={0}
            fontWeight="750"
            fontSize={{ base: 'sm', md: 'md' }}
            lineHeight="short"
            lineClamp={2}
          >
            {team2}
          </Text>
        </Box>
      ) : match && team1 && team2 ? (
        <Flex
          mt={4}
          p={3}
          borderRadius="xl"
          bg="rgba(255, 255, 255, 0.72)"
          align="center"
          gap={3}
          _dark={{ bg: 'rgba(7, 17, 29, 0.46)' }}
        >
          <Text
            flex={1}
            minW={0}
            fontWeight="750"
            textAlign="right"
            lineClamp={2}
          >
            {team1}
          </Text>
          <Flex align="center" gap={2} flexShrink={0}>
            <Text
              fontSize="xs"
              fontWeight="800"
              color="gray.500"
              textTransform="uppercase"
            >
              {t('versus')}
            </Text>
          </Flex>
          <Text flex={1} minW={0} fontWeight="750" lineClamp={2}>
            {team2}
          </Text>
        </Flex>
      ) : null}

      {match ? (
        <Box
          asChild
          display="flex"
          mt={4}
          minH="46px"
          w={{ base: 'full', sm: 'fit-content' }}
          mx={{ base: 0, sm: 'auto' }}
          alignItems="center"
          justifyContent="center"
          borderRadius="lg"
          borderWidth="1px"
          borderColor="green.800"
          bg="green.700"
          color="white"
          fontWeight="800"
          boxShadow="0 8px 18px rgba(21, 128, 61, 0.22)"
          transitionProperty="background-color, border-color, box-shadow, transform"
          transitionDuration="0.15s"
          _hover={{
            bg: 'green.800',
            borderColor: 'green.900',
            boxShadow: '0 10px 22px rgba(21, 128, 61, 0.28)',
            transform: 'translateY(-1px)',
            textDecoration: 'none',
          }}
          _focusVisible={{
            outline: '2px solid',
            outlineColor: 'green.400',
            outlineOffset: '2px',
          }}
          _dark={{
            bg: 'green.500',
            borderColor: 'green.400',
            color: 'gray.950',
            _hover: { bg: 'green.400', borderColor: 'green.300' },
          }}
        >
          <Link href={presentation.href}>
            <Flex align="center" justify="center" gap={3} w="full" px={5}>
              {presentation.cta}
              <Flex
                align="center"
                justify="center"
                w="24px"
                h="24px"
                borderRadius="full"
                bg="whiteAlpha.200"
                flexShrink={0}
                _dark={{ bg: 'blackAlpha.200' }}
              >
                <ArrowRight size={15} strokeWidth={2.5} aria-hidden="true" />
              </Flex>
            </Flex>
          </Link>
        </Box>
      ) : null}
    </PulseShell>
  );
}

function PulseShell({
  kind,
  children,
}: {
  kind: PulseKind;
  children: React.ReactNode;
}) {
  const backgrounds: Record<PulseKind, string> = {
    live: 'linear-gradient(135deg, rgba(220, 252, 231, 0.98), rgba(204, 251, 241, 0.92))',
    next: 'linear-gradient(135deg, rgba(239, 246, 255, 0.98), rgba(236, 254, 255, 0.92))',
    finished:
      'linear-gradient(135deg, rgba(254, 249, 195, 0.98), rgba(255, 237, 213, 0.92))',
    preparing:
      'linear-gradient(135deg, rgba(240, 253, 244, 0.98), rgba(255, 255, 255, 0.96))',
    cancelled:
      'linear-gradient(135deg, rgba(254, 242, 242, 0.98), rgba(255, 255, 255, 0.96))',
  };

  return (
    <Box
      borderWidth="1px"
      borderColor={
        kind === 'finished'
          ? 'yellow.200'
          : kind === 'cancelled'
            ? 'red.200'
            : 'green.200'
      }
      borderRadius="xl"
      bg={backgrounds[kind]}
      boxShadow="0 10px 26px rgba(15, 23, 42, 0.06)"
      p={{ base: 3, md: 4 }}
      _dark={{
        bg: 'var(--tournament-surface-raised)',
        borderColor: 'var(--tournament-accent-border)',
      }}
    >
      {children}
    </Box>
  );
}

function selectPulseMatch(
  matches: CategoryMatch[],
  tournamentStatus: TournamentStatus
): PulseSelection {
  let liveMatch: CategoryMatch | undefined;
  let nextMatch: CategoryMatch | undefined;
  let nextTime = Number.POSITIVE_INFINITY;

  for (const match of matches) {
    if (match.status === MatchStatus.IN_PROGRESS) {
      if (
        !liveMatch ||
        getDateValue(match.startTime) < getDateValue(liveMatch.startTime)
      ) {
        liveMatch = match;
      }
      continue;
    }

    if (match.status !== MatchStatus.SCHEDULED) continue;
    const startTime = getDateValue(match.startTime);
    if (!nextMatch || startTime < nextTime) {
      nextMatch = match;
      nextTime = startTime;
    }
  }

  if (liveMatch) return { kind: 'live', match: liveMatch };
  if (nextMatch) return { kind: 'next', match: nextMatch };
  if (tournamentStatus === TournamentStatus.FINISHED) {
    return { kind: 'finished' };
  }
  if (tournamentStatus === TournamentStatus.CANCELLED) {
    return { kind: 'cancelled' };
  }
  return { kind: 'preparing' };
}

function getDateValue(value?: Date) {
  if (!value) return Number.POSITIVE_INFINITY;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
}

function getLatestScore(match: CategoryMatch, side: 1 | 2) {
  const aggregate = side === 1 ? match.player1Score : match.player2Score;
  if (aggregate !== undefined) return aggregate;

  const latestSet = match.sets?.[match.sets.length - 1];
  if (!latestSet) return null;
  return side === 1 ? latestSet.player1Score : latestSet.player2Score;
}

function getPulsePresentation(
  kind: PulseKind,
  slug: string,
  t: ReturnType<typeof useTranslations>
) {
  switch (kind) {
    case 'live':
      return {
        title: t('liveTitle'),
        description: t('liveDescription'),
        cta: t('viewLive'),
        href: `/tournament/${slug}/scoreboard`,
        icon: Radio,
        iconColor: 'green.600',
      };
    case 'next':
      return {
        title: t('nextTitle'),
        description: t('nextDescription'),
        cta: t('viewSchedule'),
        href: `/tournament/${slug}/schedule`,
        icon: CalendarClock,
        iconColor: 'blue.600',
      };
    case 'finished':
      return {
        title: t('finishedTitle'),
        description: t('finishedDescription'),
        cta: t('viewResults'),
        href: `/tournament/${slug}/standings`,
        icon: Trophy,
        iconColor: 'yellow.600',
      };
    case 'cancelled':
      return {
        title: t('cancelledTitle'),
        description: t('cancelledDescription'),
        cta: t('viewSchedule'),
        href: `/tournament/${slug}/schedule`,
        icon: CircleAlert,
        iconColor: 'red.600',
      };
    case 'preparing':
    default:
      return {
        title: t('preparingTitle'),
        description: t('preparingDescription'),
        cta: t('viewCategories'),
        href: `/tournament/${slug}/teams?view=category`,
        icon: CalendarClock,
        iconColor: 'green.600',
      };
  }
}
