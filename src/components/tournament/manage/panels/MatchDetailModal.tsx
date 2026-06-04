'use client';

import { useEffect, useState } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  ModalHeader,
} from '@/components/ui/ChakraModal';
import { useTranslations } from 'next-intl';
import {
  CalendarDays,
  MapPin,
  MoreVertical,
  RotateCcw,
  SquarePen,
  Trash2,
  Trophy,
} from 'lucide-react';

import { Category, CategoryMatch } from '@/lib/api/types';
import { resolveMatchSideLabel } from '@/lib/tournament/bracketSlots';
import { usePlayoffSlotLabels } from '@/lib/tournament/usePlayoffSlotLabels';
import { getMatchDisplayCode } from '@/lib/tournament/codes';
import { formatTimeByDevicePreference } from '@/utils/time-helpers';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  match: CategoryMatch | null;
  categoryName: string;
  /** Pre-resolved group name or round label (e.g. "Pool A", "Semi Finals"). */
  roundOrGroupLabel: string;
  /** Pre-formatted court label (e.g. "R · Court 1"). */
  courtLabel?: string;
  /** All category matches, used to resolve empty elimination slots to feeders. */
  allMatches?: CategoryMatch[];
  /** The match's category, used to resolve first-round seed labels. */
  category?: Category;
  canEdit: boolean;
  onEditResult: (match: CategoryMatch) => void;
  onDeleteMatch: (match: CategoryMatch) => void;
}

type DetailTab = 'details' | 'stats';

export default function MatchDetailModal({
  isOpen,
  onClose,
  match,
  categoryName,
  roundOrGroupLabel,
  courtLabel,
  allMatches,
  category,
  canEdit,
  onEditResult,
  onDeleteMatch,
}: Props) {
  const t = useTranslations('pages.tournaments.manualScore');
  const slotLabels = usePlayoffSlotLabels();
  const [tab, setTab] = useState<DetailTab>('details');
  const [optionsOpen, setOptionsOpen] = useState(false);

  // Reset transient UI each time the modal is opened or the match changes.
  useEffect(() => {
    if (!isOpen) {
      setOptionsOpen(false);
      return;
    }
    setTab('details');
    setOptionsOpen(false);
  }, [isOpen, match?.id]);

  if (!match) return null;

  const labelCtx = {
    allMatches: allMatches ?? [],
    category,
    labels: slotLabels,
  };
  const team1 = resolveMatchSideLabel(match, 1, labelCtx);
  const team2 = resolveMatchSideLabel(match, 2, labelCtx);
  const score1 = totalScore(match, 1);
  const score2 = totalScore(match, 2);
  const win1 = isWinner(match, 1);
  const win2 = isWinner(match, 2);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalCloseButton onClose={onClose} />
      <ModalHeader>
        <Text fontSize="sm" fontWeight="medium" color="gray.500">
          {getMatchDisplayCode(match)} · {roundOrGroupLabel}
        </Text>
      </ModalHeader>

      <ModalBody>
        {/* Scoreboard */}
        <Box mb={5}>
          <ScoreRow label={team1} score={score1} highlight={win1} />
          <ScoreRow label={team2} score={score2} highlight={win2} />
        </Box>

        {/* Tab switcher */}
        <Flex
          p={1}
          gap={1}
          bg="gray.100"
          _dark={{ bg: 'gray.700' }}
          borderRadius="full"
          mb={4}
        >
          <TabButton
            active={tab === 'details'}
            onClick={() => setTab('details')}
          >
            {t('matchDetail.tabDetails')}
          </TabButton>
          <TabButton active={tab === 'stats'} onClick={() => setTab('stats')}>
            {t('matchDetail.tabStats')}
          </TabButton>
        </Flex>

        {tab === 'details' ? (
          <DetailsTab
            match={match}
            categoryName={categoryName}
            roundOrGroupLabel={roundOrGroupLabel}
            courtLabel={courtLabel}
          />
        ) : (
          <StatsTab match={match} team1={team1} team2={team2} />
        )}
      </ModalBody>

      {canEdit && (
        <ModalFooter justifyContent="space-between">
          <Button
            flex="1"
            variant="outline"
            colorPalette="gray"
            onClick={() => onEditResult(match)}
          >
            <SquarePen size={16} /> {t('matchDetail.editResult')}
          </Button>

          <Box position="relative" flex="1">
            <Button
              w="full"
              variant="outline"
              colorPalette="gray"
              onClick={() => setOptionsOpen((open) => !open)}
            >
              <MoreVertical size={16} /> {t('matchDetail.matchOptions')}
            </Button>
            {optionsOpen && (
              <Box
                position="absolute"
                bottom="calc(100% + 8px)"
                right={0}
                minW="180px"
                bg="white"
                _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="lg"
                boxShadow="lg"
                p={1}
                zIndex={10}
              >
                <Button
                  w="full"
                  variant="ghost"
                  colorPalette="red"
                  color="red.500"
                  justifyContent="flex-start"
                  onClick={() => {
                    setOptionsOpen(false);
                    onDeleteMatch(match);
                  }}
                >
                  <Trash2 size={14} /> {t('deleteMatch')}
                </Button>
              </Box>
            )}
          </Box>
        </ModalFooter>
      )}
    </Modal>
  );
}

