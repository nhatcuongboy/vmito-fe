'use client';

import { memo } from 'react';
import { Badge, Box, Flex, Text } from '@chakra-ui/react';
import { useLocale, useTranslations } from 'next-intl';
import { Activity, Check, CircleSlash, Clock, Flag } from 'lucide-react';

import { Category, CategoryMatch, MatchStatus } from '@/lib/api/types';
import { getMatchDisplayCode } from '@/lib/tournament/codes';
import { getRoundDisplayLabel } from '@/lib/tournament/roundLabel';
import { resolveMatchSideLabel } from '@/lib/tournament/bracketSlots';
import { usePlayoffSlotLabels } from '@/lib/tournament/usePlayoffSlotLabels';
import { formatCourtWithVenue } from '@/lib/tournament/court';
import {
  formatTimeByDevicePreference,
  formatTimeRangeByDevicePreference,
} from '@/utils/time-helpers';
import { useElapsedMinuteTicker } from '@/hooks/useElapsedMinuteTicker';

const SCHEDULE_MATCH_CARD_ID_PREFIX = 'schedule-match-card-';

export function makeScheduleMatchCardDomId(matchId: string) {
  return `${SCHEDULE_MATCH_CARD_ID_PREFIX}${matchId}`;
}

interface ResultMatchCardProps {
  match: CategoryMatch;
  /** Category name shown as a badge on the card. */
  categoryName?: string;
  /** Kept for call-site compatibility; clickability is gated on onSelect. */
  canEdit?: boolean;
  onSelect: (match: CategoryMatch) => void;
  compact?: boolean;
  /** Pre-resolved group name or round label; falls back to the round label. */
  roundOrGroupLabel?: string;
  /** Venue acronym prefixed to the court (e.g. "R · Court 1"). */
  courtAbbreviation?: string;
  /** All category matches, used to resolve empty elimination slots to feeders. */
  allMatches?: CategoryMatch[];
  /**
   * Fingerprint of the label-relevant match data. When supplied, memoization
   * can ignore score-only changes to the allMatches array.
   */
  labelContextVersion?: string;
  /** The match's category, used to resolve first-round seed labels. */
  category?: Category;
  /** When true, render the joined player full names instead of pair/team name. */
  showPlayerNames?: boolean;
  /** Optional DOM id for restoring scroll/focus from another route. */
  domId?: string;
}

function ResultMatchCardComponent({
  match,
  categoryName,
  onSelect,
  compact = false,
  roundOrGroupLabel,
  courtAbbreviation,
  allMatches,
  category,
  showPlayerNames = false,
  domId,
}: ResultMatchCardProps) {
  const t = useTranslations('pages.tournaments.manualScore');
  const tRounds = useTranslations('pages.tournaments.manualScore.rounds');
  const locale = useLocale();
  const slotLabels = usePlayoffSlotLabels();
  const accent = getMatchAccent(match);

  const ctx = {
    allMatches: allMatches ?? [],
    category,
    labels: slotLabels,
    showPlayerNames,
  };
  const team1 = resolveMatchSideLabel(match, 1, ctx);
  const team2 = resolveMatchSideLabel(match, 2, ctx);
  const win1 = match.winnerId === getRegistrationId(match, 1);
  const win2 = match.winnerId === getRegistrationId(match, 2);
  const topLabel =
    roundOrGroupLabel ?? getRoundDisplayLabel(match.round, tRounds);
  const isInProgress = match.status === MatchStatus.IN_PROGRESS;
  const startTimeMs = match.startTime
    ? new Date(match.startTime).getTime()
    : undefined;
  const now = useElapsedMinuteTicker(isInProgress ? startTimeMs : undefined);
  const timeLabel = getMatchTimeLabel(match);
  const elapsedLabel =
    isInProgress && match.startTime
      ? formatCompactElapsedTime(match.startTime, now, locale, t('justStarted'))
      : '';
  const courtLabel = match.court
    ? formatCourtWithVenue(match.court, t('court'), courtAbbreviation)
    : '';
  const sets = match.sets ?? [];
  const multiSet = sets.length > 1;
  const score1 = match.player1Score ?? getLastSetScore(match, 1);
  const score2 = match.player2Score ?? getLastSetScore(match, 2);
  const statusTone = getMatchStatusTone(match, t);
  const StatusIcon = statusTone.icon;

  return (
    <Box
      id={domId}
      w="full"
      textAlign="left"
      borderWidth="1px"
      borderColor={accent.border}
      _dark={{
        borderColor:
          match.status === MatchStatus.IN_PROGRESS
            ? 'rgba(45, 212, 191, 0.36)'
            : 'var(--tournament-border, var(--chakra-colors-gray-700))',
        bg: 'var(--tournament-surface-raised, var(--chakra-colors-gray-800))',
        boxShadow:
          match.status === MatchStatus.IN_PROGRESS
            ? '0 0 0 1px rgba(45, 212, 191, 0.14), 0 18px 42px rgba(20, 184, 166, 0.14)'
            : 'var(--tournament-shadow-soft)',
        _hover: {
          borderColor:
            match.status === MatchStatus.IN_PROGRESS
              ? 'rgba(94, 234, 212, 0.52)'
              : 'rgba(148, 163, 184, 0.32)',
          boxShadow:
            match.status === MatchStatus.IN_PROGRESS
              ? '0 0 0 1px rgba(45, 212, 191, 0.2), 0 22px 48px rgba(20, 184, 166, 0.18)'
              : '0 18px 42px rgba(0, 0, 0, 0.3)',
        },
      }}
      borderTopWidth="4px"
      borderTopColor={accent.stripe}
      borderRadius="xl"
      bg="white"
      boxShadow={accent.shadow}
      p={{ base: 4, md: compact ? 3 : 5 }}
      cursor="pointer"
      transition="border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease"
      _hover={{
        borderColor: accent.hoverBorder,
        transform: 'translateY(-2px)',
        boxShadow: accent.hoverShadow,
      }}
      _focusVisible={{
        outline: '2px solid',
        outlineColor: 'green.400',
        outlineOffset: '2px',
      }}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(match)}
      onKeyDown={(event: React.KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect(match);
        }
      }}
    >
      <Flex justify="space-between" align="start" gap={3} mb={compact ? 2 : 3}>
        <Flex direction="column" gap={1} minW={0} flex={1}>
          {(categoryName || topLabel) && (
            <Flex align="center" gap={1.5} wrap="wrap">
              {categoryName && (
                <Badge
                  colorPalette="green"
                  variant="subtle"
                  borderRadius="full"
                  px={2}
                  py={0.5}
                  fontSize="xs"
                  fontWeight="semibold"
                >
                  {categoryName}
                </Badge>
              )}
              {topLabel && (
                <Badge
                  colorPalette="gray"
                  variant="subtle"
                  borderRadius="full"
                  px={2}
                  py={0.5}
                  fontSize="xs"
                  fontWeight="medium"
                >
                  {topLabel}
                </Badge>
              )}
            </Flex>
          )}
          <Text
            fontSize="sm"
            color="gray.600"
            _dark={{
              color:
                'var(--tournament-text-muted, var(--chakra-colors-gray-300))',
            }}
            lineClamp={1}
            minW={0}
          >
            {getMatchDisplayCode(match)}
            {courtLabel ? ` · ${courtLabel}` : ''}
            {timeLabel ? ` · ${timeLabel}` : ''}
          </Text>
        </Flex>
        <Flex
          direction="column"
          align="flex-end"
          justify="flex-start"
          gap={1.5}
          flexShrink={0}
        >
          <Badge
            colorPalette={statusTone.colorPalette}
            variant={statusTone.variant}
            borderRadius="full"
            px={{ base: 2, md: 2.5 }}
            py={0.5}
            fontSize="xs"
            fontWeight="semibold"
            whiteSpace="nowrap"
            flexShrink={0}
          >
            <Flex align="center" gap={1.5}>
              <StatusIcon size={14} aria-hidden="true" />
              <Text as="span">{statusTone.label}</Text>
            </Flex>
          </Badge>
          {isInProgress && elapsedLabel && (
            <Badge
              colorPalette="green"
              variant="subtle"
              borderRadius="full"
              px={{ base: 2, md: 2.5 }}
              py={0.5}
              fontSize="2xs"
              fontWeight="semibold"
              whiteSpace="nowrap"
              flexShrink={0}
            >
              {elapsedLabel}
            </Badge>
          )}
        </Flex>
      </Flex>

      <Box>
        <CardTeamRow
          label={team1}
          highlight={win1}
          total={score1}
          setScores={sets.map((s) => s.player1Score)}
          setWins={sets.map((s) => s.player1Score > s.player2Score)}
          multiSet={multiSet}
        />
        <CardTeamRow
          label={team2}
          highlight={win2}
          total={score2}
          setScores={sets.map((s) => s.player2Score)}
          setWins={sets.map((s) => s.player2Score > s.player1Score)}
          multiSet={multiSet}
        />
      </Box>
    </Box>
  );
}