function DetailsTab({
  match,
  categoryName,
  roundOrGroupLabel,
  courtLabel,
}: {
  match: CategoryMatch;
  categoryName: string;
  roundOrGroupLabel: string;
  courtLabel?: string;
}) {
  const start = match.startTime ? new Date(match.startTime) : null;

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      <InfoRow icon={<RotateCcw size={18} />} title={roundOrGroupLabel}>
        {categoryName}
      </InfoRow>

      {start && (
        <InfoRow
          icon={<CalendarDays size={18} />}
          title={formatTimeByDevicePreference(start)}
        >
          {start.toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </InfoRow>
      )}

      {courtLabel && <InfoRow icon={<MapPin size={18} />} title={courtLabel} />}
    </Box>
  );
}

function StatsTab({
  match,
  team1,
  team2,
}: {
  match: CategoryMatch;
  team1: string;
  team2: string;
}) {
  const t = useTranslations('pages.tournaments.manualScore');
  const sets = match.sets ?? [];
  const total1 = totalScore(match, 1) ?? 0;
  const total2 = totalScore(match, 2) ?? 0;
  const sum = total1 + total2;
  const pct1 = sum > 0 ? (total1 / sum) * 100 : 50;

  return (
    <Box display="flex" flexDirection="column" gap={5}>
      <Box>
        <Flex justify="space-between" align="center" mb={2}>
          <Text fontWeight="black" fontSize="lg">
            {total1}
          </Text>
          <Text fontSize="sm" fontWeight="semibold" color="gray.600">
            {t('points')}
          </Text>
          <Text fontWeight="black" fontSize="lg">
            {total2}
          </Text>
        </Flex>
        <Flex h="8px" borderRadius="full" overflow="hidden" bg="gray.100">
          <Box w={`${pct1}%`} bg="yellow.400" />
          <Box flex="1" bg="yellow.200" />
        </Flex>
      </Box>

      {sets.length > 1 && (
        <Box>
          <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={2}>
            {t('matchDetail.bySet')}
          </Text>
          <Box display="flex" flexDirection="column" gap={2}>
            <SetStatsRow
              label={team1}
              scores={sets.map((s) => s.player1Score)}
              winnerFlags={sets.map((s) => s.player1Score > s.player2Score)}
            />
            <SetStatsRow
              label={team2}
              scores={sets.map((s) => s.player2Score)}
              winnerFlags={sets.map((s) => s.player2Score > s.player1Score)}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
}

function SetStatsRow({
  label,
  scores,
  winnerFlags,
}: {
  label: string;
  scores: number[];
  winnerFlags: boolean[];
}) {
  return (
    <Flex align="center" justify="space-between" gap={3}>
      <Text fontSize="sm" lineClamp={1} flex="1" minW={0}>
        {label}
      </Text>
      <Flex gap={3} flexShrink={0}>
        {scores.map((score, index) => (
          <Text
            key={index}
            w="22px"
            textAlign="center"
            fontWeight={winnerFlags[index] ? 'bold' : 'normal'}
            color={winnerFlags[index] ? 'fg' : 'gray.500'}
          >
            {score}
          </Text>
        ))}
      </Flex>
    </Flex>
  );
}

function ScoreRow({
  label,
  score,
  highlight,
}: {
  label: string;
  score?: number;
  highlight: boolean;
}) {
  return (
    <Flex align="center" justify="space-between" gap={3} py={1}>
      <Flex align="center" gap={2} minW={0}>
        {highlight && (
          <Trophy size={18} color="var(--chakra-colors-green-500)" />
        )}
        <Text
          fontSize="2xl"
          fontWeight={highlight ? 'bold' : 'medium'}
          lineClamp={1}
        >
          {label}
        </Text>
      </Flex>
      {score !== undefined && (
        <Text fontSize="2xl" fontWeight={highlight ? 'bold' : 'medium'}>
          {score}
        </Text>
      )}
    </Flex>
  );
}

function InfoRow({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <Flex align="center" gap={3}>
      <Flex
        align="center"
        justify="center"
        w="44px"
        h="44px"
        flexShrink={0}
        borderWidth="1px"
        borderColor="gray.200"
        _dark={{ borderColor: 'gray.700' }}
        borderRadius="lg"
        color="gray.600"
      >
        {icon}
      </Flex>
      <Box minW={0}>
        <Text fontWeight="semibold" lineClamp={1}>
          {title}
        </Text>
        {children && (
          <Text fontSize="sm" color="gray.500" lineClamp={1}>
            {children}
          </Text>
        )}
      </Box>
    </Flex>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Box
      as="button"
      flex="1"
      py={2}
      borderRadius="full"
      fontWeight="semibold"
      fontSize="sm"
      bg={active ? 'white' : 'transparent'}
      color={active ? 'fg' : 'gray.500'}
      boxShadow={active ? 'sm' : 'none'}
      _dark={{ bg: active ? 'gray.900' : 'transparent' }}
      onClick={onClick}
    >
      {children}
    </Box>
  );
}

function regId(match: CategoryMatch, position: 1 | 2) {
  return match.participants?.find((item) => item.position === position)
    ?.categoryRegistrationId;
}

function lastSetScore(match: CategoryMatch, side: 1 | 2) {
  const lastSet = match.sets?.[match.sets.length - 1];
  if (!lastSet) return undefined;
  return side === 1 ? lastSet.player1Score : lastSet.player2Score;
}

function totalScore(match: CategoryMatch, side: 1 | 2) {
  const direct = side === 1 ? match.player1Score : match.player2Score;
  if (direct !== undefined && direct !== null) return direct;
  return lastSetScore(match, side);
}

function isWinner(match: CategoryMatch, side: 1 | 2) {
  return !!match.winnerId && match.winnerId === regId(match, side);
}