export const ResultMatchCard = memo(
  ResultMatchCardComponent,
  areResultMatchCardPropsEqual
);
ResultMatchCard.displayName = 'ResultMatchCard';

function areResultMatchCardPropsEqual(
  previous: ResultMatchCardProps,
  next: ResultMatchCardProps
) {
  const labelContextIsEqual =
    previous.labelContextVersion !== undefined ||
    next.labelContextVersion !== undefined
      ? previous.labelContextVersion === next.labelContextVersion
      : previous.allMatches === next.allMatches;

  return (
    previous.match === next.match &&
    previous.categoryName === next.categoryName &&
    previous.canEdit === next.canEdit &&
    previous.onSelect === next.onSelect &&
    previous.compact === next.compact &&
    previous.roundOrGroupLabel === next.roundOrGroupLabel &&
    previous.courtAbbreviation === next.courtAbbreviation &&
    labelContextIsEqual &&
    previous.category === next.category &&
    previous.showPlayerNames === next.showPlayerNames &&
    previous.domId === next.domId
  );
}

function getMatchTimeLabel(match: CategoryMatch) {
  if (!match.startTime) return '';

  if (match.status === MatchStatus.FINISHED && match.endTime) {
    return formatTimeRangeByDevicePreference(match.startTime, match.endTime);
  }

  return formatTimeByDevicePreference(match.startTime);
}

function formatCompactElapsedTime(
  startTime: string | Date,
  now: number,
  locale: string,
  justStartedLabel: string
) {
  const start = new Date(startTime).getTime();
  if (!Number.isFinite(start)) return '';

  const elapsedMinutes = Math.max(0, Math.floor((now - start) / 60_000));
  if (elapsedMinutes < 1) return justStartedLabel;

  const hours = Math.floor(elapsedMinutes / 60);
  const minutes = elapsedMinutes % 60;

  if (locale.startsWith('vi')) {
    if (hours > 0) return `${hours}g ${String(minutes).padStart(2, '0')}p`;
    return `${elapsedMinutes}p`;
  }

  if (locale.startsWith('zh') || locale.startsWith('cn')) {
    if (hours > 0) return `${hours}时${String(minutes).padStart(2, '0')}分`;
    return `${elapsedMinutes}分`;
  }

  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  return `${elapsedMinutes}m`;
}

function CardTeamRow({
  label,
  highlight,
  total,
  setScores,
  setWins,
  multiSet,
}: {
  label: string;
  highlight: boolean;
  total?: number;
  setScores: number[];
  setWins: boolean[];
  multiSet: boolean;
}) {
  const scoreColumnCount = Math.max(setScores.length, 1);
  const scoreGridWidth = {
    base: `${scoreColumnCount * 26}px`,
    md: `${scoreColumnCount * 34}px`,
  };

  return (
    <Box
      display="grid"
      gridTemplateColumns={
        multiSet ? 'minmax(0, 1fr) auto' : 'minmax(0, 1fr) 32px'
      }
      alignItems="center"
      columnGap={{ base: 2.5, md: 3 }}
      py={1}
      minW={0}
    >
      <Text
        fontSize={{ base: 'sm', md: 'md' }}
        fontWeight={highlight ? 'bold' : 'medium'}
        lineClamp={1}
        minW={0}
        pr={1}
      >
        {label}
      </Text>
      {multiSet ? (
        <Box
          display="grid"
          gridTemplateColumns={`repeat(${scoreColumnCount}, minmax(0, 1fr))`}
          w={scoreGridWidth}
          flexShrink={0}
        >
          {setScores.map((score, index) => (
            <Text
              key={index}
              textAlign="center"
              fontSize={{ base: 'sm', md: 'md' }}
              fontWeight={setWins[index] ? 'bold' : 'normal'}
              color={setWins[index] ? 'fg' : 'gray.400'}
              fontVariantNumeric="tabular-nums"
              lineHeight="1.15"
              whiteSpace="nowrap"
              minW={0}
            >
              {score}
            </Text>
          ))}
        </Box>
      ) : (
        total !== undefined && (
          <Text
            fontSize={{ base: 'sm', md: 'md' }}
            fontWeight={highlight ? 'bold' : 'medium'}
            textAlign="center"
            fontVariantNumeric="tabular-nums"
            lineHeight="1.15"
            whiteSpace="nowrap"
          >
            {total}
          </Text>
        )
      )}
    </Box>
  );
}

function getLastSetScore(match: CategoryMatch, side: 1 | 2) {
  const lastSet = match.sets?.[match.sets.length - 1];
  if (!lastSet) return undefined;
  return side === 1 ? lastSet.player1Score : lastSet.player2Score;
}

function getRegistrationId(match: CategoryMatch, position: 1 | 2) {
  return match.participants?.find((item) => item.position === position)
    ?.categoryRegistrationId;
}

function getMatchAccent(match: CategoryMatch) {
  // Top-stripe accent — uses the app's primary green by default.
  if (match.isForfeit) {
    return {
      stripe: 'orange.400',
      border: 'orange.200',
      hoverBorder: 'orange.300',
      shadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
      hoverShadow: '0 10px 24px rgba(194, 65, 12, 0.14)',
    };
  }
  if (match.status === MatchStatus.IN_PROGRESS) {
    return {
      stripe: 'green.500',
      border: 'green.300',
      hoverBorder: 'green.400',
      shadow:
        '0 0 0 1px rgba(34, 197, 94, 0.16), 0 8px 24px rgba(22, 163, 74, 0.12)',
      hoverShadow: '0 12px 28px rgba(22, 163, 74, 0.18)',
    };
  }
  if (match.status === MatchStatus.FINISHED) {
    return {
      stripe: 'gray.400',
      border: 'gray.200',
      hoverBorder: 'gray.300',
      shadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
      hoverShadow: '0 10px 24px rgba(15, 23, 42, 0.10)',
    };
  }
  if (match.status === MatchStatus.CANCELLED) {
    return {
      stripe: 'red.400',
      border: 'gray.200',
      hoverBorder: 'red.300',
      shadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
      hoverShadow: '0 10px 24px rgba(185, 28, 28, 0.12)',
    };
  }
  // Scheduled / default.
  return {
    stripe: 'blue.400',
    border: 'blue.100',
    hoverBorder: 'blue.300',
    shadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
    hoverShadow: '0 12px 28px rgba(37, 99, 235, 0.12)',
  };
}

function getMatchStatusTone(
  match: CategoryMatch,
  t: ReturnType<typeof useTranslations>
) {
  if (match.isForfeit) {
    return {
      label: t('filters.statusForfeited'),
      colorPalette: 'orange',
      variant: 'solid',
      icon: Flag,
    } as const;
  }

  if (match.status === MatchStatus.IN_PROGRESS) {
    return {
      label: t('status.IN_PROGRESS'),
      colorPalette: 'green',
      variant: 'solid',
      icon: Activity,
    } as const;
  }

  if (match.status === MatchStatus.FINISHED) {
    return {
      label: t('status.FINISHED'),
      colorPalette: 'gray',
      variant: 'solid',
      icon: Check,
    } as const;
  }

  if (match.status === MatchStatus.CANCELLED) {
    return {
      label: t('status.CANCELLED'),
      colorPalette: 'red',
      variant: 'solid',
      icon: CircleSlash,
    } as const;
  }

  return {
    label: t(`matchCardStatus.${match.status}`),
    colorPalette: 'blue',
    variant: 'subtle',
    icon: Clock,
  } as const;
}
